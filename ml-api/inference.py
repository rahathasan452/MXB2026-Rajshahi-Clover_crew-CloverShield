"""
Inference Module for Fraud Detection Pipeline
Adapted for FastAPI microservice
"""

import os
import sys
import numpy as np
import pandas as pd
import joblib
import warnings
from typing import Dict, Optional, Tuple
import shap

# Import FraudFeatureEngineer
try:
    from feature_engineering import FraudFeatureEngineer
    if '__main__' not in sys.modules:
        import types
        sys.modules['__main__'] = types.ModuleType('__main__')
    setattr(sys.modules['__main__'], 'FraudFeatureEngineer', FraudFeatureEngineer)
except ImportError:
    from sklearn.base import BaseEstimator, TransformerMixin
    import types
    
    class FraudFeatureEngineer(BaseEstimator, TransformerMixin):
        def fit(self, X, y=None):
            return self
        def transform(self, X):
            return X
    
    if '__main__' not in sys.modules:
        sys.modules['__main__'] = types.ModuleType('__main__')
    setattr(sys.modules['__main__'], 'FraudFeatureEngineer', FraudFeatureEngineer)

# Load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Suppress warnings
warnings.filterwarnings('ignore', message='.*is_sparse.*', category=FutureWarning)
warnings.filterwarnings('ignore', message='is_sparse is deprecated')

# Optional imports
try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False

try:
    import xgboost as xgb
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False


