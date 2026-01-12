import os
from supabase import create_client, Client
from dotenv import load_dotenv
import time
import uuid

# Load credentials
load_dotenv('ml-api/.env')
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in ml-api/.env")
    exit(1)

supabase: Client = create_client(url, key)

def test_cases_table():
    print("Testing cases table...")
    
    case_id = None
    
    try:
        # 1. Action: Insert a new case
        # Note: target_id would typically valid user/transaction ID, 
        # but for schema verification we assume foreign keys exist or we generate a dummy one if strictly enforced.
        # Here we just try to insert to see if table exists and schema is correct.
        
        # We might need a valid user_id if FK is strict. Let's try to fetch one first or create dummy.
        # For simplicity in this test, we assume we might fail on FK if table exists, 
        # but right now we expect failure because TABLE DOES NOT EXIST.
        
        test_case = {
            "target_id": "test_target_" + uuid.uuid4().hex[:6], # Likely to fail FK if table existed
            "status": "Open",
            "priority": "High",
            "analyst_id": "test_analyst",
        }
        
        print(f"Attempting to insert case: {test_case}")

        res = supabase.table("cases").insert(test_case).execute()
        
        case_id = res.data[0]['case_id']
        print(f"Created case: {case_id}")
        
        # 2. Verification: Read it back
        fetch_res = supabase.table("cases").select("*").eq("case_id", case_id).execute()
        
        if len(fetch_res.data) == 1:
             print("PASS: Successfully inserted and retrieved from cases table.")
        else:
             print("FAIL: Could not retrieve inserted case.")
             exit(1)

    except Exception as e:
        print(f"FAIL: An error occurred (Expected if table is missing): {e}")
        # We exit 1 to indicate failure of the TEST (even if failure is expected for TDD "Red" phase)
        # However, for the agent workflow, I need to confirm it fails.
        exit(1)
    finally:
        if case_id:
            try:
                supabase.table("cases").delete().eq("case_id", case_id).execute()
                print("Cleanup complete.")
            except:
                pass

if __name__ == "__main__":
    test_cases_table()
