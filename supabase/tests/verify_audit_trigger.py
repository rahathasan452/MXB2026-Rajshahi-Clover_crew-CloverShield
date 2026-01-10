import os
from supabase import create_client, Client
from dotenv import load_dotenv
import time
import uuid

# Load credentials from ml-api/.env
load_dotenv('ml-api/.env')

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in ml-api/.env")
    exit(1)

supabase: Client = create_client(url, key)

def verify_trigger():
    v_sender_id = f"test_s_{uuid.uuid4().hex[:6]}"
    v_receiver_id = f"test_r_{uuid.uuid4().hex[:6]}"
    
    print(f"Using test IDs: {v_sender_id}, {v_receiver_id}")
    
    tx_id = None
    
    try:
        # 1. Setup: Create test users
        supabase.table("users").upsert([
            {"user_id": v_sender_id, "name_en": "Test Sender Audit", "phone": f"T{uuid.uuid4().hex[:8]}", "provider": "bKash", "balance": 1000.00},
            {"user_id": v_receiver_id, "name_en": "Test Receiver Audit", "phone": f"R{uuid.uuid4().hex[:8]}", "provider": "bKash", "balance": 500.00}
        ]).execute()
        
        # 2. Setup: Create a test transaction
        res = supabase.table("transactions").insert({
            "sender_id": v_sender_id,
            "receiver_id": v_receiver_id,
            "amount": 100.00,
            "transaction_type": "TRANSFER",
            "old_balance_orig": 1000.00,
            "new_balance_orig": 900.00,
            "old_balance_dest": 500.00,
            "new_balance_dest": 600.00,
            "status": "PENDING"
        }).execute()
        
        tx_id = res.data[0]['transaction_id']
        print(f"Created test transaction: {tx_id}")
        
        # 3. Action: Update the transaction status
        supabase.table("transactions").update({"status": "COMPLETED"}).eq("transaction_id", tx_id).execute()
        print("Updated transaction status to COMPLETED")
        
        # Wait a moment for trigger
        time.sleep(2)
        
        # 4. Verification: Check audit_logs
        logs = supabase.table("audit_logs").select("*").eq("resource_id", str(tx_id)).eq("action_type", "CASE_STATUS_CHANGE").execute()
        
        if len(logs.data) > 0:
            print(f"PASS: Audit log verified successfully. Found {len(logs.data)} entry(ies).")
            print(f"Log Message: {logs.data[0]['human_readable_message']}")
        else:
            print("FAIL: No audit log found for transaction status change!")
            # We don't raise here yet if we want to see cleanup, but we should indicate failure
            exit_code = 1
        
        # Also verify Case Assignment trigger if possible
        print("Testing Case Assignment trigger...")
        supabase.table("transactions").update({"analyst_id": "test_analyst_123"}).eq("transaction_id", tx_id).execute()
        time.sleep(2)
        
        assign_logs = supabase.table("audit_logs").select("*").eq("resource_id", str(tx_id)).eq("action_type", "CASE_ASSIGNMENT").execute()
        if len(assign_logs.data) > 0:
            print(f"PASS: Assignment audit log verified successfully.")
            print(f"Log Message: {assign_logs.data[0]['human_readable_message']}")
        else:
            print("FAIL: No assignment audit log found!")
            
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        # 5. Cleanup
        print("Cleaning up...")
        if tx_id:
            supabase.table("audit_logs").delete().eq("resource_id", str(tx_id)).execute()
            supabase.table("transactions").delete().eq("transaction_id", tx_id).execute()
        supabase.table("users").delete().in_("user_id", [v_sender_id, v_receiver_id]).execute()
        print("Cleanup complete.")

if __name__ == "__main__":
    verify_trigger()
