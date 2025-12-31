# CloverShield ML API Deployment Guide

Complete guide for deploying the ML Inference API to various platforms.

## 📋 Prerequisites

- Docker installed (for containerized deployment)
- Model file: `Models/fraud_pipeline_final.pkl`
- Environment variables configured
- Platform account (Vercel/Render/Railway)

## 🐳 Docker Deployment

### Local Docker

```bash
# Build image
docker build -t clovershield-ml-api .

# Run container
docker run -d \
  --name clovershield-api \
  -p 8000:8000 \
  -v $(pwd)/Models:/app/Models \
  -e GROQ_API_KEY=your-key \
  clovershield-ml-api

# Check logs
docker logs clovershield-api

# Test
curl http://localhost:8000/health
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  ml-api:
    build: .
    ports:
      - "8000:8000"
    volumes:
      - ./Models:/app/Models
    environment:
      - MODEL_PATH=Models/fraud_pipeline_final.pkl
      - GROQ_API_KEY=${GROQ_API_KEY}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

Run:
```bash
docker-compose up -d
```

## ☁️ Platform-Specific Deployment

### Option 1: Render.com (Recommended)

**Pros:**
- Easy setup
- Good for ML workloads
- Free tier available
- Supports Docker

**Steps:**

1. **Create Account**: Sign up at  [render.com](https://render.com)

2. **Create New Web Service**:
   - Connect GitHub repository
   - Select "Docker" as environment
   - Use `render.yaml` configuration

3. **Configure Environment Variables**:
   ```
   MODEL_PATH=Models/fraud_pipeline_final.pkl
   MODEL_THRESHOLD=0.00754482
   GROQ_API_KEY=your-key-here
   ```

4. **Deploy**:
   - Render will auto-detect `render.yaml`
   - Build and deploy automatically
   - Get public URL: `https://clovershield-ml-api.onrender.com`

5. **Update Model File**:
   - Upload model to cloud storage (S3, etc.)
   - Modify Dockerfile to download on startup
   - Or use Render's persistent disk

**Model File Options:**
- **Option A**: Include in Docker image (not recommended - large)
- **Option B**: Download from S3/GCS on startup
- **Option C**: Use Render persistent disk

### Option 2: Railway.app

**Pros:**
- Simple deployment
- Good developer experience
- Automatic HTTPS

**Steps:**

