import os
import time
import json
import joblib
import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split, RandomizedSearchCV, cross_val_predict
from sklearn.metrics import precision_recall_curve, classification_report, accuracy_score, f1_score, precision_score, recall_score
from supabase import create_client, Client
from dotenv import load_dotenv

# Import local modules
# Assuming feature_engineering.py is in the same directory
try:
    from feature_engineering import FraudFeatureEngineer
except ImportError:
    import sys
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from feature_engineering import FraudFeatureEngineer

load_dotenv()

# Initialize Supabase client
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") # Use Service Role Key for backend updates
supabase: Client = create_client(url, key) if url and key else None

def update_job_status(job_id: str, status: str, metrics: dict = None, file_path: str = None):
    """Update job status in Supabase"""
    if not supabase:
        print(f"⚠️ Supabase not configured. Job {job_id} status: {status}")
        return

    data = {"status": status}
    if metrics:
        data["metrics"] = metrics
    if file_path:
        data["file_path"] = file_path
    
    try:
        supabase.table("model_registry").update(data).eq("id", job_id).execute()
    except Exception as e:
        print(f"❌ Failed to update Supabase for job {job_id}: {str(e)}")

def make_splits(df, test_frac=0.05, time_col='step', min_test_fraud=100, random_state=42):
    """
    Returns: X_train, X_test, y_train, y_test
    """
    # Temporal test split
    if time_col in df.columns:
        cutoff = df[time_col].quantile(1 - test_frac)
        train_df = df[df[time_col] <= cutoff].reset_index(drop=True)
        test_df = df[df[time_col] > cutoff].reset_index(drop=True)
    else:
        train_df = df.copy()
        test_df = pd.DataFrame(columns=df.columns)

    # Fallback to stratified split if test set is poor
    if (test_df.empty) or (test_df['isFraud'].sum() < min_test_fraud):
        X_temp = df.drop(columns=['isFraud'])
        y_temp = df['isFraud']
        X_train, X_test, y_train, y_test = train_test_split(
            X_temp, y_temp, test_size=test_frac, stratify=y_temp, random_state=random_state
        )
        return X_train.reset_index(drop=True), X_test.reset_index(drop=True), y_train.reset_index(drop=True), y_test.reset_index(drop=True)
    else:
        X_train = train_df.drop(columns=['isFraud'])
        y_train = train_df['isFraud']
        X_test = test_df.drop(columns=['isFraud'])
        y_test = test_df['isFraud']
        return X_train.reset_index(drop=True), X_test.reset_index(drop=True), y_train.reset_index(drop=True), y_test.reset_index(drop=True)

async def train_model_async(job_id: str, file_path: str, params: dict):
    """
    Background task to train model
    """
    print(f"🚀 Starting training job {job_id} with params: {params}")
    update_job_status(job_id, "training")
    
    try:
        # 1. Load Data
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Dataset not found at {file_path}")
            
        df = pd.read_csv(file_path)
        
        # Basic Preprocessing
        if 'oldbalanceOrg' in df.columns:
            df = df.rename(columns={'oldbalanceOrg':'oldBalanceOrig', 'newbalanceOrig':'newBalanceOrig', 
                                    'oldbalanceDest':'oldBalanceDest', 'newbalanceDest':'newBalanceDest'})
            
        # Filter types if needed (Notebook filters to TRANSFER/CASH_OUT)
        # We'll stick to what the notebook did for consistency
        if 'type' in df.columns:
            df = df[df['type'].isin(['TRANSFER', 'CASH_OUT'])].reset_index(drop=True)
            
        # 2. Split Data
        test_frac = params.get('test_split', 0.05)
        X_train, X_test, y_train, y_test = make_splits(df, test_frac=test_frac)
        
        print(f"📊 Data split: Train={len(X_train)}, Test={len(X_test)}")
        
        # 3. Feature Engineering
        pagerank_limit = params.get('pagerank_limit', 10000)
        fe = FraudFeatureEngineer(pagerank_limit=pagerank_limit)
        
        print("⚙️ Fitting feature engineer...")
        fe.fit(X_train, y_train)
        X_train_trans = fe.transform(X_train)
        X_test_trans = fe.transform(X_test)
        
        # 4. Configure XGBoost
        # Calculate scale_pos_weight
        neg = (y_train == 0).sum()
        pos = (y_train == 1).sum()
        spw = int(max(1, neg / max(1, pos)))
        
        xgb_params = {
            'objective': 'binary:logistic',
            'tree_method': 'hist',
            'random_state': 42,
            'n_jobs': 1,
            'n_estimators': int(params.get('n_estimators', 300)),
            'max_depth': int(params.get('max_depth', 6)),
            'learning_rate': float(params.get('learning_rate', 0.05)),
            'scale_pos_weight': spw
        }
        
        clf = xgb.XGBClassifier(**xgb_params)
        
        # 5. Train
        print("🏋️ Training classifier...")
        clf.fit(X_train_trans, y_train)
        
        # 6. Evaluate
        print("📝 Evaluating...")
        y_pred = clf.predict(X_test_trans)
        
        metrics = {
            "accuracy": float(accuracy_score(y_test, y_pred)),
            "precision": float(precision_score(y_test, y_pred)),
            "recall": float(recall_score(y_test, y_pred)),
            "f1": float(f1_score(y_test, y_pred))
        }
        print(f"✅ Metrics: {metrics}")
        
        # 7. Save Model
        # Ensure Models directory exists
        models_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Models")
        os.makedirs(models_dir, exist_ok=True)
        
        model_filename = f"model_{job_id}.pkl"
        model_save_path = os.path.join(models_dir, model_filename)
        
        # Save ONLY the classifier (as per notebook strategy)
        joblib.dump(clf, model_save_path)
        print(f"💾 Model saved to {model_save_path}")
        
        # 8. Update Registry
        update_job_status(job_id, "ready", metrics=metrics, file_path=f"Models/{model_filename}")
        
    except Exception as e:
        print(f"❌ Training failed: {str(e)}")
        update_job_status(job_id, "failed", metrics={"error": str(e)})
