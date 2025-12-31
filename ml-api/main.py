"""
CloverShield ML Inference API
FastAPI microservice for fraud detection predictions
"""

import os
import sys
import time
import uuid
from typing import Optional, Dict, List
from datetime import datetime

import pandas as pd
import numpy as np
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field, validator
import uvicorn

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from inference import FraudInference, load_inference_engine
from simulation import simulation_manager, SimulationConfig
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
model_loading_lock = False
MODEL_VERSION = "1.0.0"
MODEL_THRESHOLD = float(os.getenv("MODEL_THRESHOLD", "0.0793"))

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
        # Pandas query() is relatively safe but we should be careful
        allowed_chars = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_ ><=!&|().'\"")
        clean_query = "".join(c for c in request.rule_logic if c in allowed_chars)
        
        # Run the query
        matches = test_slice.query(clean_query)
        
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

