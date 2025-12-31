# Deploying CloverShield ML API to Hugging Face Spaces

This guide outlines the steps to migrate the backend ML API from Render to Hugging Face Spaces using the Docker SDK.

## Prerequisites

- A [Hugging Face account](https://huggingface.co/join).
- The `ml-api` folder ready with the updated `Dockerfile` and `README.md`.

## Step 1: Create a New Space

1. Log in to your Hugging Face account.
2. Click on your profile picture in the top right and select **"New Space"**.
3. Fill in the details:
   - **Space Name:** `clovershield-ml-api` (or similar).
   - **License:** MIT or Apache 2.0 (matches your project).
   - **Space SDK:** Select **Docker**.
   - **Space Hardware:** **CPU Basic (Free)** is usually sufficient for this model size (2MB). If performance is slow, you can upgrade later.
   - **Visibility:** **Public** or **Private** (Private is safer for internal testing, but you might need a token to access it from the frontend). For the hackathon demo, **Public** is easiest but be careful with keys. **Private** is recommended if you can handle authentication headers in your frontend.

4. Click **"Create Space"**.

## Step 2: Upload Files

You have two options to upload the code:

### Option A: Web Interface (Easiest)

1. Once the Space is created, you will see the instructions page. Click on the **"Files"** tab.
2. Click **"Add file"** > **"Upload files"**.
3. Drag and drop **ALL** files and folders from your local `ml-api` directory into the upload area.
   - **Important:** Ensure you include:
     - `Dockerfile`
     - `requirements.txt`
     - `main.py`
     - `inference.py`
     - `feature_engineering.py`
     - `entrypoint.sh`
     - `README.md`
     - `Models/fraud_pipeline_final.pkl` (The folder structure `Models/` must be preserved).
     - `dataset/test_dataset.csv` (If used).
4. In the "Commit changes" box, type "Initial commit" and click **"Commit changes to main"**.

### Option B: Git Command Line (Manual)

1. Clone the Space repository locally.
2. Copy files and push manually.

### Option C: Automatic Sync with GitHub (Recommended)

This method automatically updates your Space whenever you push code to GitHub.

1.  **Get a Hugging Face Access Token:**
    *   Go to [Hugging Face Settings > Access Tokens](https://huggingface.co/settings/tokens).
    *   Click "New token".
    *   Name it `GITHUB_ACTION` (or similar).
    *   **Permissions:** Select **"Write"** access.
    *   Copy the token (starts with `hf_...`).

2.  **Add Token to GitHub Secrets:**
    *   Go to your GitHub repository.
    *   Navigate to **Settings** > **Secrets and variables** > **Actions**.
    *   Click **"New repository secret"**.
    *   **Name:** `HF_TOKEN`
    *   **Value:** (Paste your Hugging Face token here).
    *   Click "Add secret".

3.  **Configure the Workflow:**
    *   Open the file `.github/workflows/deploy-ml-api.yml` in your project.
    *   Edit the `env` section to match your details:
        ```yaml
        HF_SPACE_USERNAME: "your-hf-username"
        HF_SPACE_NAME: "clovershield-ml-api"
        ```
    *   Commit and push this change to GitHub.

Now, whenever you push changes to the `ml-api` folder in GitHub, the Action will run and update your Hugging Face Space automatically.

## Step 3: Configure Environment Variables (Secrets)

Your API needs the `GROQ_API_KEY` to function if LLM explanations are enabled.

1. Go to the **"Settings"** tab of your Space.
2. Scroll down to the **"Variables and secrets"** section.
3. Click **"New secret"**.
   - **Name:** `GROQ_API_KEY`
   - **Value:** (Paste your Groq API key here)
4. (Optional) Add other variables if you changed defaults:
   - `MODEL_THRESHOLD`
   - `PAGERANK_LIMIT`

**Note:** Hugging Face automatically sets `PORT` to `7860`. Our updated `Dockerfile` and `entrypoint.sh` are configured to respect this.

## Step 4: Build and Verify

1. Go to the **"App"** tab.
2. You will see a "Building" status. Click "Logs" to watch the build process.
3. Once "Running", you should see the Swagger UI or the JSON response from the root endpoint in the preview window.
4. Your API URL will be: `https://<your-username>-clovershield-ml-api.hf.space`

## Step 5: Update Frontend Connection (Vercel)

Now that your backend is on HF Spaces, you need to update your Vercel deployment to point to the new URL.

1.  **Go to Vercel Dashboard:**
    *   Navigate to your project on [Vercel](https://vercel.com).
    *   Go to **Settings** > **Environment Variables**.

2.  **Update the Variable:**
    *   Find the existing `NEXT_PUBLIC_ML_API_URL` or create a new one.
    *   **Value:** `https://<your-username>-<your-space-name>.hf.space`
    *   *Important:* Do NOT include a trailing slash (/) at the end.

3.  **Redeploy:**
    *   Go to the **Deployments** tab.
    *   Click on the three dots (...) of your latest deployment and select **Redeploy**. This is necessary for Vercel to pick up the new environment variable value in the client-side code.

## Troubleshooting

- **Build Fails:** Check the "Logs". Common issues are missing dependencies in `requirements.txt` or file path errors.
- **"403 Forbidden":** If your Space is **Private**, you cannot access it directly from a public frontend without passing an authorization header (Bearer token). For this hackathon/demo, switch the Space Visibility to **Public** in Settings > General.
- **Model Load Error:** Ensure `Models/fraud_pipeline_final.pkl` was actually uploaded. Check the "Files" tab.

