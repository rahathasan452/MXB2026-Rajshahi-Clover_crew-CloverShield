# 🔍 Inference & Explainability Guide

## Overview

The inference module (`inference.py`) provides:
1. **Model Loading**: Load trained XGBoost pipeline
2. **Predictions**: Get fraud probabilities and binary decisions
3. **SHAP Explanations**: Feature-level contribution analysis
4. **LLM Explanations**: Human-readable AI-generated explanations via Groq

## Quick Start

### Basic Usage

```python
from inference import load_inference_engine
import pandas as pd

# Load inference engine
inference = load_inference_engine(
    model_path="Models/fraud_pipeline_final.pkl",
    threshold=0.12684587,
    groq_api_key=os.getenv('GROQ_API_KEY')  # Optional
)

# Create transaction
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

# Predict and explain
result = inference.predict_and_explain(
    transaction,
    shap_background=None,  # Optional background data
    topk=10,
    use_llm=True
)

# Access results
probability = result['probabilities'][0]
decision = result['decisions'][0]
shap_table = result['shap_table']
llm_explanation = result['llm_explanation']
```

## API Reference

### `FraudInference` Class

#### Initialization

```python
inference = FraudInference(
    model_path: str,              # Path to .pkl model file
    threshold: float = 0.12684587, # Decision threshold
    groq_api_key: Optional[str] = None  # Groq API key for LLM
)
```

#### Methods

##### `predict(transaction_df) -> Tuple[np.ndarray, np.ndarray]`

Get fraud probabilities and binary decisions.

**Returns:**
- `probabilities`: Array of fraud probabilities [0-1]
- `decisions`: Array of binary decisions (0=allow, 1=block)

##### `explain_shap(transaction_df, topk=10) -> pd.DataFrame`

Generate SHAP feature contributions.

**Returns:** DataFrame with columns:
- `feature`: Feature name
- `value`: Feature value
- `shap`: SHAP contribution value
- `shap_abs`: Absolute SHAP value (for sorting)

##### `explain_llm(probability, shap_table, topk=6) -> Optional[str]`

Generate human-readable explanation using Groq LLM.

**Returns:** Explanation text or None if LLM unavailable

##### `predict_and_explain(...) -> Dict`

Complete prediction and explanation pipeline.

**Returns:** Dictionary with:
- `probabilities`: Fraud probabilities
- `decisions`: Binary decisions
- `shap_table`: Feature contributions DataFrame
- `llm_explanation`: Optional LLM explanation text

## SHAP Background Data

For best SHAP explanations, provide background data:

```python
# Option 1: Use training data sample
background_df = training_data.sample(n=200, random_state=42)
inference.prepare_shap_background(background_df)

# Option 2: Provide during prediction
result = inference.predict_and_explain(
    transaction,
    shap_background=background_df,
    topk=10
)
```

**Note:** If no background is provided, the module will use a minimal fallback.

## Groq LLM Setup

1. **Get API Key**: Sign up at https://console.groq.com/
2. **Set Environment Variable**:
   ```bash
   export GROQ_API_KEY="your_key_here"
   ```
3. **Use in Code**:
   ```python
   inference = FraudInference(
       model_path="...",
       groq_api_key=os.getenv('GROQ_API_KEY')
   )
   ```

**Free Tier:** Groq offers generous free tier for LLM API calls.

## Integration with Streamlit App

The inference module is automatically integrated in `app.py`:

```python
# In app.py
from inference import load_inference_engine

# Load during initialization
inference_engine = load_inference_engine(...)

# Use during transaction processing
result = inference_engine.predict_and_explain(transaction_df)
```

## Standalone Usage

See `inference_example.py` for a complete standalone example:

```bash
cd demo
python inference_example.py
```

## Troubleshooting

### Model Not Found

```
FileNotFoundError: Model file not found
```

**Solution:**
- Check model path in `config.py`
- Ensure `fraud_pipeline_final.pkl` exists in `Models/` directory
- See [MODEL_SETUP.md](../MODEL_SETUP.md) for setup instructions

### SHAP Errors

```
SHAP computation failed
```

**Solutions:**
- Ensure XGBoost is installed: `pip install xgboost shap`
- Provide background data for better SHAP explanations
- Check model compatibility

### LLM Not Working

```
LLM generation failed
```

**Solutions:**
- Verify `GROQ_API_KEY` is set: `echo $GROQ_API_KEY`
- Check internet connection (API call required)
- Verify API key is valid at https://console.groq.com/

### Import Errors

```
ModuleNotFoundError: No module named 'inference'
```

**Solution:**
- Ensure you're running from `demo/` directory
- Or add to Python path: `sys.path.insert(0, 'demo')`

## Performance Tips

1. **Cache Model**: Load once, reuse many times
2. **Background Data**: Pre-compute SHAP background for faster explanations
3. **Batch Processing**: Process multiple transactions together
4. **LLM Caching**: Cache LLM explanations for similar transactions

## Example: Batch Processing

```python
# Process multiple transactions
transactions = pd.DataFrame([...])  # Multiple rows

probabilities, decisions = inference.predict(transactions)

# Explain each transaction
results = []
for idx in range(len(transactions)):
    result = inference.predict_and_explain(
        transactions.iloc[[idx]],
        use_llm=False  # Skip LLM for batch processing
    )
    results.append(result)
```

## Advanced Usage

### Custom Threshold

```python
# Use different threshold for different risk levels
inference.threshold = 0.3  # More conservative
probabilities, decisions = inference.predict(transaction)
```

### SHAP Visualization

```python
import matplotlib.pyplot as plt
import shap

shap_table = inference.explain_shap(transaction)

# Create waterfall plot
shap_values = shap_table['shap'].values
feature_names = shap_table['feature'].values

shap.plots.waterfall(...)  # Requires shap library
```

## See Also

- [MODEL_SETUP.md](../MODEL_SETUP.md) - Model file setup
- [inference_example.py](inference_example.py) - Complete example
- [app.py](app.py) - Streamlit integration

