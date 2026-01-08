import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

# Initialize Supabase
url = os.environ.get("SUPABASE_URL")
# using Service Role Key to bypass RLS if needed, or simple ANON key if policy allows
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("Error: Supabase credentials not found in environment.")
    exit(1)

supabase = create_client(url, key)

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
    print("Successfully registered existing model:")
    print(data.data)
except Exception as e:
    print(f"Failed to register model: {e}")
