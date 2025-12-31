# Cloud Deployment Guide (Judge Ready)

This guide explains how to deploy the **CloverShield** system to the cloud for public access (e.g., for judges or demos).

## Architecture
*   **Frontend:** Vercel (Next.js)
*   **Backend:** Hugging Face Spaces (Docker/FastAPI)
*   **Database:** Supabase (PostgreSQL)

---

## 1. Backend Deployment (Hugging Face Spaces)

The backend (`ml-api`) runs the XGBoost model and Simulation Engine. We use **Hugging Face Spaces** with Docker because it provides free CPU/RAM for ML models.

### Steps:
1.  **Create a New Space:**
    *   Go to [Hugging Face Spaces](https://huggingface.co/spaces).
    *   Click **"Create new Space"**.
    *   **Name:** `clovershield-api` (or similar).
    *   **SDK:** Select **Docker**.
    *   **License:** Apache 2.0.
    *   **Visibility:** Public.

2.  **Upload Code:**
    *   Clone your new Space locally:
        ```bash
        git clone https://huggingface.co/spaces/YOUR_USERNAME/clovershield-api
        ```
    *   Copy the **contents** of the `ml-api` folder into this new directory.
        *   *Important:* The `Dockerfile`, `main.py`, `requirements.txt`, etc., must be at the root of the Space repo.
        *   Copy the `Models` folder and `dataset` folder as well.
    *   **Push to Hugging Face:**
        ```bash
        git add .
        git commit -m "Deploy ML API"
        git push
        ```

3.  **Configure Secrets (Settings -> Variables and secrets):**
    *   `GROQ_API_KEY`: Your Groq API key (for LLM explanations).
    *   `MODEL_THRESHOLD`: `0.0793` (Optional, default is set).

4.  **Get the URL:**
    *   Once built, your API will be available at: `https://YOUR_USERNAME-clovershield-api.hf.space`
    *   **Copy this URL.** You need it for the frontend.

---

## 2. Frontend Deployment (Vercel)

The frontend (`frontend`) is a Next.js app.

### Steps:
1.  **Push to GitHub:**
    *   Ensure your project is pushed to a GitHub repository.

2.  **Import to Vercel:**
    *   Go to [Vercel Dashboard](https://vercel.com/dashboard).
    *   Click **"Add New..."** -> **"Project"**.
    *   Import your GitHub repository.

3.  **Configure Build:**
    *   **Framework Preset:** Next.js.
    *   **Root Directory:** Click "Edit" and select `frontend`.

4.  **Environment Variables:**
    *   Add the following variables:
        *   `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL.
        *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon Key.
        *   `NEXT_PUBLIC_ML_API_URL`: **Paste the Hugging Face URL from Step 1.** (e.g., `https://username-space.hf.space`)
            *   *Note:* Do not add a trailing slash.

5.  **Deploy:**
    *   Click **"Deploy"**.
    *   Vercel will build and assign a public domain (e.g., `clovershield-frontend.vercel.app`).

---

## 3. Database (Supabase)

Your Supabase project should already be running. Ensure:
*   **RLS Policies:** Are set to allow public read/write (or authenticated access if you implemented Auth).
*   **Table Structure:** Matches the `supabase/migrations` schema.

---

## 4. Verification

1.  Open your **Vercel URL**.
2.  Check the "Live Network Topology" - it should be waiting for data.
3.  Click **"Start"** in the Simulation Control panel.
4.  If the graph updates and transactions appear, the **Frontend -> Backend** connection is working!

## Troubleshooting

*   **CORS Error:** If the graph doesn't load, check the Console (F12). If you see CORS errors, ensure `ml-api/main.py` allows all origins (`allow_origins=["*"]`).
*   **500 Error on Predict:** Check the Hugging Face Space "Logs" tab. It might be out of memory. If so, upgrade the Space hardware or use a smaller model.
