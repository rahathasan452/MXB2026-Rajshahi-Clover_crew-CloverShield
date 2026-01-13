# 🛡️ CloverShield: Sovereign AI Fraud Analyst Workstation

**The Digital Immune System for Bangladesh's Financial Ecosystem.**

CloverShield is a privacy-first, on-premise AI workstation designed specifically for Mobile Financial Services (MFS) providers in Bangladesh. It empowers human fraud analysts to detect, investigate, and adapt to sophisticated financial crimes without ever exposing sensitive customer data to the cloud.

---

## 🚀 Project Overview

**Team:** Clover Crew (Rajshahi)  
**Competition:** National AI Build-a-thon 2026 (MXB2026)  
**Goal:** Create a "Sovereign AI" solution that runs entirely on-premise (via Docker) to ensure data privacy ("Zero-Trust Deployment").

The system combines a high-performance **XGBoost** model for real-time risk scoring (<200ms) with **Explainable AI (SHAP + LLM)** to give human analysts clear reasons for every "Block" decision. It also features a **Network Graph** for visualizing money laundering rings and a **Policy Lab** for backtesting new fraud rules.

---

## 🏗️ Architecture & Tech Stack

The project follows a microservices architecture orchestrated by Docker Compose:

*   **Frontend (`/frontend`):** Next.js 14 application providing the analyst dashboard ("Mission Control"). Connects to ML API and Supabase.
    *   *Stack:* Next.js 14, TypeScript, Tailwind CSS, Zustand, Recharts, React-Force-Graph.
*   **ML API (`/ml-api`):** FastAPI service hosting the XGBoost model. Handles feature engineering, inference, SHAP, and LLM explanations.
    *   *Stack:* Python 3.9+, FastAPI, XGBoost, SHAP, NetworkX.
*   **Database:** Managed PostgreSQL via Supabase. Stores user profiles, transaction logs, and alert history.
    *   *Stack:* Supabase (PostgreSQL), Row Level Security (RLS).
*   **Deployment:** Fully containerized via Docker for air-gapped, on-premise capability.

---

## 🛠️ The Workstation Modules

1.  **Mission Control (Dashboard):** A localized "Security HUD" prioritizing high-risk transactions. Full bilingual (English/Bangla) support.
2.  **Fraud Scanner (Explainable AI):** Real-time risk scoring (<200ms) with SHAP visualizations and LLM narratives explaining *why* a transaction was blocked.
3.  **Customer 360 (Network Graph):** Interactive visualization of money flow to spot "Mule Networks" and "Star Schemes."
4.  **Policy Lab (Rule Sandbox):** A safe environment for backtesting new fraud rules on historical data before deployment.
5.  **Analyst Copilot (Chatbot):** An LLM-powered assistant to query system status, explain fraud patterns, and draft reports.
6.  **Advanced Case Management:** Comprehensive investigative tools with checklists, status tracking, and automated SAR (Suspicious Activity Report) generation.
7.  **Audit Trail & Governance:** Immutable logging of every analyst action and model prediction for regulatory compliance.
8.  **Model Health Monitor:** Real-time dashboards tracking concept drift, prediction accuracy, and system latency to ensure AI reliability.
9.  **Secure QR Data Bridge:** An air-gapped data transfer mechanism allowing analysts to securely import external evidence via QR codes without internet connectivity.

---

## 🚀 Setup & Installation Instructions

### Prerequisites
*   **Docker Desktop** installed and running.
*   **Git** installed.
*   (Optional for manual dev) Node.js 18+ and Python 3.9+.

### Option 1: Quick Start (Docker - Recommended)

This will spin up the entire system (Frontend + API) in containers, simulating an on-premise deployment.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/rahathasan452/MXB2026-Rajshahi-Clover_crew-CloverShield.git
    cd MXB2026-Rajshahi-Clover_crew-CloverShield
    ```

2.  **Environment Setup:**
    *   Navigate to `frontend/` and copy the template:
        ```bash
        cp frontend/env.template frontend/.env.local
        ```
    *   Navigate to `ml-api/` and copy the template:
        ```bash
        cp ml-api/env.template ml-api/.env
        ```
    *   *Note:* The default templates are pre-configured for local Docker communication. You only need to add your `GROQ_API_KEY` in `ml-api/.env` if you want LLM explanations and Chatbot features.

3.  **Launch the Workstation:**
    From the root directory, run:
    ```bash
    docker-compose up -d --build
    ```

4.  **Access the System:**
    *   **Analyst Dashboard:** Open `http://localhost:3000`
    *   **ML API Docs:** Open `http://localhost:8000/docs`

---

### Option 2: Manual Development Setup

If you need to edit code without rebuilding containers:

**1. ML API Setup:**
```bash
cd ml-api
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**2. Frontend Setup:**
```bash
cd frontend
npm install
npm run dev
```
*Access Frontend at `http://localhost:3000`*

---

## 📂 Project Structure

```
.
├── 01_Project_Overview.md       # Vision & Problem Statement
├── 02_Solution_Description.md   # Core Features & Workflow
├── 03_AI_System_Architecture.md # System Design & Data Flow
├── 04_Prompts_and_AI_Process.md # AI Reasoning & Development
├── 05_Product_Roadmap.md        # Future Plans & Scaling
├── docker-compose.yml           # Orchestration Config
├── frontend/                    # Next.js Dashboard Source
├── ml-api/                      # Python Inference Engine
├── notebook/                    # Model Training Pipeline (Jupyter)
└── supabase/                    # Database Migrations
```

---

## 🧪 Training & Retraining

The project includes a **Training Kit** and a **Model Registry** for full lifecycle management.

*   **Training Notebook:** The `notebook/frd-dtct_model_train.ipynb` demonstrates the entire pipeline—loading data, feature engineering (Graph + Temporal), training XGBoost, and saving the model.
*   **Model Registry (UI):** Analysts can upload new datasets via the dashboard to trigger background training jobs. The system versions, tracks, and allows hot-swapping of models without downtime.
*   **Sovereign Retraining:** In a real deployment, bank data scientists would run the training notebook or use the registry on their internal secure servers using private data.

---

**Team:** Clover Crew | **Location:** Rajshahi | **Competition:** National AI Build-a-thon 2026 (MXB2026)
