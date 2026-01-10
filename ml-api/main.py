"""
CloverShield ML Inference API
FastAPI microservice for fraud detection predictions
"""

import os
import sys
import time
import uuid
import shutil
import json
from typing import Optional, Dict, List
from datetime import datetime

import pandas as pd
import numpy as np
from fastapi import FastAPI, HTTPException, Header, BackgroundTasks, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field, validator
import uvicorn
from supabase import create_client, Client

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from inference import FraudInference, load_inference_engine
from simulation import simulation_manager, SimulationConfig
from training_service import train_model_async
from utils.audit import AuditLogger
import warnings

# Suppress warnings
warnings.filterwarnings('ignore')

# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class TransactionInput(BaseModel):
    """Transaction input model"""
    step: Optional[int] = Field(default=1, ge=0, description="Time step")
    type: str = Field(..., description="Transaction type")
    amount: float = Field(..., gt=0, description="Transaction amount")
    nameOrig: str = Field(..., description="Sender user ID")
    oldBalanceOrig: float = Field(..., ge=0, description="Sender balance before")
    newBalanceOrig: float = Field(..., ge=0, description="Sender balance after")
    nameDest: str = Field(..., description="Receiver user ID")
    oldBalanceDest: float = Field(..., ge=0, description="Receiver balance before")
    newBalanceDest: float = Field(..., ge=0, description="Receiver balance after")
    
    @validator('type')
    def validate_type(cls, v):
        allowed = ['CASH_OUT', 'TRANSFER', 'CASH_IN', 'PAYMENT', 'DEBIT']
        if v not in allowed:
            raise ValueError(f"Transaction type must be one of {allowed}")
        return v
    
    @validator('nameDest')
    def validate_different_accounts(cls, v, values):
        if 'nameOrig' in values and v == values['nameOrig']:
            raise ValueError("Sender and receiver cannot be the same")
        return v

class PredictionOptions(BaseModel):
    """Prediction options"""
    include_shap: bool = Field(default=True, description="Include SHAP explanations")
    include_llm_explanation: bool = Field(default=False, description="Include LLM explanation")
    language: str = Field(default='en', description="Language for explanations")
    topk: int = Field(default=10, ge=1, le=20, description="Number of top features")
    
    @validator('language')
    def validate_language(cls, v):
        if v not in ['en', 'bn']:
            raise ValueError("Language must be 'en' or 'bn'")
        return v

class PredictRequest(BaseModel):
    """Request model for /predict endpoint"""
    transaction: TransactionInput
    options: Optional[PredictionOptions] = Field(default_factory=PredictionOptions)

class SHAPExplanation(BaseModel):
    """SHAP explanation model"""
    feature: str
    value: float
    shap: float
    shap_abs: float
    rank: int

class PredictionResult(BaseModel):
    """Prediction result model"""
    fraud_probability: float = Field(..., ge=0, le=1)
    decision: str = Field(..., description="pass, warn, or block")
    risk_level: str = Field(..., description="low, medium, or high")
    confidence: float = Field(..., ge=0, le=1)

class PredictResponse(BaseModel):
    """Response model for /predict endpoint"""
    transaction_id: str
    prediction: PredictionResult
    shap_explanations: Optional[List[SHAPExplanation]] = None
    llm_explanation: Optional[Dict[str, str]] = None
    processing_time_ms: int
    model_version: str
    timestamp: str

class BatchPredictRequest(BaseModel):
    """Request model for batch prediction"""
    transactions: List[TransactionInput]
    options: Optional[PredictionOptions] = Field(default_factory=PredictionOptions)

class BatchPredictResponse(BaseModel):
    """Response model for batch prediction"""
    results: List[Dict]
    processing_time_ms: int
    total_transactions: int

class TrainingConfig(BaseModel):
    """Configuration for model training"""
    test_split: float = Field(default=0.05, ge=0.01, le=0.5)
    n_estimators: int = Field(default=300, ge=10, le=2000)
    max_depth: int = Field(default=6, ge=1, le=20)
    learning_rate: float = Field(default=0.05, ge=0.001, le=1.0)
    pagerank_limit: int = Field(default=10000, ge=0)
    advanced_preprocessing: bool = Field(default=False, description="Apply advanced preprocessing (SMOTE)")
    advanced_feature_engineering: bool = Field(default=False, description="Generate advanced features (Balance errors, Interaction strength)")
    name: str = Field(default="Custom Model")
    version: str = Field(default="1.0")

class TrainingResponse(BaseModel):
    """Response for training initiation"""
    job_id: str
    status: str
    message: str

