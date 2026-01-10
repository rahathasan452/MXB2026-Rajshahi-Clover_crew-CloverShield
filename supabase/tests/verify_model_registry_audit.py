import os
from supabase import create_client, Client
from dotenv import load_dotenv
import time
import uuid

# Load credentials
load_dotenv('ml-api/.env')
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

def test_model_registry_audit():
    model_name = f"Test Model {uuid.uuid4().hex[:6]}"
    print(f"Testing audit for model: {model_name}")
    
    model_id = None
    
    try:
        # 1. Action: Insert a new model
        res = supabase.table("model_registry").insert({
            "name": model_name,
            "version": "v1.0",
            "status": "training",
            "is_active": False
        }).execute()
        
        model_id = res.data[0]['id']
        print(f"Registered model: {model_id}")
        
        # 2. Action: Update status and activate
        supabase.table("model_registry").update({
            "status": "ready",
            "is_active": True
        }).eq("id", model_id).execute()
        print("Updated model to ready and active")
        
        time.sleep(2)
        
        # 3. Verification: Check audit_logs
        logs = supabase.table("audit_logs").select("*").eq("resource_id", str(model_id)).execute()
        
        if len(logs.data) > 0:
            print(f"PASS: Found {len(logs.data)} audit logs for model registry changes.")
            for log in logs.data:
                print(f" - {log['action_type']}: {log['human_readable_message']}")
        else:
            print("FAIL: No audit logs found for model registry changes!")
            exit(1)
            
    except Exception as e:
        print(f"An error occurred: {e}")
        exit(1)
    finally:
        if model_id:
            supabase.table("audit_logs").delete().eq("resource_id", str(model_id)).execute()
            supabase.table("model_registry").delete().eq("id", model_id).execute()
        print("Cleanup complete.")

if __name__ == "__main__":
    test_model_registry_audit()
