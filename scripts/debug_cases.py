import os
import uuid
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv('ml-api/.env')
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

def debug_schema():
    print("--- Debugging Cases Schema ---")
    try:
        # Try to select * to see structure
        res = supabase.table("cases").select("*").limit(1).execute()
        if res.data and len(res.data) > 0:
            print("Found row:", res.data[0].keys())
        else:
            print("Table exists but is empty. Cannot inspect columns via select.")
            
            # Try to insert a dummy with minimal fields to see what fails
            # Assumes case_id is PK
            try:
                supabase.table("cases").insert({"case_id": str(uuid.uuid4())}).execute()
            except Exception as e:
                print(f"Insert empty failed: {e}")

    except Exception as e:
        print(f"Select * failed: {e}")

if __name__ == "__main__":
    debug_schema()