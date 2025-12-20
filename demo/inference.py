"""
Inference Module for Fraud Detection Pipeline
Handles model loading, prediction, SHAP explainability, and Groq LLM explanations
"""

import os
import sys
import numpy as np
import pandas as pd
import joblib
import warnings
from typing import Dict, Optional, Tuple, List
import shap

# Import FraudFeatureEngineer to make it available for pickle
try:
    from feature_engineering import FraudFeatureEngineer
    # Register in '__main__' module namespace for pickle compatibility
    # This allows pickle to find the class when loading models saved from notebooks/scripts
    # Note: Python uses '__main__' (double underscores) for scripts run directly
    if '__main__' not in sys.modules:
        import types
        sys.modules['__main__'] = types.ModuleType('__main__')
    # Add class to __main__ module (works whether it already exists or was just created)
    setattr(sys.modules['__main__'], 'FraudFeatureEngineer', FraudFeatureEngineer)
except ImportError:
    # If feature_engineering module not found, try to create a minimal class
    from sklearn.base import BaseEstimator, TransformerMixin
    import types
    
    class FraudFeatureEngineer(BaseEstimator, TransformerMixin):
        def fit(self, X, y=None):
            return self
        def transform(self, X):
            return X
    
    # Register in '__main__' module
    if '__main__' not in sys.modules:
        sys.modules['__main__'] = types.ModuleType('__main__')
    # Add class to __main__ module (works whether it already exists or was just created)
    setattr(sys.modules['__main__'], 'FraudFeatureEngineer', FraudFeatureEngineer)

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    # Try loading from current directory and project root
    load_dotenv()
    load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))
