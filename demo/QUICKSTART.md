# ⚡ CloverShield Quick Start

Get the demo running in 2 minutes!

## 🚀 Fastest Way to Run

### Windows
1. Open PowerShell/CMD in the `demo` folder
2. Double-click `run_demo.bat`
3. Wait for browser to open
4. Done! 🎉

### Linux/Mac
```bash
cd demo
chmod +x run_demo.sh
./run_demo.sh
```

### Manual (All Platforms)
```bash
cd demo
pip install streamlit pandas numpy plotly
streamlit run app.py
```

---

## 📱 Try These Demo Scenarios

### 1. Normal Transaction ✅
- **User:** Any "Low Risk" user
- **Amount:** ৳3,000
- **Type:** Transfer
- **Expected:** 🟢 PASS

### 2. Suspicious Transaction ⚠️
- **User:** Any "Medium Risk" user
- **Amount:** ৳25,000
- **Type:** Cash Out
- **Expected:** 🟡 WARN

### 3. Fraudulent Transaction 🚫
- **User:** Any "Suspicious" user
- **Amount:** ৳80,000
- **Type:** Cash Out
- **Expected:** 🔴 BLOCK

---

## 🎯 Key Features to Show

1. **Bilingual:** Toggle between English/Bangla
2. **Real-time:** Instant fraud probability gauge
3. **Analytics:** Money saved, fraud detected
4. **Explanations:** Why each decision was made
5. **Developer View:** Click "Show Payload" for API format

---

## 🎨 Customization

### Change Language Default
Edit `demo/app.py`:
```python
if 'language' not in st.session_state:
    st.session_state.language = 'bn'  # 'en' or 'bn'
```

### Adjust Risk Thresholds
Edit `demo/config.py`:
```python
RISK_THRESHOLDS = {
    "pass": 0.30,    # Change these values
    "warn": 0.70,
    "block": 0.70
}
```

### Change Theme Colors
Edit `demo/config.py`:
```python
THEME = {
    "primary": "#00D9FF",      # Your color
    "success": "#00FF88",      # Your color
    "warning": "#FFD700",      # Your color
    "danger": "#FF4444",       # Your color
    ...
}
```

---

## 🐛 Troubleshooting

### "Module not found" error
```bash
pip install -r requirements.txt
```

### Port 8501 already in use
```bash
streamlit run app.py --server.port=8502
```

### Model not loading
- Demo works WITHOUT the model (uses rule-based detection)
- To use ML model: Place `fraud_pipeline_final.pkl` in `Models/` folder

### Streamlit version issues
```bash
pip install --upgrade streamlit
```

---

## 📚 Next Steps

1. ✅ Run the demo
2. 📖 Read [README.md](README.md) for full features
3. 🚀 Check [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment
4. 🎭 Review [SHOWCASE.md](SHOWCASE.md) for presentation tips

---

## 💡 Pro Tips

- Use **"Random User"** button for quick testing
- Toggle **Language** to impress bilingual audience
- Show **Developer View** to technical stakeholders
- Watch the **Money Saved** counter increase when fraud is blocked!

---

## 🆘 Need Help?

- **GitHub Issues:** [Your Repo URL]
- **Email:** @rahathasan452
- **Documentation:** See other .md files in this folder

---

**Built by Team Clover Crew 🍀**

*From demo to production in days, not months.*