1. **Create Account**: Sign up at [railway.app](https://railway.app)

2. **Create New Project**:
   - Connect GitHub repository
   - Railway auto-detects `railway.json`

3. **Configure Environment Variables**:
   - Go to Variables tab
   - Add required variables

4. **Deploy**:
   - Railway builds and deploys automatically
   - Get public URL: `https://clovershield-ml-api.up.railway.app`

### Option 3: Vercel (Limited)

**Pros:**
- Fast deployment
- Great for frontend

**Cons:**
- Limited for ML workloads
- Serverless function timeout limits
- Model size restrictions

**Steps:**

1. **Install Vercel CLI**: `npm i -g vercel`

2. **Deploy**:
   ```bash
   vercel
   ```

3. **Configure**:
   - Set environment variables in dashboard
   - Note: Model file must be < 50MB

**Note**: Vercel is not ideal for ML APIs. Use Render or Railway instead.

### Option 4: AWS/GCP/Azure

For production deployments, consider:

- **AWS**: ECS, EKS, or Lambda (with container support)
- **GCP**: Cloud Run or GKE
- **Azure**: Container Instances or AKS

## 🔧 Model File Management

### Option 1: Include in Docker Image

**Pros**: Simple  
**Cons**: Large image size, slower builds

```dockerfile
COPY Models/fraud_pipeline_final.pkl Models/
```

### Option 2: Download from Cloud Storage

**Pros**: Smaller image, flexible  
**Cons**: Requires cloud storage setup

Modify `main.py` startup:

```python
import boto3
import os

def download_model():
    s3 = boto3.client('s3')
    s3.download_file('your-bucket', 'fraud_pipeline_final.pkl', 'Models/fraud_pipeline_final.pkl')
```

### Option 3: Environment Variable Path

**Pros**: Flexible  
**Cons**: Requires manual setup

Set `MODEL_PATH` to point to mounted volume or cloud path.

## 🔒 Production Security

### 1. API Authentication

Add API key middleware:

```python
from fastapi import Header, HTTPException

API_KEY = os.getenv("API_KEY")

@app.middleware("http")
async def verify_api_key(request: Request, call_next):
    if request.url.path.startswith("/docs"):
        return await call_next(request)
    
    api_key = request.headers.get("X-API-Key")
    if api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    return await call_next(request)
```

### 2. Rate Limiting

Install: `pip install slowapi`

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.post("/predict")
@limiter.limit("10/minute")
async def predict(...):
    ...
```

### 3. HTTPS

- Use platform's built-in HTTPS (Render, Railway)
- Or configure reverse proxy (nginx, Traefik)

### 4. Monitoring

Add logging and monitoring:

```python
import logging
from prometheus_client import Counter, Histogram

request_count = Counter('requests_total', 'Total requests')
request_duration = Histogram('request_duration_seconds', 'Request duration')

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    request_duration.observe(duration)
    request_count.inc()
    return response
```

## 📊 Health Checks

All platforms support health checks:

```bash
# Test health endpoint
curl https://your-api-url.com/health

# Expected response
{
  "status": "healthy",
  "model_loaded": true,
  "model_version": "1.0.0"
}
```

## 🧪 Testing Deployment

### 1. Health Check

```bash
curl https://your-api-url.com/health
```

### 2. Prediction Test

```bash
curl -X POST https://your-api-url.com/predict \
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

### 3. Load Testing

Use `ab` (Apache Bench) or `wrk`:

```bash
# Install
brew install wrk  # macOS
# or
apt-get install apache2-utils  # Linux

# Test
wrk -t4 -c100 -d30s --script=test.lua https://your-api-url.com/predict
```

## 🐛 Troubleshooting

### Model Not Loading

**Symptoms**: `503 Model not loaded` error

**Solutions**:
1. Check `MODEL_PATH` environment variable
2. Verify model file exists in container
3. Check file permissions
4. Review container logs

### Out of Memory

**Symptoms**: Container crashes, OOM errors

**Solutions**:
1. Increase container memory limit
2. Use model quantization
3. Implement model caching
4. Scale horizontally

### Slow Response Times

**Symptoms**: High latency

**Solutions**:
1. Optimize model (quantization, pruning)
2. Use faster hardware (GPU if available)
3. Implement caching
4. Optimize feature engineering

### CORS Errors

**Symptoms**: Frontend can't call API

**Solutions**:
1. Configure CORS in `main.py`
2. Add frontend domain to allowed origins
3. Check platform CORS settings

## 📈 Scaling

### Horizontal Scaling

- Use load balancer
- Deploy multiple instances
- Use platform auto-scaling

### Vertical Scaling

- Increase container resources
- Use faster CPU/GPU
- Optimize model

## ✅ Deployment Checklist

- [ ] Model file accessible
- [ ] Environment variables set
- [ ] Health check working
- [ ] API endpoints responding
- [ ] CORS configured
- [ ] Authentication enabled (production)
- [ ] Rate limiting configured
- [ ] Monitoring set up
- [ ] Logs accessible
- [ ] HTTPS enabled
- [ ] Backup strategy in place

## 🚀 Quick Deploy Commands

### Render

```bash
# Using Render CLI
render deploy
```

### Railway

```bash
# Using Railway CLI
railway up
```

### Docker Hub + Any Platform

```bash
# Build and push
docker build -t your-username/clovershield-ml-api .
docker push your-username/clovershield-ml-api

# Deploy to platform using image
```

---

**Status**: Ready for deployment! 🚀