class ModelItem(BaseModel):
    """Model registry item"""
    id: str
    name: str
    version: Optional[str]
    status: str
    metrics: Optional[Dict]
    is_active: bool
    created_at: str

# ============================================================================
# FASTAPI APP
# ============================================================================

app = FastAPI(
    title="CloverShield ML Inference API",
    description="Fraud detection ML service for CloverShield platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware - configure allowed origins for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Restrict to specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# GLOBAL STATE
# ============================================================================

inference_engine: Optional[FraudInference] = None
cached_feature_engineer = None
model_loading_lock = False
MODEL_VERSION = "1.0.0"
MODEL_THRESHOLD = float(os.getenv("MODEL_THRESHOLD", "0.0793"))

# Supabase Client
supabase_url: str = os.environ.get("SUPABASE_URL")
supabase_key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") # Use Service Role Key for backend updates
supabase: Client = create_client(supabase_url, supabase_key) if supabase_url and supabase_key else None

# Audit Logger
audit_logger = AuditLogger(supabase) if supabase else None

# Risk thresholds (matching config.py)
RISK_THRESHOLDS = {
    "pass": 0.30,
    "warn": 0.30,
    "block": 0.70
}

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def load_model():
    """Load the ML model on startup"""
    global inference_engine, model_loading_lock
    
    # Prevent concurrent loading attempts
    if model_loading_lock:
        return
    model_loading_lock = True
    
    model_path = os.getenv("MODEL_PATH", "Models/fraud_pipeline_final.pkl")
    test_dataset_path = os.getenv("TEST_DATASET_PATH", None)
    groq_api_key = os.getenv("GROQ_API_KEY")
    pagerank_limit = os.getenv("PAGERANK_LIMIT", None)
    
    # Convert pagerank_limit to int if provided
    if pagerank_limit:
        try:
            pagerank_limit = int(pagerank_limit)
        except ValueError:
            pagerank_limit = None
    
    # Try multiple paths for model
    possible_paths = [
        model_path,
        f"/app/{model_path}",
        f"/app/Models/fraud_pipeline_final.pkl",
        "Models/fraud_pipeline_final.pkl",
        "../Models/fraud_pipeline_final.pkl"
    ]
    
    actual_path = None
    for path in possible_paths:
        if os.path.exists(path):
            actual_path = path
            break
    
    if actual_path is None:
        raise FileNotFoundError(
            f"Model file not found. Tried: {possible_paths}\n"
            "Please ensure the model file is available."
        )
    
    try:
        # Validate file exists and is readable
        if not os.path.exists(actual_path):
            raise FileNotFoundError(f"Model file not found at {actual_path}")
        
        # Check file size (should be at least 1MB for a valid model)
        file_size = os.path.getsize(actual_path) / (1024 * 1024)
        if file_size < 1:
            raise ValueError(
                f"Model file is too small ({file_size:.1f} MB). "
                f"Expected at least 1MB. The file may be corrupted or incomplete."
            )
        
        # Try to load the model with test dataset for feature engineering
        inference_engine = load_inference_engine(
            model_path=actual_path,
            test_dataset_path=test_dataset_path,
            threshold=MODEL_THRESHOLD,
            groq_api_key=groq_api_key,
            pagerank_limit=pagerank_limit
        )
        print(f"✅ Model loaded successfully from {actual_path} ({file_size:.1f} MB)")
    except FileNotFoundError as e:
        error_msg = f"❌ Model file not found: {str(e)}"
        print(error_msg)
        raise FileNotFoundError(error_msg) from e
    except ValueError as e:
        error_msg = f"❌ Invalid model file: {str(e)}"
        print(error_msg)
        raise ValueError(error_msg) from e
    except Exception as e:
        error_msg = f"❌ Error loading model: {str(e)}"
        print(error_msg)
        print(f"   Model path: {actual_path}")
        print(f"   File exists: {os.path.exists(actual_path) if actual_path else False}")
        if actual_path and os.path.exists(actual_path):
            print(f"   File size: {os.path.getsize(actual_path) / (1024 * 1024):.1f} MB")
        raise Exception(error_msg) from e
    finally:
        model_loading_lock = False

def ensure_model_loaded():
    """Ensure model is loaded, try to load if not loaded (lazy loading for serverless)"""
    global inference_engine, model_loading_lock
    
    if inference_engine is not None:
        return True
    
    # Try to load if not already loading
    if not model_loading_lock:
        try:
            print("🔄 Model not loaded, attempting to load now...")
            load_model()
            return inference_engine is not None
        except Exception as e:
            print(f"⚠️ Failed to load model on demand: {str(e)}")
            return False
    return False

def calculate_decision(probability: float) -> tuple[str, str]:
    """Calculate decision and risk level from probability"""
    if probability >= RISK_THRESHOLDS['block']:
        return 'block', 'high'
    elif probability >= RISK_THRESHOLDS['warn']:
        return 'warn', 'medium'
    else:
        return 'pass', 'low'

def calculate_confidence(probability: float) -> float:
    """Calculate confidence level based on probability"""
    if probability < 0.1 or probability > 0.9:
        return 0.9
    elif probability < 0.2 or probability > 0.8:
        return 0.75
    elif probability < 0.3 or probability > 0.7:
        return 0.6
    else:
        return 0.4

def transaction_to_dataframe(transaction: TransactionInput) -> pd.DataFrame:
    """Convert transaction input to DataFrame"""
    data = {
        'step': transaction.step or 1,
        'type': transaction.type,
        'amount': float(transaction.amount),
        'nameOrig': transaction.nameOrig,
        'oldBalanceOrig': float(transaction.oldBalanceOrig),
        'newBalanceOrig': float(transaction.newBalanceOrig),
        'nameDest': transaction.nameDest,
        'oldBalanceDest': float(transaction.oldBalanceDest),
        'newBalanceDest': float(transaction.newBalanceDest),
        'isFlaggedFraud': 0
    }
    return pd.DataFrame([data])

# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Load model on startup"""
    port = os.getenv("PORT", "7860")
    print(f"🚀 Server starting on port {port}")
    print("📦 Loading model...")
    
    try:
        load_model()
        if inference_engine is not None:
            print("✅ Model loaded successfully - API is ready!")
        else:
            print("⚠️ Warning: Model loading completed but inference_engine is None")
            print("⚠️ API will attempt lazy loading on first request")
    except Exception as e:
        print(f"⚠️ Warning: Model not loaded on startup: {str(e)}")
        print("⚠️ API will attempt lazy loading on first request")
        print("⚠️ This is normal for serverless environments (e.g., Vercel)")
        
    # Load simulation dataset
    try:
        print("📦 Loading simulation dataset...")
        # Try to find the dataset
        possible_paths = [
            "dataset/test_dataset.csv.gz", 
            "dataset/test_dataset.csv",
            "../dataset/test_dataset.csv.gz"
        ]
        
        path_to_use = "dataset/test_dataset.csv.gz" # Default
        for p in possible_paths:
            if os.path.exists(p):
                path_to_use = p
                break
                
        simulation_manager.load_dataset(path_to_use)
        
        # Pre-fit feature engineer to avoid timeout on first request
        try:
            print("⚙️ Pre-fitting feature engineer (background)...")
            global cached_feature_engineer
            from feature_engineering import FraudFeatureEngineer
            fe = FraudFeatureEngineer(pagerank_limit=10000)
            fe.fit(simulation_manager.dataset)
            cached_feature_engineer = fe
            print("✅ Feature engineer pre-fitted and cached")
        except Exception as e:
            print(f"⚠️ Failed to pre-fit feature engineer: {str(e)}")
            
    except Exception as e:
        print(f"⚠️ Failed to load simulation dataset: {str(e)}")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "CloverShield ML Inference API",
        "version": MODEL_VERSION,
        "status": "running",
        "model_loaded": inference_engine is not None
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    # Lazy loading for serverless environments
    if inference_engine is None:
        ensure_model_loaded()
    
    model_loaded = inference_engine is not None
    shap_available = model_loaded and inference_engine.shap_explainer is not None
    
    return {
        "status": "healthy" if model_loaded else "degraded",
        "model_loaded": model_loaded,
        "model_version": MODEL_VERSION,
        "shap_available": shap_available,
        "llm_available": os.getenv("GROQ_API_KEY") is not None,
        "message": "Model loaded and ready" if model_loaded else "Model is loading or unavailable"
    }

@app.get("/model/info")
async def model_info():
    """Get model information"""
    if inference_engine is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    return {
        "model_version": MODEL_VERSION,
        "model_type": "XGBoost",
        "threshold": MODEL_THRESHOLD,
        "features": [
            {"name": "step", "type": "integer", "description": "Time step"},
            {"name": "amount", "type": "float", "description": "Transaction amount"},
            {"name": "oldBalanceOrig", "type": "float", "description": "Sender balance before"},
            {"name": "newBalanceOrig", "type": "float", "description": "Sender balance after"},
            {"name": "oldBalanceDest", "type": "float", "description": "Receiver balance before"},
            {"name": "newBalanceDest", "type": "float", "description": "Receiver balance after"},
            {"name": "type", "type": "string", "description": "Transaction type"},
        ]
    }

@app.post("/predict", response_model=PredictResponse)
async def predict(request: PredictRequest):
    """
    Predict fraud probability for a single transaction
    
    Returns fraud probability, decision, risk level, and SHAP explanations
    """
    # Lazy loading for serverless environments
    if inference_engine is None:
        if not ensure_model_loaded():
            raise HTTPException(
                status_code=503, 
                detail="Model not loaded. The model is still loading or failed to load. Please try again in a moment or check /health endpoint."
            )
    
    start_time = time.time()
    transaction_id = str(uuid.uuid4())
    
    try:
        # Convert transaction to DataFrame
        transaction_df = transaction_to_dataframe(request.transaction)
        
        # Get options
        options = request.options or PredictionOptions()
        
        # Predict
        result = inference_engine.predict_and_explain(
            transaction_df,
            shap_background=None,
            topk=options.topk,
            use_llm=options.include_llm_explanation,
            language=options.language
        )
        
        probability = float(result['probabilities'][0])
        decision, risk_level = calculate_decision(probability)
        confidence = calculate_confidence(probability)
        
        # Log prediction to Audit Log
        if audit_logger:
            # Create features dictionary for audit log
            audit_features = transaction_df.to_dict(orient='records')[0]
            audit_logger.log_prediction(transaction_id, probability, audit_features)
        
        # Format SHAP explanations
        shap_explanations = None
        if options.include_shap and result.get('shap_table') is not None:
            shap_df = result['shap_table']
            shap_explanations = [
                SHAPExplanation(
                    feature=row['feature'],
                    value=float(row['value']),
                    shap=float(row['shap']),
                    shap_abs=float(row['shap_abs']),
                    rank=idx + 1
                )
                for idx, (_, row) in enumerate(shap_df.iterrows())
            ]
        
        # Format LLM explanation
        llm_explanation = None
        if result.get('llm_explanation'):
            llm_explanation = {
                "text": result['llm_explanation'],
                "language": options.language
            }
        
        processing_time = int((time.time() - start_time) * 1000)
        
        return PredictResponse(
            transaction_id=transaction_id,
            prediction=PredictionResult(
                fraud_probability=probability,
                decision=decision,
                risk_level=risk_level,
                confidence=confidence
            ),
            shap_explanations=shap_explanations,
            llm_explanation=llm_explanation,
            processing_time_ms=processing_time,
            model_version=MODEL_VERSION,
            timestamp=datetime.utcnow().isoformat() + "Z"
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"❌ Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/predict/batch", response_model=BatchPredictResponse)
async def predict_batch(request: BatchPredictRequest):
    """
    Predict fraud probability for multiple transactions
    
    Returns predictions for all transactions in batch
    """
    # Lazy loading for serverless environments
    if inference_engine is None:
        if not ensure_model_loaded():
            raise HTTPException(
                status_code=503, 
                detail="Model not loaded. The model is still loading or failed to load. Please try again in a moment."
            )
    
    start_time = time.time()
    options = request.options or PredictionOptions()
    
    results = []
    
    try:
        for transaction in request.transactions:
            transaction_df = transaction_to_dataframe(transaction)
            
            # Predict (without SHAP for batch to speed up)
            probabilities, decisions = inference_engine.predict(transaction_df)
            probability = float(probabilities[0])
            decision, risk_level = calculate_decision(probability)
            
            results.append({
                "transaction_id": str(uuid.uuid4()),
                "prediction": {
                    "fraud_probability": probability,
                    "decision": decision,
                    "risk_level": risk_level
                }
            })
        
        processing_time = int((time.time() - start_time) * 1000)
        
        return BatchPredictResponse(
            results=results,
            processing_time_ms=processing_time,
            total_transactions=len(results)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch prediction failed: {str(e)}")

class BacktestRequest(BaseModel):
    """Request model for rule backtesting"""
    rule_logic: str = Field(..., description="SQL-like filter string (e.g. 'amount > 50000 and type == \"TRANSFER\"')")
    limit: int = Field(default=1000, description="Number of recent transactions to test")

class BacktestResponse(BaseModel):
    """Response model for backtest results"""
    total_matches: int
    fraud_caught: int
    false_positives: int
    precision: float
    total_tested: int
    execution_time_ms: int

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    """Request model for chat endpoint"""
    messages: List[ChatMessage]
    context: Optional[str] = None

class ChatResponse(BaseModel):
    """Response model for chat endpoint"""
    response: str
    processing_time_ms: int

class SARRequest(BaseModel):
    """Request model for SAR Narrative Generation"""
    case_id: str
    transactions: List[TransactionInput]
    analyst_notes: Optional[str] = None

class LogAnomalyRequest(BaseModel):
    """Request model for internal anomaly detection"""
    logs: List[Dict] # List of audit log dictionaries

# ============================================================================
# SAR & ANOMALY ENDPOINTS
# ============================================================================

@app.post("/generate-sar-narrative")
async def generate_sar_narrative(request: SARRequest):
    """
    Generate a professional Suspicious Activity Report (SAR) narrative using Groq LLM.
    """
    start_time = time.time()
    
    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        raise HTTPException(status_code=503, detail="Groq API key not configured")

    try:
        from groq import Groq
        client = Groq(api_key=groq_api_key)
        
        # Summarize transactions
        total_amount = sum(t.amount for t in request.transactions)
        avg_amount = total_amount / len(request.transactions) if request.transactions else 0
        tx_types = list(set(t.type for t in request.transactions))
        
        prompt = f"""
        You are a Senior Financial Crime Investigator. Write the "Narrative" section of a Suspicious Activity Report (SAR) for the following case.
        
        Case ID: {request.case_id}
        Total Volume: {total_amount} BDT over {len(request.transactions)} transactions.
        Transaction Types: {", ".join(tx_types)}
        Average Amount: {avg_amount:.2f} BDT
        
        Analyst Notes: {request.analyst_notes or "None"}
        
        Instructions:
        Write a comprehensive narrative including the following sections.
        STRICT RULES:
        1. DO NOT use any Markdown formatting (NO asterisks *, NO hashes #, NO bolding).
        2. Use UPPERCASE letters for section headers (e.g. RISK INDICATORS).
        3. Use simple dashes - for lists.
        4. Start directly with the first section header. Do NOT use "Narrative:" at the top.
        
        Sections to include:
        1. RISK INDICATORS / RED FLAGS: Explicitly state why the activity is suspicious (e.g., rapid fund movement, structuring).
        2. BEHAVIORAL PATTERN ANALYSIS: key behaviors (timing, frequency, directional flow).
        3. RISK SCORING / SEVERITY ASSESSMENT: Assign an overall risk level (Low/Medium/High) with factors and confidence.
        4. TRANSACTION FLOW OVERVIEW: Explain the money movement clearly without diagrams.
        5. RECOMMENDED ACTIONS: logical next steps for the FIU (e.g., enhanced due diligence, account monitoring).
        
        Tone: Professional, objective, and regulatory-focused suitable for the Bangladesh Financial Intelligence Unit (BFIU).
        """
        
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.1-8b-instant",
            temperature=0.3,
            max_tokens=500
        )
        
        narrative = chat_completion.choices[0].message.content.strip()
        processing_time = int((time.time() - start_time) * 1000)
        
        return {
            "narrative": narrative,
            "processing_time_ms": processing_time
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SAR Generation failed: {str(e)}")

@app.post("/detect-internal-anomalies")
async def detect_internal_anomalies(request: LogAnomalyRequest):
    """
    Scan audit logs for suspicious internal user behavior.
    """
    anomalies = []
    
    # 1. Rule-Based Detection
    user_counts = {}
    
    for log in request.logs:
        uid = log.get('user_id') or log.get('user_email')
        if not uid: continue
        
        if uid not in user_counts:
            user_counts[uid] = {'actions': 0, 'sensitive_access': 0}
        
        user_counts[uid]['actions'] += 1
        
        if 'EXPORT' in log.get('action_type', '') or 'DELETE' in log.get('action_type', ''):
             user_counts[uid]['sensitive_access'] += 1

    # Thresholds
    for uid, stats in user_counts.items():
        if stats['actions'] > 50: # Arbitrary high volume in short time
            anomalies.append({
                "user_id": uid,
                "reason": "High Velocity Action",
                "details": f"User performed {stats['actions']} actions in the provided window."
            })
        if stats['sensitive_access'] > 5:
            anomalies.append({
                "user_id": uid,
                "reason": "Excessive Sensitive Access",
                "details": "User exported or deleted data multiple times."
            })
            
    # 2. LLM Detection (Optional - simple check for keyword weirdness)
    # Skipping for speed unless specifically requested, but we can do a quick check on messages
    
    return {"anomalies": anomalies, "scanned_count": len(request.logs)}

# ============================================================================
# BACKTEST ENDPOINTS
# ============================================================================

@app.post("/backtest", response_model=BacktestResponse)
async def backtest_rule(request: BacktestRequest):
    """
    Backtest a fraud detection rule against historical data.
    Uses in-memory dataset for high performance (no disk I/O).
    """
    start_time = time.time()
    
    # 1. Access the dataset from simulation manager (already loaded)
    # If not loaded, try to load it
    if simulation_manager.dataset is None:
        try:
            print("🔄 Loading dataset for backtest...")
            # Try to find the dataset
            possible_paths = [
                "dataset/test_dataset.csv.gz", 
                "dataset/test_dataset.csv",
                "../dataset/test_dataset.csv.gz"
            ]
            path_to_use = None
            for p in possible_paths:
                if os.path.exists(p):
                    path_to_use = p
                    break
            
            if path_to_use:
                simulation_manager.load_dataset(path_to_use)
            else:
                 raise HTTPException(status_code=503, detail="Dataset not found on server")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to load dataset: {str(e)}")

    if simulation_manager.dataset is None:
        raise HTTPException(status_code=503, detail="Dataset not available")

    try:
        # 2. Slice the dataframe (last N rows)
        df = simulation_manager.dataset
        limit = min(request.limit, len(df))
        # Get the *last* N transactions (most recent)
        test_slice = df.tail(limit).copy()
        
        # 3. Apply the rule logic
        # Safety check: basic sanitation to prevent arbitrary code execution
        allowed_chars = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_ ><=!&|().'\"-,")
        clean_query = "".join(c for c in request.rule_logic if c in allowed_chars)
        
        # Check if we need feature engineering
        complex_features = [
            'orig_txn_count', 'dest_txn_count', 'in_degree', 'out_degree', 
            'network_trust', 'hour', 'amt_ratio_to_user_median', 
            'amount_over_oldBalanceOrig', 'amt_ratio_to_user_mean', 'amount_log1p',
            'is_new_origin', 'is_new_dest'
        ]
        
        needs_engineering = any(feat in clean_query for feat in complex_features)
        
        df_to_query = test_slice
        
        if needs_engineering:
            try:
                # Use cached feature engineer if available
                global cached_feature_engineer
                
                if cached_feature_engineer is None:
                    print("⚙️ Fitting feature engineer for the first time...")
                    from feature_engineering import FraudFeatureEngineer
                    # We fit on the FULL dataset to get accurate history/graph stats
                    # This ensures orig_txn_count reflects the full history, not just the slice
                    fe = FraudFeatureEngineer(pagerank_limit=10000) # Limit pagerank for speed
                    fe.fit(simulation_manager.dataset)
                    cached_feature_engineer = fe
                    print("✅ Feature engineer fitted and cached")
                else:
                    print("⚡ Using cached feature engineer")
                
                # Transform the slice to get the features
                # Use the cached instance
                df_eng = cached_feature_engineer.transform(test_slice)
                
                # FraudFeatureEngineer drops string columns like 'type', 'nameOrig'
                # We need 'type' back for filtering if the rule uses it
                if 'type' not in df_eng.columns and 'type' in test_slice.columns:
                    # Align by index
                    df_eng['type'] = test_slice['type']
                
                # Ensure ground truth columns are present for precision calc
                for col in ['isFraud', 'isFlaggedFraud']:
                    if col in test_slice.columns and col not in df_eng.columns:
                        df_eng[col] = test_slice[col]
                        
                df_to_query = df_eng
            except ImportError:
                print("⚠️ Feature engineering module not found, proceeding with raw data")
            except Exception as e:
                print(f"⚠️ Feature engineering failed: {e}, proceeding with raw data")
        
        # Run the query
        matches = df_to_query.query(clean_query)
        
        # 4. Calculate metrics
        matches_count = len(matches)
        
        # Check if 'isFraud' or 'isFlaggedFraud' exists for ground truth
        fraud_col = 'isFraud' if 'isFraud' in matches.columns else ('isFlaggedFraud' if 'isFlaggedFraud' in matches.columns else None)
        
        if fraud_col:
            fraud_caught = matches[fraud_col].sum()
            false_positives = matches_count - fraud_caught
            precision = (fraud_caught / matches_count) if matches_count > 0 else 0.0
        else:
            # If no ground truth, we can't calculate precision
            fraud_caught = 0
            false_positives = matches_count
            precision = 0.0

        execution_time = int((time.time() - start_time) * 1000)
        
        return BacktestResponse(
            total_matches=int(matches_count),
            fraud_caught=int(fraud_caught),
            false_positives=int(false_positives),
            precision=float(precision),
            total_tested=limit,
            execution_time_ms=execution_time
        )

    except Exception as e:
        # Catch query syntax errors
        raise HTTPException(status_code=400, detail=f"Invalid rule logic: {str(e)}")


# ============================================================================
# CHAT ENDPOINT
# ============================================================================

@app.post("/chat", response_model=ChatResponse)
async def chat_with_bot(request: ChatRequest):
    """
    Chat with the CloverShield Fraud Analyst Assistant.
    """
    start_time = time.time()
    
    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        raise HTTPException(status_code=503, detail="Groq API key not configured")
        
    try:
        from groq import Groq
        client = Groq(api_key=groq_api_key)
    except ImportError:
         raise HTTPException(status_code=503, detail="Groq library not installed")

    system_prompt = """
You are CloverShield, an expert AI Fraud Analyst Assistant designed for mobile financial services in Bangladesh.
Your goal is to help human analysts detect fraud, understand the system, and improve policies.

Your Capabilities:
-   Explain App Features:
    -   Scanner: Real-time transaction scoring. You can explain how to input data and interpret risk scores (Pass, Warn, Block).
    -   Simulator: A way to run thousands of synthetic transactions to test system stability and observe patterns.
    -   Graph: Visualizes money laundering rings (structuring/smurfing). Nodes are users, edges are transactions.
    -   Policy Lab (Sandbox): Allows analysts to test new rules (e.g., "amount > 50000") against historical data to measure impact.

-   Fraud Domain Expertise:
    -   Explain fraud patterns like Smurfing (many small txs to one account), Mule Accounts, Account Takeover, and Velocity Attacks.
    -   Suggest rules for specific scenarios (e.g., "To catch high-value bursts, try: amount > 10000 and orig_txn_count > 5").
    -   Draft reports: You can help draft Suspicious Activity Reports (SARs).

-   Tone & Style:
    -   Professional, concise, and helpful.
    -   Use simple language but demonstrate deep domain knowledge.
    -   If the user asks about a specific transaction ID or user, politely explain that you can currently only answer general questions or questions based on the provided context (you don't have direct DB access in this chat window).

IMPORTANT FORMATTING RULES:
- DO NOT use Markdown formatting (NO bold **, NO headers ##, NO italics *). 
- Use plain text only.
- Use dashes - for lists.

Current Context:
{context}
"""
    
    # Format messages for Groq
    messages = [{"role": "system", "content": system_prompt.format(context=request.context or "No specific context provided.")}]
    
    # Add user history
    for msg in request.messages:
        messages.append({"role": msg.role, "content": msg.content})

    try:
        chat_completion = client.chat.completions.create(
            messages=messages,
            model="llama-3.1-8b-instant",
            temperature=0.4,
            max_tokens=800
        )
        
        response_text = chat_completion.choices[0].message.content.strip()
        processing_time = int((time.time() - start_time) * 1000)
        
        return ChatResponse(
            response=response_text,
            processing_time_ms=processing_time
        )
        
    except Exception as e:
        print(f"❌ Chat generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat generation failed: {str(e)}")


# ============================================================================
# SIMULATION ENDPOINTS
# ============================================================================

@app.post("/simulate/start")
async def start_simulation():
    """Start the transaction simulation"""
    try:
        status = simulation_manager.start()
        return status
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/simulate/stop")
async def stop_simulation():
    """Stop/Pause the transaction simulation"""
    return simulation_manager.stop()

@app.post("/simulate/reset")
async def reset_simulation():
    """Reset the simulation to the beginning"""
    return simulation_manager.reset()

@app.post("/simulate/config")
async def configure_simulation(config: SimulationConfig):
    """Configure simulation speed"""
    return simulation_manager.set_speed(config.speed)

@app.get("/simulate/stream")
async def stream_simulation():
    """Stream simulated transactions via SSE"""
    return StreamingResponse(
        simulation_manager.stream_generator(),
        media_type="text/event-stream"
    )

# ============================================================================
# TRAINING ENDPOINTS
# ============================================================================

@app.post("/train", response_model=TrainingResponse)
async def train_model_endpoint(
    background_tasks: BackgroundTasks,
    config: str = Form(...),
    file: UploadFile = File(...)
):
    """
    Start a background training job.
    Accepts a CSV file and a JSON string for configuration.
    """
    try:
        config_dict = json.loads(config)
        # Validate config using Pydantic
        training_config = TrainingConfig(**config_dict)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid configuration JSON: {str(e)}")

    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    job_id = str(uuid.uuid4())
    
    # Save uploaded file to temp location
    temp_dir = "temp_uploads"
    os.makedirs(temp_dir, exist_ok=True)
    file_path = os.path.join(temp_dir, f"{job_id}_{file.filename}")
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    # Create initial record in Supabase
    if supabase:
        try:
            supabase.table("model_registry").insert({
                "id": job_id,
                "name": training_config.name,
                "version": training_config.version,
                "status": "pending",
                "is_active": False
            }).execute()
        except Exception as e:
            # Clean up file if DB insert fails
            if os.path.exists(file_path):
                os.remove(file_path)
            raise HTTPException(status_code=500, detail=f"Failed to create job record: {str(e)}")
    else:
        print("⚠️ Supabase not connected. Training will proceed but status won't be persisted.")

    # Trigger background task
    params = training_config.dict()
    background_tasks.add_task(train_model_async, job_id, file_path, params)

    return TrainingResponse(
        job_id=job_id,
        status="pending",
        message="Training job started in background"
    )

@app.get("/models", response_model=List[ModelItem])
async def list_models():
    """List all trained models from registry"""
    if not supabase:
        # Return mock data if no DB (or raise error)
        # For development ease, we can return checking a local dir, but let's stick to DB
        return []
        
    try:
        response = supabase.table("model_registry").select("*").order("created_at", desc=True).execute()
        
        # Convert created_at to string if needed or Pydantic handles it
        models = []
        for item in response.data:
            models.append(ModelItem(
                id=item['id'],
                name=item['name'],
                version=item.get('version'),
                status=item['status'],
                metrics=item.get('metrics'),
                is_active=item.get('is_active', False),
                created_at=item['created_at']
            ))
        return models
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch models: {str(e)}")

@app.post("/models/{model_id}/activate")
async def activate_model(model_id: str):
    """Activate a specific model version"""
    if not supabase:
        raise HTTPException(status_code=503, detail="Database not available")

    # 1. Get model details
    try:
        response = supabase.table("model_registry").select("*").eq("id", model_id).single().execute()
        model_data = response.data
    except Exception:
        raise HTTPException(status_code=404, detail="Model not found")

    if model_data['status'] != 'ready':
        raise HTTPException(status_code=400, detail="Model is not in 'ready' state")

    model_path = model_data.get('file_path')
    if not model_path:
        raise HTTPException(status_code=400, detail="Model file path missing")

    # 2. Update DB (set active=True for this, False for others)
    # The trigger 'trigger_ensure_single_active_model' handles the "False for others" part!
    try:
        supabase.table("model_registry").update({"is_active": True}).eq("id", model_id).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update database: {str(e)}")

    # 3. Hot-swap in memory
    # We need to set the environment variable or just reload logic
    # Best way: Update global variable directly
    full_path = os.path.abspath(model_path) if os.path.isabs(model_path) else os.path.join(os.path.dirname(__file__), model_path)
    
    if not os.path.exists(full_path):
        # Try relative to Models/ if not found
        full_path = os.path.join(os.path.dirname(__file__), "Models", os.path.basename(model_path))

    if not os.path.exists(full_path):
         raise HTTPException(status_code=500, detail=f"Model file not found on disk: {full_path}")

    # Set env var for future reloads
    os.environ["MODEL_PATH"] = full_path
    
    # Trigger reload
    global inference_engine
    try:
        # Load new model
        new_engine = load_inference_engine(
            model_path=full_path,
            test_dataset_path=os.getenv("TEST_DATASET_PATH"),
            threshold=float(os.getenv("MODEL_THRESHOLD", "0.0793")),
            groq_api_key=os.getenv("GROQ_API_KEY"),
            pagerank_limit=int(os.getenv("PAGERANK_LIMIT", "10000"))
        )
        inference_engine = new_engine
        print(f"✅ Hot-swapped to model {model_id} ({full_path})")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load model into memory: {str(e)}")

    return {"status": "success", "message": f"Model {model_id} activated"}


# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code
        }
    )

# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    # Get port from environment (required for Render, Railway, etc.)
    # Default to 7860 for Hugging Face Spaces
    port = int(os.getenv("PORT", 7860))
    host = os.getenv("HOST", "0.0.0.0")
    
    print(f"🌐 Binding to {host}:{port}")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=False,
        workers=1,  # Single worker for ML model
        log_level="info"
    )

