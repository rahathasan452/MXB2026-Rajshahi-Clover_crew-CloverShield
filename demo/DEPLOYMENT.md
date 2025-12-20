# 🚀 CloverShield Deployment Guide

Complete guide for deploying CloverShield from demo to production.

## 📋 Table of Contents

1. [Local Development](#local-development)
2. [Streamlit Cloud (Free)](#streamlit-cloud-free)
3. [Docker Deployment](#docker-deployment)
4. [Production Scaling](#production-scaling)
5. [Model Integration](#model-integration)
6. [Monitoring & Maintenance](#monitoring--maintenance)

---

## 1. Local Development

### Quick Start

**Windows:**
```cmd
cd demo
run_demo.bat
```

**Linux/Mac:**
```bash
cd demo
chmod +x run_demo.sh
./run_demo.sh
```

**Manual:**
```bash
cd demo
pip install -r requirements.txt
streamlit run app.py
```

The demo will open at `http://localhost:8501`

### Development Mode

For hot-reloading during development:
```bash
streamlit run app.py --server.runOnSave=true
```

---

## 2. Streamlit Cloud (Free)

Perfect for showcasing the demo to stakeholders.

### Steps:

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Add CloverShield demo"
   git push origin main
   ```

2. **Deploy on Streamlit Cloud**
   - Go to [share.streamlit.io](https://share.streamlit.io)
   - Sign in with GitHub
   - Click "New app"
   - Select your repository
   - Set main file path: `demo/app.py`
   - Click "Deploy"

3. **Configure Secrets (Optional)**
   If using API keys or database credentials:
   - Go to App Settings → Secrets
   - Add your secrets in TOML format:
   ```toml
   [database]
   host = "your-db-host"
   password = "your-password"
   ```

4. **Access Your App**
   - URL: `https://yourapp.streamlit.app`
   - Share with anyone!

### Limitations:
- 1 GB RAM limit
- No persistent storage
- Sleep after inactivity
- **Best for:** Demo, POC, stakeholder presentations

---

## 3. Docker Deployment

For more control and scalability.

### Build and Run

**Using docker-compose (Recommended):**
```bash
cd demo
docker-compose up -d
```

**Using Docker directly:**
```bash
cd demo
docker build -t clovershield:latest .
docker run -p 8501:8501 clovershield:latest
```

### With ML Model

Mount your model directory:
```bash
docker run -p 8501:8501 \
  -v $(pwd)/../Models:/app/Models:ro \
  clovershield:latest
```

### Deploy to Cloud

**AWS ECS:**
```bash
# Push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ECR_URL
docker tag clovershield:latest YOUR_ECR_URL/clovershield:latest
docker push YOUR_ECR_URL/clovershield:latest

# Deploy via ECS (use AWS Console or CLI)
```

**Google Cloud Run:**
```bash
gcloud builds submit --tag gcr.io/YOUR_PROJECT/clovershield
gcloud run deploy clovershield \
  --image gcr.io/YOUR_PROJECT/clovershield \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

**Heroku:**
```bash
heroku create your-app-name
heroku container:push web
heroku container:release web
```

---

## 4. Production Scaling

For real-world deployment with high traffic.

### Architecture

```
┌─────────────┐
│   Users     │
└──────┬──────┘
       │
┌──────▼──────────┐
│  Load Balancer  │  (Nginx/HAProxy)
└──────┬──────────┘
       │
   ┌───┴────┬────────┬────────┐
   │        │        │        │
┌──▼───┐ ┌─▼───┐ ┌─▼───┐ ┌─▼───┐
│ App1 │ │App2 │ │App3 │ │AppN │  (Streamlit instances)
└──┬───┘ └─┬───┘ └─┬───┘ └─┬───┘
   │       │       │       │
   └───┬───┴───┬───┴───┬───┘
       │       │       │
    ┌──▼───────▼───────▼──┐
    │    Redis Cache      │  (Session state)
    └──────────────────────┘
           │
    ┌──────▼──────┐
    │  PostgreSQL │  (User data, transactions)
    └─────────────┘
```

### Kubernetes Deployment

**deployment.yaml:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: clovershield
spec:
  replicas: 3
  selector:
    matchLabels:
      app: clovershield
  template:
    metadata:
      labels:
        app: clovershield
    spec:
      containers:
      - name: clovershield
        image: clovershield:latest
        ports:
        - containerPort: 8501
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        volumeMounts:
        - name: model-volume
          mountPath: /app/Models
          readOnly: true
      volumes:
      - name: model-volume
        persistentVolumeClaim:
          claimName: model-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: clovershield-service
spec:
  selector:
    app: clovershield
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8501
  type: LoadBalancer
```

Deploy:
```bash
kubectl apply -f deployment.yaml
```

### Convert to FastAPI Backend

For production API:

**backend.py:**
```python
from fastapi import FastAPI
from pydantic import BaseModel
import joblib

app = FastAPI()
model = joblib.load("Models/fraud_pipeline_final.pkl")

class Transaction(BaseModel):
    sender: str
    receiver: str
    amount: float
    type: str
    # ... other fields

@app.post("/api/v1/detect")
async def detect_fraud(transaction: Transaction):
    # Convert to DataFrame
    df = create_dataframe(transaction)
    
    # Predict
    probability = model.predict_proba(df)[0, 1]
    
    # Decision logic
    decision = make_decision(probability)
    
    return {
        "fraud_probability": float(probability),
        "decision": decision,
        "timestamp": datetime.now().isoformat()
    }
```

---

## 5. Model Integration

### Preparing Your Model

Ensure your model pipeline includes:
1. Feature engineering transformer
2. Trained classifier
3. All preprocessing steps

**Save properly:**
```python
import joblib

# Save pipeline
joblib.dump(pipeline, 'fraud_pipeline_final.pkl', compress=3)

# Test loading
loaded_pipeline = joblib.load('fraud_pipeline_final.pkl')
```

### Model Versioning

**Using MLflow:**
```python
import mlflow
import mlflow.sklearn

with mlflow.start_run():
    mlflow.sklearn.log_model(pipeline, "fraud_model")
    mlflow.log_param("threshold", 0.0793)
    mlflow.log_metric("recall", 0.95)
```

**Git LFS for large files:**
```bash
git lfs install
git lfs track "*.pkl"
git add .gitattributes
git add Models/fraud_pipeline_final.pkl
git commit -m "Add model with LFS"
```

### A/B Testing

Deploy multiple model versions:
```python
# In app.py
if user_id % 2 == 0:
    model = model_v1
else:
    model = model_v2
```

---

## 6. Monitoring & Maintenance

### Logging

Add structured logging:
```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('clovershield.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# In your code
logger.info(f"Transaction processed: {transaction_id}, Decision: {decision}")
```

### Metrics to Track

1. **Performance Metrics:**
   - Response time
   - Throughput (requests/second)
   - Error rate

2. **Model Metrics:**
   - Fraud detection rate
   - False positive rate
   - Model accuracy drift

3. **Business Metrics:**
   - Money saved
   - Transactions blocked
   - User satisfaction

### Monitoring Tools

**Prometheus + Grafana:**
```python
from prometheus_client import Counter, Histogram

# Define metrics
fraud_detected = Counter('fraud_detected_total', 'Total fraud detected')
response_time = Histogram('response_time_seconds', 'Response time')

# In your code
fraud_detected.inc()
```

**Sentry for Error Tracking:**
```python
import sentry_sdk
from sentry_sdk.integrations.streamlit import StreamlitIntegration

sentry_sdk.init(
    dsn="YOUR_SENTRY_DSN",
    integrations=[StreamlitIntegration()],
)
```

### Database Migration

Replace mock database with PostgreSQL:

**database.py:**
```python
import psycopg2
from psycopg2.extras import RealDictCursor

def get_user(user_id):
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("SELECT * FROM users WHERE user_id = %s", (user_id,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()
    return user
```

### Backup Strategy

1. **Model Backups:**
   - Version control with Git LFS
   - Cloud storage (S3, GCS)
   - Automated daily backups

2. **Database Backups:**
   - Daily automated backups
   - Point-in-time recovery
   - Geographic redundancy

---

## 🎯 Deployment Checklist

### Before Going Live:

- [ ] Load testing (1000+ concurrent users)
- [ ] Security audit (OWASP Top 10)
- [ ] Model validation on recent data
- [ ] Backup and disaster recovery plan
- [ ] Monitoring and alerting setup
- [ ] Documentation complete
- [ ] User acceptance testing
- [ ] Compliance check (data privacy laws)

### Post-Launch:

- [ ] Monitor key metrics daily
- [ ] Review false positives/negatives weekly
- [ ] Retrain model monthly
- [ ] Security patches applied
- [ ] User feedback collected
- [ ] Performance optimization ongoing

---

## 📞 Support

For deployment issues:
- GitHub Issues: [Your Repo URL]
- Email: @rahathasan452
- Documentation: [Wiki/Docs URL]

---

**Built by Team Clover Crew - MXB2026 Rajshahi**

