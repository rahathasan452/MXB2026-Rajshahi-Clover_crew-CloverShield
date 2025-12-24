# 🎯 Model Setup Guide

## Handling Large Model Files

Your trained model (`fraud_pipeline_final.pkl`) is too large to upload directly to GitHub. Here are several solutions:

## Option 1: Git LFS (Recommended for GitHub)

Git LFS (Large File Storage) allows you to version control large files.

### Setup Git LFS:

```bash
# Install Git LFS (if not already installed)
# Windows: Download from https://git-lfs.github.com/
# Mac: brew install git-lfs
# Linux: sudo apt-get install git-lfs

# Initialize Git LFS in your repository
git lfs install

# Track .pkl files
git lfs track "*.pkl"
git lfs track "Models/*.pkl"

# Add .gitattributes (created automatically)
git add .gitattributes

# Add your model file
git add Models/fraud_pipeline_final.pkl

# Commit and push
git commit -m "Add model file via Git LFS"
git push
```

**Note:** Git LFS has free tier limits (1GB storage, 1GB bandwidth/month). For larger files, consider other options.

---

## Option 2: Cloud Storage (Recommended for Production)

Store your model in cloud storage and download it at runtime.

### Using Google Drive / Dropbox:

1. Upload `fraud_pipeline_final.pkl` to Google Drive/Dropbox
2. Get a shareable link
3. Create a download script:

```python
# demo/download_model.py
import os
import requests
from pathlib import Path

def download_model():
    """Download model from cloud storage"""
    model_url = "YOUR_SHAREABLE_LINK_HERE"  # Replace with actual link
    model_path = Path("Models/fraud_pipeline_final.pkl")
    
    if model_path.exists():
        print("✅ Model already exists")
        return
    
    print("📥 Downloading model...")
    response = requests.get(model_url, stream=True)
    
    model_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(model_path, 'wb') as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)
    
    print(f"✅ Model downloaded to {model_path}")

if __name__ == "__main__":
    download_model()
```

### Using AWS S3 / Google Cloud Storage:

```python
# Example for AWS S3
import boto3

def download_from_s3(bucket_name, object_key, local_path):
    s3 = boto3.client('s3')
    s3.download_file(bucket_name, object_key, local_path)
    print(f"✅ Model downloaded from S3 to {local_path}")
```

---

## Option 3: Model Registry / MLflow

Use MLflow or similar tools for model versioning:

```python
import mlflow

# During training (in notebook)
mlflow.sklearn.log_model(pipeline, "fraud_detection_model")

# During inference
model_uri = "models:/fraud_detection_model/Production"
model = mlflow.sklearn.load_model(model_uri)
```

---

## Option 4: Manual Setup (For Local Development)

1. **Place model file manually:**
   ```
   Models/
   └── fraud_pipeline_final.pkl  # Place your model here
   ```

2. **Add to .gitignore** (already done):
   ```
   Models/*.pkl
   ```

3. **Document in README:**
   - Tell users to download model separately
   - Provide download link or instructions

---

## Option 5: Model Compression (If Applicable)

Some models can be compressed without significant accuracy loss:

```python
import joblib
import gzip

# Compress model
with gzip.open('fraud_pipeline_final.pkl.gz', 'wb') as f:
    joblib.dump(pipeline, f)

# Load compressed model
with gzip.open('fraud_pipeline_final.pkl.gz', 'rb') as f:
    pipeline = joblib.load(f)
```

**Note:** This may not work well for all models, especially if they contain large numpy arrays.

---

## Recommended Setup for This Project

### For Development:
1. Use **Option 4** (manual setup) - place model in `Models/` directory
2. Add `Models/*.pkl` to `.gitignore` (already done)

### For Production/Deployment:
1. Use **Option 2** (cloud storage) - store model in S3/GCS/Drive
2. Download model at container startup or first request
3. Cache model in memory/disk for subsequent requests

### For GitHub Sharing:
1. Use **Option 1** (Git LFS) if file < 1GB
2. Or use **Option 2** (cloud storage) with download script

---

## Quick Start: Local Setup

1. **Download your trained model** (`fraud_pipeline_final.pkl`)

2. **Place it in the Models directory:**
   ```bash
   mkdir -p Models
   cp /path/to/your/fraud_pipeline_final.pkl Models/
   ```

3. **Verify model path in config:**
   ```python
   # demo/config.py
   MODEL_CONFIG = {
       "model_path": "Models/fraud_pipeline_final.pkl",
       ...
   }
   ```

4. **Run the app:**
   ```bash
   cd demo
   streamlit run app.py
   ```

---

## Environment Variables

For Groq LLM explanations, use `.env` file (recommended):

```bash
# 1. Copy example file
cp .env.example .env  # Linux/Mac
copy .env.example .env  # Windows

# 2. Edit .env and add your API key
GROQ_API_KEY=your_groq_api_key_here
```

**Or** set environment variable directly:

```bash
# Windows PowerShell
$env:GROQ_API_KEY="your_groq_api_key_here"

# Windows CMD
set GROQ_API_KEY=your_groq_api_key_here

# Linux/Mac
export GROQ_API_KEY="your_groq_api_key_here"
```

See [ENV_SETUP.md](ENV_SETUP.md) for detailed `.env` setup guide.

---

## Model File Size Estimates

- **Small model** (< 100MB): Can use Git LFS free tier
- **Medium model** (100MB - 1GB): Use Git LFS or cloud storage
- **Large model** (> 1GB): Use cloud storage (S3/GCS) or model registry

---

## Troubleshooting

### Model not found error:
- Check file path in `config.py`
- Verify model file exists: `ls Models/fraud_pipeline_final.pkl`
- Check file permissions

### Import errors:
- Install dependencies: `pip install -r demo/requirements.txt`
- Verify Python version: `python --version` (should be 3.8+)

### SHAP errors:
- Ensure XGBoost is installed: `pip install xgboost shap`
- Check model compatibility with SHAP

---

## Model Performance Metrics

### Latest Model Performance (Test Set)

**Test Set Results:**
- **Accuracy**: 100%
- **Recall**: 100% (2,938/2,938 fraud cases detected)
- **Precision**: 91% (2,938 true positives, 298 false positives)
- **F1-Score**: 0.95
- **False Positive Rate**: 0.22%

**Test Set Composition:**
- Total transactions: 137,779
- Fraud cases: 2,938
- Legitimate transactions: 134,841

**Confusion Matrix:**
```
                Predicted
              Legitimate  Fraud
Actual Legitimate  134543    298
       Fraud           0   2938
```

### Model Configuration

- **Decision Threshold**: 0.00754482
- **Target Recall**: 99% (achieved 100% on test set)
- **Model Type**: XGBoost Classifier
- **Hyperparameters**:
  - `n_estimators`: 489
  - `max_depth`: 7
  - `learning_rate`: 0.0356
  - `scale_pos_weight`: 498
  - `subsample`: 0.727
  - `colsample_bytree`: 0.760

### Training Set Performance (Cross-Validation)

- **Accuracy**: 100%
- **Recall**: 99% (5,223/5,275 fraud cases detected)
- **Precision**: 40%
- **F1-Score**: 0.57
- **Training Data**: 2.63M transactions, 5,275 fraud cases

---

## Need Help?

Contact: @rahathasan452 or create an issue on GitHub.

