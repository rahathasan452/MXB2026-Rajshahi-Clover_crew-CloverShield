# ML API Quick Start

Quick reference for deploying CloverShield ML Inference API.

## ✅ What's Included

- ✅ FastAPI service with `/predict` endpoint
- ✅ Docker containerization
- ✅ Deployment configs for Render/Railway/Vercel
- ✅ Complete documentation

## 🚀 Deploy in 5 Minutes

### Option 1: Render.com (Recommended)

1. **Sign up** at [render.com](https://render.com)
2. **Create Web Service** → Connect GitHub repo
3. **Configure**:
   - Environment: Docker
   - Build Command: (auto-detected)
   - Start Command: (auto-detected)
4. **Set Environment Variables**:
   ```
   MODEL_PATH=Models/fraud_pipeline_final.pkl
   GROQ_API_KEY=your-key (optional)
   ```
5. **Deploy** → Get URL: `https://your-app.onrender.com`

### Option 2: Railway.app

1. **Sign up** at [railway.app](https://railway.app)
2. **New Project** → Connect GitHub
3. **Railway auto-detects** `railway.json`
4. **Set environment variables** in dashboard
5. **Deploy** → Get URL automatically

### Option 3: Local Docker

```bash
# Build
docker build -t clovershield-ml-api .

# Run
docker run -p 8000:8000 \
  -v $(pwd)/Models:/app/Models \
  clovershield-ml-api

# Test
curl http://localhost:8000/health
```

## 📝 API Usage

### Health Check
```bash
curl https://your-api-url.com/health
```

### Predict Fraud
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

## 📚 Full Documentation

- [README.md](./README.md) - Complete API documentation
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Detailed deployment guide

## ✅ Checklist

- [ ] Model file available (`Models/fraud_pipeline_final.pkl`)
- [ ] Environment variables configured
- [ ] API deployed and accessible
- [ ] Health check passing
- [ ] Test prediction working

**Ready to deploy!** 🚀