except ImportError:
    # python-dotenv not installed, skip .env loading
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
    """
    
    def __init__(self, model_path: str, threshold: float = 0.12684587, groq_api_key: Optional[str] = None):
        """
        Initialize inference engine
        
        Args:
            model_path: Path to the saved pipeline pkl file
            threshold: Decision threshold for fraud classification
            groq_api_key: Optional Groq API key for LLM explanations
        """
        self.model_path = model_path
        self.threshold = threshold
        self.groq_api_key = groq_api_key
        self.pipeline = None
        self.shap_background = None
        self.shap_explainer = None
        
        # Load model
        self.load_model()
    
    def load_model(self):
        """Load the trained pipeline model"""
        try:
            if not os.path.exists(self.model_path):
                raise FileNotFoundError(f"Model file not found: {self.model_path}")
            
            # Ensure FraudFeatureEngineer is registered before loading
            try:
                from feature_engineering import FraudFeatureEngineer
                import types
                if '__main__' not in sys.modules:
                    sys.modules['__main__'] = types.ModuleType('__main__')
                # Add class to __main__ module (works whether it already exists or was just created)
                setattr(sys.modules['__main__'], 'FraudFeatureEngineer', FraudFeatureEngineer)
            except ImportError:
                # Already registered in module imports, continue
                pass
            
            self.pipeline = joblib.load(self.model_path)
            print(f"✅ Model loaded successfully from {self.model_path}")
            
            # Verify pipeline structure
            if not hasattr(self.pipeline, 'named_steps'):
                raise ValueError("Pipeline must have 'named_steps' attribute")
            
            if 'fe' not in self.pipeline.named_steps:
                raise ValueError("Pipeline must have 'fe' (feature engineering) step")
            
            if 'clf' not in self.pipeline.named_steps:
                raise ValueError("Pipeline must have 'clf' (classifier) step")
                
        except AttributeError as e:
            if 'FraudFeatureEngineer' in str(e):
                error_msg = (
                    f"❌ Error loading model: {str(e)}\n"
                    "This usually means the FraudFeatureEngineer class is not available.\n"
                    "Please ensure feature_engineering.py is in the same directory as inference.py"
                )
                print(error_msg)
                raise AttributeError(error_msg) from e
            raise
        except Exception as e:
            print(f"❌ Error loading model: {str(e)}")
            raise
    
    def prepare_shap_background(self, background_df: Optional[pd.DataFrame] = None, n_samples: int = 200):
        """
        Prepare background data for SHAP explainer
        
        Args:
            background_df: Optional background DataFrame (raw format)
            n_samples: Number of samples to use for background
        """
        try:
            fe = self.pipeline.named_steps['fe']
            
            if background_df is not None:
                # Transform provided background
                self.shap_background = fe.transform(background_df)
            else:
                # Try to create synthetic background from pipeline stats
                # This is a fallback - ideally you should provide background data
                print("⚠️ No background data provided. Using minimal background for SHAP.")
                # Create a minimal background with zeros (not ideal but safe)
                # In production, you should save background data during training
                self.shap_background = None
            
            # Initialize SHAP explainer if we have background
            if self.shap_background is not None and len(self.shap_background) > 0:
                clf = self.pipeline.named_steps['clf']
                try:
                    # Try TreeExplainer first (faster for tree models)
                    if XGBOOST_AVAILABLE and isinstance(clf, xgb.XGBClassifier):
                        self.shap_explainer = shap.TreeExplainer(clf)
                    else:
                        # Fallback to Explainer
                        self.shap_explainer = shap.Explainer(
                            clf, 
                            self.shap_background.iloc[:min(100, len(self.shap_background))],
                            feature_names=self.shap_background.columns.tolist()
                        )
                    print("✅ SHAP explainer initialized")
                except Exception as e:
                    print(f"⚠️ SHAP explainer initialization failed: {str(e)}")
                    self.shap_explainer = None
                    
        except Exception as e:
            print(f"⚠️ Error preparing SHAP background: {str(e)}")
            self.shap_explainer = None
    
    def predict(self, transaction_df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        """
        Predict fraud probability for transactions
        
        Args:
            transaction_df: DataFrame with raw transaction data
            
        Returns:
            probabilities: Array of fraud probabilities
            decisions: Array of binary decisions (0/1)
        """
        if self.pipeline is None:
            raise ValueError("Model not loaded. Call load_model() first.")
        
        # Get probabilities
        probabilities = self.pipeline.predict_proba(transaction_df)[:, 1]
        
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
        if self.pipeline is None:
            raise ValueError("Model not loaded")
        
        fe = self.pipeline.named_steps['fe']
        clf = self.pipeline.named_steps['clf']
        
        # Transform transaction
        X_trans = fe.transform(transaction_df)
        
        # Compute SHAP values
        shap_values = None
        feature_names = X_trans.columns.tolist()
        
        try:
            if self.shap_explainer is not None:
                # Use pre-initialized explainer
                if isinstance(self.shap_explainer, shap.TreeExplainer):
                    shap_values = self.shap_explainer.shap_values(X_trans)
                    if isinstance(shap_values, list):
                        shap_values = shap_values[1]  # For binary classification
                else:
                    shap_exp = self.shap_explainer(X_trans)
                    shap_values = shap_exp.values[0] if shap_exp.values.ndim == 2 else shap_exp.values
            else:
                # Fallback: Try TreeExplainer directly
                if XGBOOST_AVAILABLE and isinstance(clf, xgb.XGBClassifier):
                    explainer = shap.TreeExplainer(clf)
                    shap_values = explainer.shap_values(X_trans)
                    if isinstance(shap_values, list):
                        shap_values = shap_values[1]
                else:
                    # Last resort: use Explainer with minimal background
                    explainer = shap.Explainer(clf, X_trans.iloc[[0]], feature_names=feature_names)
                    shap_exp = explainer(X_trans)
                    shap_values = shap_exp.values[0] if shap_exp.values.ndim == 2 else shap_exp.values
        except Exception as e:
            print(f"⚠️ SHAP computation failed: {str(e)}")
            # Return zero contributions as fallback
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
    
    def explain_llm(self, probability: float, shap_table: pd.DataFrame, topk: int = 6, language: str = 'en') -> Optional[str]:
        """
        Generate human-readable explanation using Groq LLM
        
        Args:
            probability: Fraud probability
            shap_table: DataFrame with SHAP contributions
            topk: Number of top features to include in explanation
            language: Language code ('en' for English, 'bn' for Bangla)
            
        Returns:
            LLM-generated explanation text or None
        """
        if not GROQ_AVAILABLE:
            return None
        
        if self.groq_api_key is None:
            # Try to get from environment
            self.groq_api_key = os.getenv('GROQ_API_KEY')
        
        if self.groq_api_key is None:
            return None
        
        try:
            client = Groq(api_key=self.groq_api_key)
            
            # Prepare top features for prompt
            top_feats = shap_table.head(topk)[['feature', 'value', 'shap']].copy()
            top_lines = []
            for _, row in top_feats.iterrows():
                top_lines.append(f"- {row['feature']}: value={row['value']:.6g}, shap={row['shap']:.6g}")
            
            # Language-specific prompts
            if language == 'bn':
                system_prompt = (
                    "আপনি একজন সংক্ষিপ্ত ফ্রড-বিশ্লেষণ সহায়ক। "
                    "একটি লেনদেনের জন্য বৈশিষ্ট্য অবদান (SHAP মান) এবং তাদের পর্যবেক্ষিত মান দেওয়া হলে, "
                    "মডেল কেন প্রদত্ত ফ্রড সম্ভাবনা নির্ধারণ করেছে তার একটি সংক্ষিপ্ত (৩-৬ বাক্য) মানব-পাঠযোগ্য ব্যাখ্যা তৈরি করুন। "
                    "কোন কারণগুলি ঝুঁকি বাড়ায় বা কমায় তা উল্লেখ করুন, এবং একটি সংক্ষিপ্ত সুপারিশকৃত পদক্ষেপ (যেমন, ব্লক / পর্যালোচনা / অনুমোদন) দিন। "
                    "সমস্ত উত্তর বাংলায় লিখুন।"
                )
                
                user_prompt = (
                    f"মডেল ফ্রড সম্ভাবনা: {probability:.4f}\n"
                    f"ব্লক করার থ্রেশহোল্ড: {self.threshold:.4f}\n"
                    f"শীর্ষ অবদানকারী বৈশিষ্ট্য (বৈশিষ্ট্য: মান, shap):\n" + "\n".join(top_lines) +
                    "\n\nএখন সংক্ষিপ্ত ব্যাখ্যা লিখুন।"
                )
            else:
                system_prompt = (
                    "You are a concise fraud-analytics assistant. "
                    "Given feature contributions (SHAP values) and their observed values for a single transaction, "
                    "produce a short (3-6 sentences) human-readable explanation why the model assigned the given fraud probability. "
                    "Mention which factors increase or decrease risk, and a brief recommended action (e.g., block / review / allow)."
                )
                
                user_prompt = (
                    f"Model fraud probability: {probability:.4f}\n"
                    f"Threshold for blocking: {self.threshold:.4f}\n"
                    f"Top contributing features (feature: value, shap):\n" + "\n".join(top_lines) +
                    "\n\nWrite the short explanation now."
                )
            
            chat_completion = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                model="llama-3.1-8b-instant",
                temperature=0.0,
                max_tokens=250
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
            llm_explanation = self.explain_llm(probabilities[0], shap_table, topk=topk, language=language)
        
        return {
            'probabilities': probabilities,
            'decisions': decisions,
            'shap_table': shap_table,
            'llm_explanation': llm_explanation
        }


def load_inference_engine(
    model_path: str = "Models/fraud_pipeline_final.pkl",
    threshold: float = 0.12684587,
    groq_api_key: Optional[str] = None
) -> FraudInference:
    """
    Convenience function to load inference engine
    
    Args:
        model_path: Path to model file
        threshold: Decision threshold
        groq_api_key: Optional Groq API key
        
    Returns:
        Initialized FraudInference instance
    """
    # Try multiple paths
    possible_paths = [
        model_path,
        f"../{model_path}",
        f"demo/{model_path}",
        "fraud_pipeline_final.pkl",
        "../fraud_pipeline_final.pkl"
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
    
    return FraudInference(actual_path, threshold, groq_api_key)

