import os
from supabase import create_client
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# --- ACTION REQUIRED: ENSURE .env FILE EXISTS ---
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

def register_model():
    if not SUPABASE_URL or not SUPABASE_KEY or "your_" in SUPABASE_URL:
        print("❌ Please create a .env file with your credentials (see .env.example)")
        return

    print(f"Connecting to Supabase: {SUPABASE_URL}")
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    model_data = {
        "name": "Production Model (Initial)",
        "version": "v1.0.0",
        "status": "ready",
        "metrics": {
            "accuracy": 0.998,
            "precision": 0.908,
            "recall": 1.00,
            "f1": 0.952,
            "specificity": 0.998
        },
        "file_path": "Models/fraud_pipeline_final.pkl",
        "is_active": True
    }

    try:
        data = supabase.table("model_registry").insert(model_data).execute()
        print("✅ Successfully registered existing model!")
        print(f"ID: {data.data[0]['id']}")
    except Exception as e:
        print(f"❌ Failed to register model: {e}")

if __name__ == "__main__":
    register_model()
