# CloverShield: B2B Fraud Detection Dashboard Deployment Guide

This document provides technical instructions for MFS (bKash/Nagad) IT teams to deploy and customize the CloverShield "Black Box" solution.

## Architecture Overview
CloverShield is containerized using Docker Compose, consisting of:
1. **ML API (Backend):** FastAPI service serving XGBoost predictions with SHAP and LLM (Llama 3) explanations.
2. **Dashboard (Frontend):** Next.js application providing a real-time HUD (Heads-Up Display) for fraud analysts.

## Prerequisites
- Docker & Docker Compose installed.
- Minimum 4GB RAM (8GB recommended for ML model inference).

## Quick Start
1. Clone the repository to your production server.
2. Run the deployment command:
   ```bash
   docker compose up -d --build
   ```
3. Access the dashboard at `http://localhost:3000`.
4. The ML API is available at `http://localhost:8000`.

## Customization

### 1. Swapping the ML Model
To use your own trained model:
- Replace the file at `ml-api/Models/fraud_pipeline_final.pkl` with your serialized model.
- Supported format: `.pkl` (Joblib or Pickle) containing an XGBoost pipeline or classifier.
- Restart the container: `docker compose restart ml-api`.

### 2. Updating the Simulation Dataset
To update the "Live Stream" demo data:
- Replace the file at `ml-api/dataset/test_dataset.csv.gz` with your historical transaction data.
- Required columns: `step`, `type`, `amount`, `nameOrig`, `oldBalanceOrig`, `newBalanceOrig`, `nameDest`, `oldBalanceDest`, `newBalanceDest`.
- The system will automatically sort by `step` and stream it row-by-row.

### 3. Environment Variables
Configure the system via the `docker-compose.yml` environment section or a `.env` file:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | API internal port | 8000 |
| `MODEL_THRESHOLD` | Fraud decision sensitivity | 0.0793 |
| `GROQ_API_KEY` | For LLM Explanations | (Optional) |
| `NEXT_PUBLIC_ML_API_URL` | Frontend -> API link | http://localhost:8000 |

## Branding (bKash vs Nagad)
The dashboard features a built-in "Brand Toggle" in the header. To set a default brand:
1. Open `frontend/store/useAppStore.ts`.
2. Modify `initialState.brandTheme` to `'bkash'` or `'nagad'`.

## Monitoring
- **Logs:** `docker compose logs -f`
- **Health Check:** `curl http://localhost:8000/health`
- **Interactive Docs:** `http://localhost:8000/docs` (Swagger)

---
Built by Team Clover Crew for MXB2026 Rajshahi.
Contact: admin@clovershield.ai
