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
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator
import uvicorn

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from inference import FraudInference, load_inference_engine
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

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# GLOBAL STATE
# ============================================================================

inference_engine: Optional[FraudInference] = None
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

def convert_google_drive_url(url: str) -> str:
    """Convert Google Drive view link to direct download link"""
    # Extract file ID from various Google Drive URL formats
    file_id = None
    
    # Format: https://drive.google.com/file/d/FILE_ID/view?usp=drive_link
    if '/file/d/' in url:
        file_id = url.split('/file/d/')[1].split('/')[0]
    # Format: https://drive.google.com/uc?id=FILE_ID
    elif 'id=' in url:
        file_id = url.split('id=')[1].split('&')[0]
    
    if file_id:
        # Use direct download format that bypasses virus scan for large files
        return f"https://drive.google.com/uc?export=download&id={file_id}&confirm=t"
    
    return url  # Return as-is if not a Google Drive URL

def download_model_if_needed():
    """Download model from cloud storage (Google Drive) if not present locally"""
    model_path = os.getenv("MODEL_PATH", "Models/fraud_pipeline_final.pkl")
    
    # Check if model already exists and validate size
    if os.path.exists(model_path):
        file_size = os.path.getsize(model_path) / (1024 * 1024)  # Size in MB
        # Validate it's actually a model file (should be > 50MB for a 250MB model)
        if file_size > 50:
            print(f"✅ Model already exists at {model_path} ({file_size:.1f} MB)")
            return model_path
        else:
            print(f"⚠️ Existing file too small ({file_size:.1f} MB), re-downloading...")
            os.remove(model_path)
    
    # Get download URL from environment variable
    model_url = os.getenv("MODEL_URL")
    if not model_url:
        raise ValueError(
            "MODEL_URL environment variable not set. "
            "Please provide a URL to download the model file."
        )
    
    # Convert Google Drive URL to direct download format
    download_url = convert_google_drive_url(model_url)
    if download_url != model_url:
        print(f"🔗 Converted Google Drive URL to direct download format")
    
    # Create Models directory if it doesn't exist
    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    
    print(f"📥 Downloading model from Google Drive")
    print("⏳ This may take a few minutes for large files (250MB)...")
    
    try:
        import urllib.request
        import ssl
        
        # Create SSL context
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        
        # Create opener with SSL context
        opener = urllib.request.build_opener(
            urllib.request.HTTPSHandler(context=ssl_context)
        )
        urllib.request.install_opener(opener)
        
        # Download with progress tracking
        downloaded_bytes = 0
        def show_progress(block_num, block_size, total_size):
            nonlocal downloaded_bytes
            if total_size > 0:
                downloaded_bytes = block_num * block_size
                percent = min(100, (downloaded_bytes / total_size) * 100)
                mb_downloaded = downloaded_bytes / (1024 * 1024)
                mb_total = total_size / (1024 * 1024)
                if block_num % 100 == 0:  # Print every 100 blocks
                    print(f"  Progress: {percent:.1f}% ({mb_downloaded:.1f}/{mb_total:.1f} MB)")
        
        # Download the file
        urllib.request.urlretrieve(
            download_url, 
            model_path,
            reporthook=show_progress
        )
        
        # Validate downloaded file
        file_size = os.path.getsize(model_path) / (1024 * 1024)
        
        # Check if it's actually a pickle file (not HTML)
        with open(model_path, 'rb') as f:
            first_bytes = f.read(100)
            # Pickle files start with specific bytes, HTML starts with '<'
            if first_bytes.startswith(b'<'):
                raise ValueError(
                    f"Downloaded file appears to be HTML (not a pickle file). "
                    f"File size: {file_size:.1f} MB. "
                    f"Please check your Google Drive link format. "
                    f"Make sure the file is shared with 'Anyone with the link' and use direct download format."
                )
        
        # Validate file size (should be close to 250MB)
        if file_size < 50:
            raise ValueError(
                f"Downloaded file is too small ({file_size:.1f} MB). "
                f"Expected ~250MB. The download may have failed or the URL is incorrect."
            )
        
        print(f"✅ Model downloaded successfully to {model_path} ({file_size:.1f} MB)")
        return model_path
        
    except Exception as e:
        # Clean up partial download
        if os.path.exists(model_path):
            os.remove(model_path)
        error_msg = f"Failed to download model: {str(e)}"
        print(f"❌ {error_msg}")
        raise Exception(error_msg)

def load_model():
    """Load the ML model on startup"""
    global inference_engine
    
    model_path = os.getenv("MODEL_PATH", "Models/fraud_pipeline_final.pkl")
    groq_api_key = os.getenv("GROQ_API_KEY")
    
    # Try multiple paths
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
        
        # Check file size
        file_size = os.path.getsize(actual_path) / (1024 * 1024)
        if file_size < 50:
            raise ValueError(
                f"Model file is too small ({file_size:.1f} MB). "
                f"Expected ~250MB. The file may be corrupted or incomplete."
            )
        
        # Try to load the model
        inference_engine = load_inference_engine(
            model_path=actual_path,
            threshold=MODEL_THRESHOLD,
            groq_api_key=groq_api_key
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
    try:
        # Download model from Google Drive if needed
        download_model_if_needed()
        # Then load it
        load_model()
    except Exception as e:
        print(f"⚠️ Warning: Model not loaded: {str(e)}")
        print("⚠️ API will return errors until model is available")

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
    model_loaded = inference_engine is not None
    shap_available = model_loaded and inference_engine.shap_explainer is not None
    
    return {
        "status": "healthy" if model_loaded else "degraded",
        "model_loaded": model_loaded,
        "model_version": MODEL_VERSION,
        "shap_available": shap_available,
        "llm_available": os.getenv("GROQ_API_KEY") is not None
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
    if inference_engine is None:
        raise HTTPException(status_code=503, detail="Model not loaded. Please check /health endpoint.")
    
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
    if inference_engine is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
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
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=False,
        workers=1  # Single worker for ML model
    )

