# 🛡️ CloverShield - Mobile Banking Fraud Detection Demo

A bilingual, user-friendly fraud detection system for Bangladeshi mobile banking (bKash, Nagad, Upay, Rocket).

## ✨ Features

### 1. **Twin-View Interface**
- **Left Panel (Simulator)**: Interactive transaction simulator with user selection and transaction details
- **Right Panel (Guardian)**: Real-time fraud detection command center with instant feedback

### 2. **Intelligent Context Adapter**
- Auto-fetches user data from mock database (balance, transaction history, risk profile)
- Seamlessly integrates with pre-trained ML pipeline
- Enriches transactions with contextual features

### 3. **Three-Tier Decision System**
- 🟢 **PASS**: Low risk (<30% probability) - Transaction approved
- 🟡 **WARN**: Medium risk (30-70%) - Manual verification recommended
- 🔴 **BLOCK**: High risk (>70%) - Transaction blocked

### 4. **Real-Time Analytics**
- **Confidence Gauge**: Visual speedometer showing fraud probability
- **Money Saved Ticker**: Live counter of blocked fraud amounts
- **Session Statistics**: Transactions processed, fraud detected, accuracy rate

### 5. **XAI (Explainable AI)**
- Clear explanations for each decision
- Key risk factors highlighted
- User-friendly language for all demographics

### 6. **Developer Tools**
- **Payload Viewer**: Toggle to see production-ready API request/response format
- JSON structure ready for backend integration

### 7. **Bilingual Support**
- 🇬🇧 English / 🇧🇩 Bangla toggle
- Seamless language switching
- Culturally appropriate UX

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
cd mrf/demo

# Install dependencies
pip install -r requirements.txt

# Run the demo
streamlit run app.py
```

### With ML Model

If you have a trained model (`.pkl` file):

```bash
# Place your model file in one of these locations:
# - mrf/Models/fraud_pipeline_final.pkl
# - mrf/demo/fraud_pipeline_final.pkl

# The app will automatically detect and load it
streamlit run app.py
```

### Without ML Model

The demo includes a sophisticated rule-based fallback system that works without the ML model:
- Balance validation
- Amount anomaly detection
- User risk profiling
- Transaction pattern analysis

## 📁 Project Structure

```
demo/
├── app.py                  # Main Streamlit application
├── config.py              # Translations and configuration
├── mock_data.py           # Mock database and data generator
├── requirements.txt       # Python dependencies
└── README.md             # This file
```

## 🎯 Usage Guide

### For Demo/Showcase:

1. **Select a sender** from the dropdown (or click "Random User")
2. **View user details** - balance, transaction history, risk profile
3. **Enter transaction details**:
   - Select receiver
   - Enter amount
   - Choose transaction type (Cash Out / Transfer)
4. **Click "Process Transaction"**
5. **View results** in the Guardian panel:
   - Fraud probability gauge
   - Decision (Pass/Warn/Block)
   - Risk factors explanation
   - API payload (for developers)

### For Integration:

The payload viewer shows the exact API structure needed for backend integration:

```json
{
  "request": {
    "transaction_id": "TXN20251221...",
    "timestamp": "2025-12-21T...",
    "sender": "C123456789",
    "receiver": "C987654321",
    "amount": 5000.0,
    "type": "CASH_OUT",
    ...
  },
  "response": {
    "fraud_probability": 0.23,
    "decision": "pass",
    "risk_level": "Low",
    "factors": [...],
    "processing_time_ms": 145
  }
}
```

## 🔧 Configuration

Edit `config.py` to customize:
- Risk thresholds (pass/warn/block)
- UI theme colors
- Translation strings
- Model paths

## 🌐 Deployment Options

### 1. **Streamlit Cloud** (Free)
- Push to GitHub
- Connect to Streamlit Cloud
- Deploy in 1-click
- URL: `https://yourapp.streamlit.app`

### 2. **Docker** (Scalable)
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8501
CMD ["streamlit", "run", "app.py"]
```

### 3. **Production API** (Future)
- Convert to FastAPI backend
- React/Next.js frontend
- PostgreSQL database
- Redis caching
- Docker + Kubernetes

## 🎨 Design Philosophy

### User-Centric
- Simple language (no technical jargon)
- Visual feedback (colors, icons, animations)
- Bilingual support for accessibility
- Mobile-responsive design

### Developer-Friendly
- Clean code structure
- Modular components
- Easy customization
- Clear documentation
- Production-ready payload format

### Scalable Architecture
- Separation of concerns (UI, logic, data)
- Pluggable model system
- Fallback mechanisms
- Configuration-driven

## 📊 Model Integration

The app works with the trained XGBoost pipeline from the notebook:

### Expected Model Interface
```python
# Input: pandas DataFrame with columns:
# - step, type, amount, nameOrig, oldBalanceOrig, 
#   newBalanceOrig, nameDest, oldBalanceDest, 
#   newBalanceDest, isFlaggedFraud

# Output: 
model.predict_proba(df)[:, 1]  # Fraud probability [0-1]
```

### Feature Engineering
The model pipeline should include:
- Balance ratio features
- Transaction frequency
- Graph-based features (PageRank, degree)
- Amount normalization
- Time-based features

## 🧪 Testing

### Test Scenarios

1. **Low Risk**: Small amount, verified user, normal pattern
2. **Medium Risk**: Large amount, new receiver, unusual time
3. **High Risk**: Amount > balance, suspicious user, high-value cash-out

### Test Users
The mock database includes users with different risk profiles:
- 70% low risk
- 20% medium risk
- 8% high risk
- 2% suspicious

## 🤝 Contributing

Team Clover Crew - MXB2026 Rajshahi

Contact: @rahathasan452

## 📄 License

See parent repository LICENSE file.

## 🙏 Acknowledgments

- Inspired by modern credit card fraud detection UIs
- Built for Bangladeshi mobile banking users
- Designed for inclusivity and accessibility

---

**Built with ❤️ for a safer digital financial future in Bangladesh**

