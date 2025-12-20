"""
Example script showing how to use the inference module standalone
"""

import pandas as pd
import os

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
    load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))
except ImportError:
    pass

from inference import load_inference_engine

# Example usage
if __name__ == "__main__":
    # Load inference engine
    print("Loading inference engine...")
    try:
        # Set Groq API key (optional, for LLM explanations)
        groq_key = os.getenv('GROQ_API_KEY')
        
        inference = load_inference_engine(
            model_path="Models/fraud_pipeline_final.pkl",
            threshold=0.12684587,  # From training
            groq_api_key=groq_key
        )
        print("✅ Inference engine loaded successfully!")
    except FileNotFoundError as e:
        print(f"❌ Model file not found: {e}")
        print("Please ensure fraud_pipeline_final.pkl is in Models/ directory")
        exit(1)
    except Exception as e:
        print(f"❌ Error loading inference engine: {e}")
        exit(1)
    
    # Create example transaction
    print("\n" + "="*50)
    print("Example Transaction")
    print("="*50)
    
    transaction = pd.DataFrame([{
        'step': 744,
        'type': 'CASH_OUT',
        'amount': 500000.0,
        'nameOrig': 'C12345_NEW_USER',
        'oldBalanceOrig': 500000.0,
        'newBalanceOrig': 0.0,
        'nameDest': 'C99999_EXISTING_BAD',
        'oldBalanceDest': 0.0,
        'newBalanceDest': 0.0,
        'isFlaggedFraud': 0
    }])
    
    print("\nTransaction Details:")
    print(transaction.to_string())
    
    # Predict and explain
    print("\n" + "="*50)
    print("Running Prediction & Explanation")
    print("="*50)
    
    result = inference.predict_and_explain(
        transaction,
        shap_background=None,  # Optional: provide background data
        topk=10,
        use_llm=True
    )
    
    # Display results
    print(f"\n📊 Fraud Probability: {result['probabilities'][0]:.4f}")
    print(f"🚦 Decision: {'BLOCK' if result['decisions'][0] == 1 else 'ALLOW'}")
    print(f"🎯 Threshold: {inference.threshold:.4f}")
    
    print("\n" + "="*50)
    print("Top Feature Contributions (SHAP)")
    print("="*50)
    print(result['shap_table'].head(10).to_string(index=False))
    
    if result.get('llm_explanation'):
        print("\n" + "="*50)
        print("AI Explanation (Groq LLM)")
        print("="*50)
        print(result['llm_explanation'])
    else:
        print("\n⚠️ LLM explanation not available (set GROQ_API_KEY environment variable)")
    
    print("\n" + "="*50)
    print("✅ Inference complete!")
    print("="*50)

