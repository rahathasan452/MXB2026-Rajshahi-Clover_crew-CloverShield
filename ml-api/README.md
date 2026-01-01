---
title: CloverShield ML API
emoji: 🛡️
colorFrom: green
colorTo: blue
sdk: docker
app_port: 7860
pinned: false
---

# CloverShield ML Inference API

The Sovereign AI engine for the CloverShield Fraud Analyst Workstation.

## 🚀 Overview

This is a **FastAPI** microservice containerized with **Docker**. It provides:
- Real-time fraud probability scoring (XGBoost)
- Feature Engineering pipeline (Graph + Temporal features)
- Explainable AI (SHAP values)
- LLM-based narrative generation

## 🛠️ Deployment

This service is designed for:
1.  **On-Premise:** Via `docker-compose` (see root README)
2.  **Hugging Face Spaces:** Auto-detected via the YAML metadata above.

## 🔧 Configuration

Key environment variables:
- `MODEL_PATH`: Path to the `.pkl` model file.
- `GROQ_API_KEY`: (Optional) For generating text explanations.
- `MAX_FIT_ROWS`: Limits memory usage during feature engineering.

*Note: This README serves as the configuration entry point for Hugging Face Spaces.*
