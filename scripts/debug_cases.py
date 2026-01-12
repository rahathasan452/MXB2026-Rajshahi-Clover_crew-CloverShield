import os
import uuid
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv('ml-api/.env')
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    exit(1)

supabase: Client = create_client(url, key)

def debug_cases_workflow():
    print("--- Debugging Cases Workflow ---")
    try:
        # 1. Get a real transaction from history
        print("1. Fetching a candidate transaction from transaction_history...")
        tx_res = supabase.table("transaction_history").select("*").limit(1).execute()
        
        if not tx_res.data:
            print("   No transactions found in history.")
            return
            
        tx = tx_res.data[0]
        print(f"   Found transaction: {tx['transaction_id']}")
        print(f"   Sender: {tx['sender_id']}")
        
        # 2. Check if user exists (for FK validation)
        user_res = supabase.table("users").select("user_id").eq("user_id", tx['sender_id']).execute()
        user_exists = len(user_res.data) > 0
        print(f"   User exists in 'users' table: {user_exists}")
        
        # 3. Try to create/fetch a case
        case_payload = {
            "transaction_id": tx['transaction_id'],
            "user_id": tx['sender_id'],
            "status": "Open",
            "priority": "High"
        }
        print(f"2. Attempting to insert case for transaction {tx['transaction_id']}...")
        
        try:
            res = supabase.table("cases").insert(case_payload).execute()
            print("   Success! New case created.")
            print(f"   Case ID: {res.data[0]['case_id']}")
        except Exception as insert_err:
            msg = str(insert_err)
            if "23505" in msg or "duplicate key" in msg:
                print("   Insert failed with Duplicate Key (Expected if case exists).")
                print("   Verifying existing case retrieval...")
                
                existing_res = supabase.table("cases").select("*").eq("transaction_id", tx['transaction_id']).execute()
                if existing_res.data:
                    print(f"   Success! Found existing case: {existing_res.data[0]['case_id']}")
                else:
                    print("   CRITICAL: Insert failed as duplicate, but could not fetch existing case!")
            else:
                print(f"   Insert failed with unexpected error: {msg}")

    except Exception as e:
        print(f"General error: {e}")

if __name__ == "__main__":
    debug_cases_workflow()
