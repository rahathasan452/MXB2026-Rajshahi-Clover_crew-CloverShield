# 🔐 Environment Variables Setup Guide

## Overview

This project uses `.env` files to store sensitive configuration like API keys. The `.env` file is **never committed to Git** to keep your secrets safe.

## Quick Setup

### 1. Create `.env` File

Copy the example file:

```bash
# Windows PowerShell
Copy-Item .env.example .env

# Windows CMD
copy .env.example .env

# Linux/Mac
cp .env.example .env
```

### 2. Edit `.env` File

Open `.env` in a text editor and fill in your actual values:

```env
# Groq API Key for LLM explanations
GROQ_API_KEY=gsk_your_actual_api_key_here
```

### 3. Get Groq API Key (Free)

1. Sign up at https://console.groq.com/
2. Navigate to API Keys section
3. Create a new API key
4. Copy the key and paste it in your `.env` file

## File Structure

```
project/
├── .env.example          # Template (safe to commit)
├── .env                  # Your actual secrets (NEVER commit!)
└── .gitignore            # Ensures .env is ignored
```

## Environment Variables

### Required (for LLM explanations)

| Variable | Description | Example |
|----------|-------------|---------|
| `GROQ_API_KEY` | Groq API key for LLM explanations | `gsk_abc123...` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `MODEL_PATH` | Path to model file | `Models/fraud_pipeline_final.pkl` |
| `MODEL_THRESHOLD` | Decision threshold | `0.12684587` |

## Security Best Practices

### ✅ DO:

- ✅ Use `.env` file for local development
- ✅ Keep `.env` in `.gitignore` (already done)
- ✅ Use `.env.example` as a template (without real values)
- ✅ Use environment variables in production (not `.env` file)
- ✅ Rotate API keys regularly
- ✅ Never share your `.env` file

### ❌ DON'T:

- ❌ Commit `.env` to Git
- ❌ Share `.env` file via email/chat
- ❌ Put real API keys in `.env.example`
- ❌ Hardcode secrets in code
- ❌ Commit secrets to version control

## How It Works

The app automatically loads variables from `.env` file using `python-dotenv`:

```python
from dotenv import load_dotenv
load_dotenv()  # Loads .env file

# Now you can use os.getenv()
api_key = os.getenv('GROQ_API_KEY')
```

## Production Deployment

### Option 1: Environment Variables (Recommended)

Set environment variables directly in your hosting platform:

**Streamlit Cloud:**
1. Go to app settings
2. Add secrets in "Secrets" section:
   ```
   GROQ_API_KEY=your_key_here
   ```

**Docker:**
```bash
docker run -e GROQ_API_KEY=your_key_here your-image
```

**Kubernetes:**
```yaml
env:
  - name: GROQ_API_KEY
    valueFrom:
      secretKeyRef:
        name: app-secrets
        key: groq-api-key
```

### Option 2: Secrets Manager

For production, use cloud secrets managers:
- AWS Secrets Manager
- Google Cloud Secret Manager
- Azure Key Vault
- HashiCorp Vault

## Troubleshooting

### `.env` file not loading

**Check:**
1. File exists: `ls .env` (Linux/Mac) or `dir .env` (Windows)
2. File location: Should be in project root or `demo/` directory
3. `python-dotenv` installed: `pip install python-dotenv`

### API key not working

**Check:**
1. Key is correct (no extra spaces)
2. Key is active at https://console.groq.com/
3. Environment variable is loaded: `print(os.getenv('GROQ_API_KEY'))`

### Still using old environment variables

**Solution:**
- Restart your app/terminal
- Clear Python cache: `find . -type d -name __pycache__ -exec rm -r {} +`
- Verify `.env` file is being read

## Example `.env` File

```env
# CloverShield Configuration
# Generated: 2025-01-20

# Groq API Key (Required for LLM explanations)
GROQ_API_KEY=gsk_your_actual_key_here

# Optional: Model Configuration
# MODEL_PATH=Models/fraud_pipeline_final.pkl
# MODEL_THRESHOLD=0.12684587
```

## Verification

Test that your `.env` file is working:

```python
import os
from dotenv import load_dotenv

load_dotenv()
key = os.getenv('GROQ_API_KEY')
if key:
    print(f"✅ API key loaded: {key[:10]}...")
else:
    print("❌ API key not found")
```

## Need Help?

- Check [MODEL_SETUP.md](MODEL_SETUP.md) for model setup
- Check [demo/INFERENCE_GUIDE.md](demo/INFERENCE_GUIDE.md) for inference usage
- Contact: @rahathasan452

---

**Remember:** Never commit `.env` to Git! It contains your secrets. 🔒

