"""
Import test_dataset.csv into Supabase test_dataset table
Run this script after creating the test_dataset table via migration
"""

import os
import sys
import csv
import psycopg2
from psycopg2.extras import execute_batch
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
load_dotenv()

# Get Supabase connection details from environment
SUPABASE_DB_URL = os.getenv('SUPABASE_DB_URL') or os.getenv('DATABASE_URL')
CSV_FILE_PATH = os.getenv('TEST_DATASET_CSV_PATH', 'assets/test_dataset.csv')

if not SUPABASE_DB_URL:
    print("❌ Error: SUPABASE_DB_URL or DATABASE_URL environment variable not set")
    print("Please set it to your Supabase database connection string")
    print("Format: postgresql://postgres:[password]@[host]:[port]/postgres")
    sys.exit(1)

# Resolve CSV file path
script_dir = Path(__file__).parent.parent.parent
csv_path = script_dir / CSV_FILE_PATH

if not csv_path.exists():
    print(f"❌ Error: CSV file not found at {csv_path}")
    print(f"Please ensure the file exists or set TEST_DATASET_CSV_PATH environment variable")
    sys.exit(1)

def import_csv_to_supabase():
    """Import CSV data into Supabase test_dataset table"""
    
    print(f"📂 Reading CSV file: {csv_path}")
    
    # Read CSV file
    # CSV columns must match exactly: step,type,amount,nameOrig,oldBalanceOrig,newBalanceOrig,nameDest,oldBalanceDest,newBalanceDest,isFlaggedFraud
    rows = []
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        # Validate CSV headers match expected columns
        expected_columns = ['step', 'type', 'amount', 'nameOrig', 'oldBalanceOrig', 
                          'newBalanceOrig', 'nameDest', 'oldBalanceDest', 'newBalanceDest', 'isFlaggedFraud']
        actual_columns = reader.fieldnames
        
        # Filter out empty column names (some CSV files have leading commas)
        actual_columns = [col for col in actual_columns if col.strip()] if actual_columns else []
        
        # Check if all expected columns are present
        missing_columns = set(expected_columns) - set(actual_columns)
        if missing_columns:
            print(f"❌ Error: CSV is missing required columns: {missing_columns}")
            print(f"   Expected: {expected_columns}")
            print(f"   Found: {actual_columns}")
            sys.exit(1)
        
        for row in reader:
            # Column names must match CSV exactly: nameOrig, oldBalanceOrig, newBalanceOrig, nameDest, oldBalanceDest, newBalanceDest, isFlaggedFraud
            rows.append({
                'step': int(row['step']),
                'type': row['type'],
                'amount': float(row['amount']),
                'nameOrig': row['nameOrig'],
                'oldBalanceOrig': float(row['oldBalanceOrig']),
                'newBalanceOrig': float(row['newBalanceOrig']),
                'nameDest': row['nameDest'],
                'oldBalanceDest': float(row['oldBalanceDest']),
                'newBalanceDest': float(row['newBalanceDest']),
                'isFlaggedFraud': int(row['isFlaggedFraud'])
            })
    
    print(f"✅ Read {len(rows)} rows from CSV")
    
    # Connect to Supabase
    print("🔌 Connecting to Supabase...")
    try:
        conn = psycopg2.connect(SUPABASE_DB_URL)
        cur = conn.cursor()
        print("✅ Connected to Supabase")
    except Exception as e:
        print(f"❌ Error connecting to Supabase: {e}")
        sys.exit(1)
    
    # Check if table exists
    cur.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'test_dataset'
        );
    """)
    
    if not cur.fetchone()[0]:
        print("❌ Error: test_dataset table does not exist")
        print("Please run the migration 005_test_dataset.sql first")
        conn.close()
        sys.exit(1)
    
    # Check if data already exists
    cur.execute("SELECT COUNT(*) FROM test_dataset")
    existing_count = cur.fetchone()[0]
    
    if existing_count > 0:
        response = input(f"⚠️  Table already contains {existing_count} rows. Clear and reimport? (y/N): ")
        if response.lower() == 'y':
            print("🗑️  Clearing existing data...")
            cur.execute("TRUNCATE TABLE test_dataset RESTART IDENTITY CASCADE")
            conn.commit()
            print("✅ Cleared existing data")
        else:
            print("❌ Import cancelled")
            conn.close()
            sys.exit(0)
    
    # Insert data in batches
    print(f"📤 Inserting {len(rows)} rows into test_dataset table...")
    
    # SQL column names must match CSV exactly: nameOrig, oldBalanceOrig, newBalanceOrig, nameDest, oldBalanceDest, newBalanceDest, isFlaggedFraud
    insert_query = """
        INSERT INTO test_dataset (
            step, type, amount, nameOrig, oldBalanceOrig, newBalanceOrig,
            nameDest, oldBalanceDest, newBalanceDest, isFlaggedFraud
        ) VALUES (
            %(step)s, %(type)s, %(amount)s, %(nameOrig)s, %(oldBalanceOrig)s, %(newBalanceOrig)s,
            %(nameDest)s, %(oldBalanceDest)s, %(newBalanceDest)s, %(isFlaggedFraud)s
        )
    """
    
    batch_size = 1000
    total_inserted = 0
    
    try:
        for i in range(0, len(rows), batch_size):
            batch = rows[i:i + batch_size]
            execute_batch(cur, insert_query, batch, page_size=batch_size)
            conn.commit()
            total_inserted += len(batch)
            print(f"  ✅ Inserted {total_inserted}/{len(rows)} rows...", end='\r')
        
        print(f"\n✅ Successfully imported {total_inserted} rows into test_dataset table")
        
        # Verify import
        cur.execute("SELECT COUNT(*) FROM test_dataset")
        count = cur.fetchone()[0]
        print(f"✅ Verification: Table now contains {count} rows")
        
        # Show sample statistics
        cur.execute("""
            SELECT 
                COUNT(DISTINCT nameOrig) as unique_senders,
                COUNT(DISTINCT nameDest) as unique_receivers,
                COUNT(*) as total_transactions,
                SUM(CASE WHEN isFlaggedFraud = 1 THEN 1 ELSE 0 END) as fraud_count
            FROM test_dataset
        """)
        
        stats = cur.fetchone()
        print(f"\n📊 Dataset Statistics:")
        print(f"   Unique Senders: {stats[0]}")
        print(f"   Unique Receivers: {stats[1]}")
        print(f"   Total Transactions: {stats[2]}")
        print(f"   Fraud Cases: {stats[3]}")
        
    except Exception as e:
        conn.rollback()
        print(f"\n❌ Error inserting data: {e}")
        sys.exit(1)
    finally:
        cur.close()
        conn.close()
        print("🔌 Disconnected from Supabase")

if __name__ == '__main__':
    import_csv_to_supabase()