class FraudInference:
    """
    Inference class for fraud detection pipeline with explainability
    Uses fitted feature engineer and XGBoost model separately
    """
    
    def __init__(
        self, 
        model_path: str, 
        test_dataset_path: Optional[str] = None,
        threshold: float = 0.0793, 
        groq_api_key: Optional[str] = None,
        pagerank_limit: Optional[int] = None
    ):
        """
        Initialize inference engine
        
        Args:
            model_path: Path to the saved XGBoost model pkl file
            test_dataset_path: Path to test dataset CSV for fitting feature engineer
            threshold: Decision threshold for fraud classification
            groq_api_key: Optional Groq API key for LLM explanations
            pagerank_limit: Optional limit on nodes for PageRank computation
        """
        self.model_path = model_path
        self.test_dataset_path = test_dataset_path
        self.threshold = threshold
        self.groq_api_key = groq_api_key
        self.pagerank_limit = pagerank_limit
        self.model = None
        self.feature_engineer = None
        self.shap_background = None
        self.shap_explainer = None
        
        # Load model and fit feature engineer
        self.load_model()
        self.fit_feature_engineer()
    
    def load_model(self):
        """Load the trained XGBoost model"""
        try:
            if not os.path.exists(self.model_path):
                raise FileNotFoundError(f"Model file not found: {self.model_path}")
            
            # Load model - could be XGBoost directly or pipeline with XGBoost
            loaded_obj = joblib.load(self.model_path)
            
            # Check if it's a pipeline or just XGBoost
            if hasattr(loaded_obj, 'named_steps') and 'clf' in loaded_obj.named_steps:
                # It's a pipeline, extract the classifier
                self.model = loaded_obj.named_steps['clf']
                print(f"✅ Model loaded from pipeline at {self.model_path}")
            elif XGBOOST_AVAILABLE and isinstance(loaded_obj, xgb.XGBClassifier):
                # It's XGBoost directly
                self.model = loaded_obj
                print(f"✅ XGBoost model loaded successfully from {self.model_path}")
            else:
                # Try to use it as-is (might be XGBoost wrapped)
                self.model = loaded_obj
                print(f"✅ Model loaded from {self.model_path} (assuming XGBoost)")
                
        except Exception as e:
            print(f"❌ Error loading model: {str(e)}")
            raise
    
    def fit_feature_engineer(self):
        """Load test dataset and fit feature engineer"""
        try:
            # Initialize feature engineer
            from feature_engineering import FraudFeatureEngineer
            self.feature_engineer = FraudFeatureEngineer(pagerank_limit=self.pagerank_limit)
            
            # Find test dataset path - use script directory as base
            script_dir = os.path.dirname(os.path.abspath(__file__))
            
            # Find test dataset path
            test_paths = []
            if self.test_dataset_path:
                test_paths.append(self.test_dataset_path)
                # Also try as absolute path if relative
                if not os.path.isabs(self.test_dataset_path):
                    test_paths.append(os.path.join(script_dir, self.test_dataset_path))
            
            # Try common locations - prioritize dataset folder in ml-api
            test_paths.extend([
                os.path.join(script_dir, "dataset", "test_dataset.csv"),  # ml-api/dataset/test_dataset.csv
                os.path.join(script_dir, "dataset", "test_dataset_woIDX.csv"),  # ml-api/dataset/test_dataset_woIDX.csv
                "dataset/test_dataset.csv",  # Relative to current working directory
                "dataset/test_dataset_woIDX.csv",
                "../dataset/test_dataset.csv",  # Fallback
                "../dataset/test_dataset_woIDX.csv",
                "/app/dataset/test_dataset.csv",  # For Docker deployment
                "/app/dataset/test_dataset_woIDX.csv",
                # Legacy paths for backward compatibility
                "assets/test_dataset.csv",
                "../assets/test_dataset.csv",
                "/app/assets/test_dataset.csv"
            ])
            
            test_df = None
            dataset_path = None
            for path in test_paths:
                if os.path.exists(path):
                    dataset_path = path
                    print(f"📊 Found test dataset at {path}")
                    break
            
            if dataset_path is None:
                raise FileNotFoundError(
                    f"Test dataset not found. Tried: {test_paths}\n"
                    "Please ensure test dataset CSV is available for fitting feature engineer."
                )
            
            # Memory-efficient loading: sample dataset for fitting to reduce RAM usage
            # Read a sample of the dataset instead of the full file
            max_rows_for_fitting = int(os.getenv("MAX_FIT_ROWS", "50000"))  # Default 50k rows
            print(f"💾 Loading sample of dataset (max {max_rows_for_fitting:,} rows) for memory efficiency...")
            
            try:
                # Use chunked reading with sampling for memory efficiency
                # Read in chunks and sample from each chunk
                chunk_size = 10000
                chunks = []
                total_read = 0
                
                for chunk in pd.read_csv(dataset_path, chunksize=chunk_size):
                    # Sample from chunk if we're getting close to limit
                    if total_read + len(chunk) > max_rows_for_fitting:
                        remaining = max_rows_for_fitting - total_read
                        if remaining > 0:
                            chunk = chunk.head(remaining)
                        chunks.append(chunk)
                        break
                    chunks.append(chunk)
                    total_read += len(chunk)
                    if total_read >= max_rows_for_fitting:
                        break
                
                # Combine chunks
                if chunks:
                    test_df = pd.concat(chunks, ignore_index=True)
                    print(f"✅ Loaded {len(test_df):,} rows for feature engineering fitting (sampled from dataset)")
                else:
                    # Fallback: load with direct limit
                    test_df = pd.read_csv(dataset_path, nrows=max_rows_for_fitting)
                    print(f"✅ Loaded {len(test_df):,} rows (direct read with limit)")
                    
            except Exception as e:
                print(f"⚠️ Failed to load with chunking, trying direct read: {str(e)}")
                # Fallback: load with limit
                test_df = pd.read_csv(dataset_path, nrows=max_rows_for_fitting)
                print(f"✅ Loaded {len(test_df):,} rows (fallback method)")
            
            # Ensure required columns exist
            required_cols = ['step', 'type', 'amount', 'nameOrig', 'oldBalanceOrig', 
                           'newBalanceOrig', 'nameDest', 'oldBalanceDest', 'newBalanceDest']
            missing_cols = [col for col in required_cols if col not in test_df.columns]
            if missing_cols:
                raise ValueError(f"Test dataset missing required columns: {missing_cols}")
            
            # Add isFlaggedFraud if missing
            if 'isFlaggedFraud' not in test_df.columns:
                test_df['isFlaggedFraud'] = 0
            
            # Fit feature engineer on sampled dataset
            print("🔧 Fitting feature engineer on sampled dataset...")
            self.feature_engineer.fit(test_df)
            print("✅ Feature engineer fitted successfully")
            
            # Clear the full dataset from memory
            del test_df
            import gc
            gc.collect()
            print("🧹 Cleared dataset from memory")
            
            # Prepare SHAP background from a small sample (reload minimal data)
            print("📊 Preparing SHAP background data (small sample)...")
            shap_sample_size = min(100, max_rows_for_fitting)  # Reduced from 200 to 100
            # Reload just a tiny sample for SHAP background
            shap_df = pd.read_csv(dataset_path, nrows=shap_sample_size * 2)  # Get more to sample from
            shap_sample = shap_df.sample(n=min(shap_sample_size, len(shap_df)), random_state=42)
            # Ensure required columns
            if 'isFlaggedFraud' not in shap_sample.columns:
                shap_sample['isFlaggedFraud'] = 0
            self.shap_background = self.feature_engineer.transform(shap_sample)
            del shap_df, shap_sample
            gc.collect()
            print(f"✅ SHAP background prepared ({len(self.shap_background)} samples)")
            
            # Initialize SHAP explainer
            if XGBOOST_AVAILABLE and isinstance(self.model, xgb.XGBClassifier):
                self.shap_explainer = shap.TreeExplainer(self.model)
                print("✅ SHAP explainer initialized")
            else:
                print("⚠️ SHAP explainer not initialized (XGBoost not available or model type unknown)")
                
        except Exception as e:
            print(f"❌ Error fitting feature engineer: {str(e)}")
            raise
    
    def predict(self, transaction_df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        """
        Predict fraud probability for transactions
        
        Args:
            transaction_df: DataFrame with raw transaction data
            
        Returns:
            probabilities: Array of fraud probabilities
            decisions: Array of binary decisions (0/1)
        """
        if self.model is None:
            raise ValueError("Model not loaded. Call load_model() first.")
        
        if self.feature_engineer is None:
            raise ValueError("Feature engineer not fitted. Call fit_feature_engineer() first.")
        
        # Transform transaction using fitted feature engineer
        X_transformed = self.feature_engineer.transform(transaction_df)
        
        # Get probabilities from XGBoost model
        probabilities = self.model.predict_proba(X_transformed)[:, 1]
        
        # Make decisions based on threshold
        decisions = (probabilities >= self.threshold).astype(int)
        
        return probabilities, decisions
    
    def explain_shap(self, transaction_df: pd.DataFrame, topk: int = 10) -> pd.DataFrame:
        """
        Generate SHAP explanations for a transaction
        
        Args:
            transaction_df: Single transaction DataFrame (raw format)
            topk: Number of top features to return
            
        Returns:
            DataFrame with feature contributions sorted by importance
        """
        if self.model is None:
            raise ValueError("Model not loaded")
        
        if self.feature_engineer is None:
            raise ValueError("Feature engineer not fitted")
        
        # Transform transaction using fitted feature engineer
        X_trans = self.feature_engineer.transform(transaction_df)
        
        # Compute SHAP values
        shap_values = None
        feature_names = X_trans.columns.tolist()
        
        try:
            if self.shap_explainer is not None:
                if isinstance(self.shap_explainer, shap.TreeExplainer):
                    shap_values = self.shap_explainer.shap_values(X_trans)
                    if isinstance(shap_values, list):
                        shap_values = shap_values[1]
                else:
                    shap_exp = self.shap_explainer(X_trans)
                    shap_values = shap_exp.values[0] if shap_exp.values.ndim == 2 else shap_exp.values
            else:
                # Fallback: create explainer on the fly
                if XGBOOST_AVAILABLE and isinstance(self.model, xgb.XGBClassifier):
                    explainer = shap.TreeExplainer(self.model)
                    shap_values = explainer.shap_values(X_trans)
                    if isinstance(shap_values, list):
                        shap_values = shap_values[1]
                else:
                    explainer = shap.Explainer(self.model, X_trans.iloc[[0]], feature_names=feature_names)
                    shap_exp = explainer(X_trans)
                    shap_values = shap_exp.values[0] if shap_exp.values.ndim == 2 else shap_exp.values
        except Exception as e:
            print(f"⚠️ SHAP computation failed: {str(e)}")
            shap_values = np.zeros(X_trans.shape[1])
        
        # Ensure shap_values is 1D
        if shap_values.ndim > 1:
            shap_values = shap_values[0]
        
        # Build feature contribution DataFrame
        feat_df = pd.DataFrame({
            'feature': feature_names,
            'value': X_trans.iloc[0].values,
            'shap_abs': np.abs(shap_values),
            'shap': shap_values
        })
        
        # Sort by absolute SHAP value
        feat_df = feat_df.sort_values('shap_abs', ascending=False).reset_index(drop=True)
        
        return feat_df.head(topk)
    
    def explain_llm(self, probability: float, shap_table: pd.DataFrame, transaction_df: Optional[pd.DataFrame] = None, topk: int = 6, language: str = 'en') -> Optional[str]:
        """
        Generate human-readable explanation using Groq LLM
        
        Args:
            probability: Fraud probability
            shap_table: DataFrame with SHAP contributions
            topk: Number of top features to include
            language: Language code ('en' for English, 'bn' for Bangla)
            
        Returns:
            LLM-generated explanation text or None
        """
        if not GROQ_AVAILABLE:
            return None
        
        if self.groq_api_key is None:
            self.groq_api_key = os.getenv('GROQ_API_KEY')
        
        if self.groq_api_key is None:
            return None
        
        try:
            client = Groq(api_key=self.groq_api_key)
            
            # Determine if fraud is detected
            is_fraud = probability >= self.threshold
            decision = "block" if is_fraud else ("warn" if probability >= self.threshold * 0.5 else "pass")
            
            # Get transaction details if available
            amount = None
            tx_type = None
            old_balance_orig = None
            new_balance_orig = None
            old_balance_dest = None
            new_balance_dest = None
            
            if transaction_df is not None and len(transaction_df) > 0:
                row = transaction_df.iloc[0]
                amount = row.get('amount', None)
                tx_type = row.get('type', None)
                old_balance_orig = row.get('oldBalanceOrig', None)
                new_balance_orig = row.get('newBalanceOrig', None)
                old_balance_dest = row.get('oldBalanceDest', None)
                new_balance_dest = row.get('newBalanceDest', None)
            
            if language == 'bn':
                system_prompt = (
                    "আপনি একজন ব্যবহারকারী-বান্ধব ফ্রড সতর্কতা সহায়ক। "
                    "আপনার কাজ হল সাধারণ ব্যবহারকারীদের জন্য সহজ ভাষায় ব্যাখ্যা করা, কোন লেনদেন কেন নিরাপদ বা ঝুঁকিপূর্ণ। "
                    "কোনও প্রযুক্তিগত শব্দ (যেমন SHAP, বৈশিষ্ট্য মান, ইত্যাদি) ব্যবহার করবেন না। "
                    "পরিবর্তে, ব্যবহারকারীকে বলুন: "
                    "- এই লেনদেনে কোন লাল সংকেত আছে কিনা "
                    "- তারা কী সতর্ক থাকতে হবে "
                    "- কেন এই লেনদেন নিরাপদ বা ঝুঁকিপূর্ণ "
                    "- যদি ফ্রড সনাক্ত হয়, তাহলে কেন এটি ফ্রড হতে পারে "
                    "- তারা কী করতে পারে বা এড়াতে পারে "
                    "ব্যাখ্যাটি সহজ, বন্ধুত্বপূর্ণ এবং ব্যবহারকারীর জন্য কার্যকর হতে হবে। "
                    "সমস্ত উত্তর বাংলায় লিখুন।"
                )
                
                tx_info = ""
                if amount is not None:
                    tx_info += f"- লেনদেনের পরিমাণ: ৳ {amount:,.2f}\n"
                if tx_type is not None:
                    tx_type_bn = "ক্যাশ আউট" if tx_type == "CASH_OUT" else "স্থানান্তর" if tx_type == "TRANSFER" else tx_type
                    tx_info += f"- লেনদেনের ধরন: {tx_type_bn}\n"
                if old_balance_orig is not None and new_balance_orig is not None:
                    balance_change = new_balance_orig - old_balance_orig
                    tx_info += f"- প্রেরকের ব্যালেন্স পরিবর্তন: ৳ {balance_change:,.2f}\n"
                if old_balance_dest is not None and new_balance_dest is not None:
                    balance_change = new_balance_dest - old_balance_dest
                    tx_info += f"- গ্রহীতার ব্যালেন্স পরিবর্তন: ৳ {balance_change:,.2f}\n"
                
                user_prompt = (
                    f"লেনদেনের ফ্রড সম্ভাবনা: {probability*100:.2f}%\n"
                    f"সিদ্ধান্ত: {'ফ্রড সনাক্ত হয়েছে - লেনদেন ব্লক করা হয়েছে' if is_fraud else ('সতর্কতা - ম্যানুয়াল পর্যালোচনা প্রয়োজন' if decision == 'warn' else 'লেনদেন নিরাপদ - অনুমোদন করা যেতে পারে')}\n"
                    f"লেনদেনের তথ্য:\n{tx_info}"
                    f"\nএকটি সহজ, ব্যবহারকারী-বান্ধব ব্যাখ্যা লিখুন যা ব্যবহারকারীকে বুঝতে সাহায্য করবে কেন এই লেনদেন নিরাপদ বা ঝুঁকিপূর্ণ, এবং তাদের কী জানা উচিত বা সতর্ক থাকতে হবে।"
                )
            else:
                system_prompt = (
                    "You are a user-friendly fraud alert assistant. "
                    "Your job is to explain in simple language why a transaction is safe or risky for regular users. "
                    "Do NOT use any technical terms (like SHAP, feature values, etc.). "
                    "Instead, tell the user: "
                    "- What red flags exist in this transaction (if any) "
                    "- What they should be aware of or cautious about "
                    "- Why this transaction is safe or risky "
                    "- If fraud is detected, explain why it might be fraud "
                    "- What they can do or should avoid "
                    "The explanation should be simple, friendly, and actionable for the user. "
                    "Focus on what matters to them, not technical details."
                )
                
                tx_info = ""
                if amount is not None:
                    tx_info += f"- Transaction amount: ৳ {amount:,.2f}\n"
                if tx_type is not None:
                    tx_info += f"- Transaction type: {tx_type}\n"
                if old_balance_orig is not None and new_balance_orig is not None:
                    balance_change = new_balance_orig - old_balance_orig
                    tx_info += f"- Sender balance change: ৳ {balance_change:,.2f}\n"
                if old_balance_dest is not None and new_balance_dest is not None:
                    balance_change = new_balance_dest - old_balance_dest
                    tx_info += f"- Receiver balance change: ৳ {balance_change:,.2f}\n"
                
                user_prompt = (
                    f"Transaction fraud probability: {probability*100:.2f}%\n"
                    f"Decision: {'Fraud detected - Transaction blocked' if is_fraud else ('Warning - Manual review required' if decision == 'warn' else 'Transaction safe - Can be approved')}\n"
                    f"Transaction details:\n{tx_info}"
                    f"\nWrite a simple, user-friendly explanation that helps the user understand why this transaction is safe or risky, and what they should know or be cautious about."
                )
            
            chat_completion = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                model="llama-3.1-8b-instant",
                temperature=0.3,
                max_tokens=500
            )
            
            explanation = chat_completion.choices[0].message.content.strip()
            return explanation
            
        except Exception as e:
            error_msg = f"(LLM generation failed: {str(e)})"
            if language == 'bn':
                error_msg = f"(LLM তৈরি করতে ব্যর্থ: {str(e)})"
            return error_msg
    
    def predict_and_explain(
        self, 
        transaction_df: pd.DataFrame, 
        shap_background: Optional[pd.DataFrame] = None,
        topk: int = 6,
        use_llm: bool = True,
        language: str = 'en'
    ) -> Dict:
        """
        Complete prediction and explanation pipeline
        
        Args:
            transaction_df: Raw transaction DataFrame
            shap_background: Optional background data for SHAP
            topk: Number of top features to explain
            use_llm: Whether to generate LLM explanation
            language: Language code ('en' for English, 'bn' for Bangla)
            
        Returns:
            Dictionary with:
                - probabilities: Fraud probabilities
                - decisions: Binary decisions
                - shap_table: Feature contributions DataFrame
                - llm_explanation: Optional LLM explanation text
        """
        # Predict
        probabilities, decisions = self.predict(transaction_df)
        
        # Prepare SHAP background if needed
        if shap_background is not None:
            self.prepare_shap_background(shap_background)
        
        # Generate SHAP explanations
        shap_table = self.explain_shap(transaction_df, topk=topk)
        
        # Generate LLM explanation if requested
        llm_explanation = None
        if use_llm and GROQ_AVAILABLE:
            llm_explanation = self.explain_llm(probabilities[0], shap_table, transaction_df=transaction_df, topk=topk, language=language)
        
        return {
            'probabilities': probabilities,
            'decisions': decisions,
            'shap_table': shap_table,
            'llm_explanation': llm_explanation
        }


def load_inference_engine(
    model_path: str = "Models/fraud_pipeline_final.pkl",
    test_dataset_path: Optional[str] = None,
    threshold: float = 0.0793,
    groq_api_key: Optional[str] = None,
    pagerank_limit: Optional[int] = None
) -> FraudInference:
    """
    Convenience function to load inference engine
    
    Args:
        model_path: Path to model file
        test_dataset_path: Path to test dataset CSV (optional, will search common locations)
        threshold: Decision threshold
        groq_api_key: Optional Groq API key
        pagerank_limit: Optional limit on nodes for PageRank computation
        
    Returns:
        Initialized FraudInference instance
    """
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
            "Please ensure the model file is in one of these locations."
        )
    
    return FraudInference(
        actual_path, 
        test_dataset_path=test_dataset_path,
        threshold=threshold, 
        groq_api_key=groq_api_key,
        pagerank_limit=pagerank_limit
    )

