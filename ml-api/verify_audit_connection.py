import os
import uuid
import sys
import logging
from dotenv import load_dotenv
from supabase import create_client, Client

# Add ml-api to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from utils.audit import AuditLogger

# Configure logging to see AuditLogger internal errors
logging.basicConfig(level=logging.INFO)

# Load credentials
load_dotenv('ml-api/.env')
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("ERROR: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing from ml-api/.env")
    exit(1)

print(f"Connecting to: {url}")

try:
    supabase: Client = create_client(url, key)
    logger = AuditLogger(supabase)
    
    tx_id = str(uuid.uuid4())
    print(f"Attempting to log test prediction for ID: {tx_id}...")
    
    # This calls the log_activity RPC
    # We'll use a direct try-except here to see the EXACT error if it fails
    try:
        res = supabase.rpc("log_activity", {
            "p_action_type": "ML_PREDICTION",
            "p_message": f"CONNECTION VERIFY: 0.99",
            "p_resource_type": "transaction",
            "p_resource_id": str(tx_id),
            "p_metadata": {"test": "connection_verify"}
        }).execute()
        print("RPC call executed successfully.")
    except Exception as rpc_err:
        print(f"RPC ERROR: {str(rpc_err)}")
        raise rpc_err
    
    print("Checking if it exists in DB...")
    
    # Verification query
    res = supabase.table("audit_logs").select("*").eq("resource_id", tx_id).execute()
    
    if len(res.data) > 0:
        print(f"SUCCESS! Found log in Supabase: {res.data[0]['human_readable_message']}")
    else:
        print("FAIL: Call finished but no record found in audit_logs table.")

except Exception as e:
    print(f"CRITICAL ERROR during verification: {str(e)}")