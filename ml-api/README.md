---
title: CloverShield ML API
emoji: 🛡️
colorFrom: green
colorTo: blue
sdk: docker
app_port: 7860
---

# CloverShield ML Inference API

FastAPI microservice for fraud detection predictions. This service replaces the local model loading mechanism in the Streamlit app.

## 🚀 Quick Start

### Local Development

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Copy model file:**
   ```bash
   cp ../Models/fraud_pipeline_final.pkl Models/
   ```

3. **Set environment variables:**
   ```bash
   cp env.template .env
   # Edit .env with your values
   ```

4. **Run the API:**
   ```bash
   python main.py
   # Or
   uvicorn main:app --reload
   ```

5. **Test the API:**
   ```bash
   curl http://localhost:8000/health
   ```

### Docker

1. **Build the image:**
   ```bash
   docker build -t clovershield-ml-api . 
   ```

2. **Run the container:**
   ```bash
   docker run -p 8000:8000 \
     -v $(pwd)/Models:/app/Models \
     -e GROQ_API_KEY=your-key \
     clovershield-ml-api
   ```

## 📚 API Endpoints

### `GET /`
Root endpoint - service information

### `GET /health`
Health check endpoint

**Response:**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "model_version": "1.0.0",
  "shap_available": true,
  "llm_available": true
}
```

### `GET /model/info`
Get model metadata

### `POST /predict`
Predict fraud probability for a single transaction

**Request:**
```json
{
  "transaction": {
    "step": 1,
    "type": "CASH_OUT",
    "amount": 5000.00,
    "nameOrig": "C123456789",
    "oldBalanceOrig": 50000.00,
    "newBalanceOrig": 45000.00,
    "nameDest": "C234567890",
    "oldBalanceDest": 25000.00,
    "newBalanceDest": 30000.00
  },
  "options": {
    "include_shap": true,
    "include_llm_explanation": false,
    "language": "en",
    "topk": 10
  }
}
```

**Response:**
```json
{
  "transaction_id": "550e8400-e29b-41d4-a716-446655440000",
  "prediction": {
    "fraud_probability": 0.2345,
    "decision": "pass",
    "risk_level": "low",
    "confidence": 0.85
  },
  "shap_explanations": [
    {
      "feature": "amount_over_oldBalanceOrig",
      "value": 0.1,
      "shap": 0.0234,
      "shap_abs": 0.0234,
      "rank": 1
    }
  ],
  "llm_explanation": null,
  "processing_time_ms": 145,
  "model_version": "1.0.0",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### `POST /predict/batch`
Predict fraud probability for multiple transactions

## 🐳 Docker Deployment

### Build and Push to Registry

```bash
# Build
docker build -t clovershield-ml-api:latest . 

# Tag for registry
docker tag clovershield-ml-api:latest your-registry/clovershield-ml-api:latest

# Push
docker push your-registry/clovershield-ml-api:latest
```

## ☁️ Platform Deployment

### Hugging Face Spaces (Recommended)

1. Create a new Space on Hugging Face.
2. Select "Docker" as the SDK.
3. Upload the contents of this directory to the Space.
4. Set the `GROQ_API_KEY` secret in the Space settings.


### Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Deploy: `vercel`
3. Set environment variables in Vercel dashboard

**Note:** Vercel has limitations for ML models. Consider Render or Railway for better performance.

### Render

1. Connect your GitHub repository
2. Create new Web Service
3. Use `render.yaml` configuration
4. Set environment variables in dashboard
5. Deploy

### Railway

1. Connect your GitHub repository
2. Create new project
3. Railway will auto-detect `railway.json`
4. Set environment variables
5. Deploy

## 🔧 Configuration

### Environment Variables

- `MODEL_PATH` - Path to model file (default: `Models/fraud_pipeline_final.pkl`)
- `TEST_DATASET_PATH` - Path to test dataset CSV for feature engineering (optional, auto-detected if not provided)
- `MODEL_THRESHOLD` - Decision threshold (default: `0.00754482` - optimized for 99% recall)
- `PORT` - Server port (default: `8000`)
- `HOST` - Server host (default: `0.0.0.0`)
- `GROQ_API_KEY` - Optional Groq API key for LLM explanations
- `PAGERANK_LIMIT` - Optional limit on nodes for PageRank computation (for memory optimization)
- `MAX_FIT_ROWS` - Maximum rows to use for feature engineering fitting (default: `50000`)

### Model File

The model file (`fraud_pipeline_final.pkl`) must be available at runtime. Options:

1. **Include in Docker image** (not recommended for large files)
2. **Mount as volume** (Docker)
3. **Download from cloud storage** (S3, GCS, etc.)
4. **Use environment variable** to specify path

## 📊 API Documentation

Interactive API documentation available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## 🧪 Testing

### Test with curl

```bash
# Health check
curl http://localhost:8000/health

# Prediction
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "transaction": {
      "step": 1,
      "type": "TRANSFER",
      "amount": 5000.00,
      "nameOrig": "C123456789",
      "oldBalanceOrig": 50000.00,
      "newBalanceOrig": 45000.00,
      "nameDest": "C234567890",
      "oldBalanceDest": 25000.00,
      "newBalanceDest": 30000.00
    }
  }'
```

### Test with Python

```python
import requests

response = requests.post(
    "http://localhost:8000/predict",
    json={
        "transaction": {
            "step": 1,
            "type": "TRANSFER",
            "amount": 5000.00,
            "nameOrig": "C123456789",
            "oldBalanceOrig": 50000.00,
            "newBalanceOrig": 45000.00,
            "nameDest": "C234567890",
            "oldBalanceDest": 25000.00,
            "newBalanceDest": 30000.00
        }
    }
)

print(response.json())
```

## 🔒 Security

**Production Recommendations:**
- Add API key authentication for production
- Use HTTPS in production
- Implement rate limiting
- Validate all inputs
- Monitor for abuse
- Restrict CORS origins (currently set to `["*"` for development)
- Use environment variables for sensitive data

## 📈 Performance

**Optimization Tips:**
- Model loads once on startup (lazy loading supported for serverless)
- Single worker recommended (ML models are not thread-safe)
- Consider caching for frequently accessed data
- Monitor memory usage (XGBoost models can be large)
- Feature engineering uses sampled dataset (configurable via `MAX_FIT_ROWS`)
- SHAP background uses minimal sample size (100 rows) for efficiency

## 🐛 Troubleshooting

### Model not loading

- Check `MODEL_PATH` environment variable
- Verify model file exists
- Check file permissions
- Review logs for error messages

### SHAP not working

- Ensure XGBoost is installed
- Check model type compatibility
- Review SHAP initialization logs

### LLM explanations failing

- Verify `GROQ_API_KEY` is set
- Check API key validity
- Review Groq API status

## 📝 License

See main project LICENSE file.