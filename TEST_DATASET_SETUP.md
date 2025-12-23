# Test Dataset Setup Guide

This guide explains how to set up and use the test dataset feature for transaction simulation.

## Overview

The test dataset feature allows you to:
1. Store test transaction data from `assets/test_dataset.csv` in Supabase
2. Select senders and receivers from the test dataset
3. Auto-fill transaction features from previous transactions
4. Run ML inference on test transactions
5. Save results to a separate `transaction_history` table

## Setup Steps

### 1. Create Database Tables

Run the Supabase migration to create the required tables:

```sql
-- Run this in Supabase SQL Editor
-- File: supabase/migrations/005_test_dataset.sql
```

This creates two tables:
- `test_dataset`: Stores the CSV test data
- `transaction_history`: Stores transaction results from test dataset simulations

### 2. Import CSV Data

Use the Python script to import the CSV data:

```bash
# Install required dependencies
pip install psycopg2-binary python-dotenv

# Set environment variables
export SUPABASE_DB_URL="postgresql://postgres:[password]@[host]:[port]/postgres"
export TEST_DATASET_CSV_PATH="assets/test_dataset.csv"

# Run the import script
cd supabase/scripts
python import_test_dataset.py
```

Or set up a `.env` file in the project root:

```env
SUPABASE_DB_URL=postgresql://postgres:[password]@[host]:[port]/postgres
TEST_DATASET_CSV_PATH=assets/test_dataset.csv
```

The script will:
- Read the CSV file
- Import all rows into the `test_dataset` table
- Show statistics about the imported data

### 3. Configure Frontend Environment

Ensure your `.env.local` file includes:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Required for API routes
```

**Important**: The `SUPABASE_SERVICE_ROLE_KEY` is required for the API routes to access the test dataset table.

## Usage

### Using Test Data Mode in the UI

1. **Enable Test Data Mode**: Toggle the "Test Data" switch at the top of the Transaction Form
2. **Select Sender**: Choose a sender from the dropdown (populated from test dataset)
3. **Select Receiver**: After selecting a sender, the receiver dropdown will show only valid receivers for that sender
4. **Auto-Fill**: When both sender and receiver are selected, the form automatically fills:
   - Transaction amount
   - Transaction type
   - Old/New balances for both sender and receiver
   - Step value
5. **Submit**: Click "Analyze Transaction" to send to ML inference API
6. **Save**: Results are automatically saved to `transaction_history` table

### API Endpoints

The following API endpoints are available:

#### GET `/api/test-dataset/senders`
Fetch distinct senders from test dataset.

**Query Parameters:**
- `limit` (optional): Number of senders to return (default: 50)
- `offset` (optional): Offset for pagination (default: 0)

**Response:**
```json
{
  "senders": ["C1127637726", "C1559348659", ...],
  "total": 100,
  "limit": 50,
  "offset": 0
}
```

#### GET `/api/test-dataset/receivers?senderId=...`
Fetch distinct receivers for a specific sender.

**Query Parameters:**
- `senderId` (required): The sender ID (nameOrig)
- `limit` (optional): Number of receivers to return (default: 50)
- `offset` (optional): Offset for pagination (default: 0)

**Response:**
```json
{
  "receivers": ["C1469310946", "C973542143", ...],
  "senderId": "C1127637726",
  "total": 25,
  "limit": 50,
  "offset": 0
}
```

#### GET `/api/test-dataset/transaction-details?senderId=...&receiverId=...`
Fetch the most recent transaction details between sender and receiver.

**Query Parameters:**
- `senderId` (required): The sender ID
- `receiverId` (required): The receiver ID

**Response:**
```json
{
  "transaction": {
    "step": 472,
    "type": "CASH_OUT",
    "amount": 55756.5,
    "nameOrig": "C1127637726",
    "oldBalanceOrig": 11245.0,
    "newBalanceOrig": 0.0,
    "nameDest": "C1469310946",
    "oldBalanceDest": 297290.3,
    "newBalanceDest": 353046.8,
    "isFlaggedFraud": 0
  }
}
```

## Database Schema

### test_dataset Table

```sql
CREATE TABLE test_dataset (
    id SERIAL PRIMARY KEY,
    step INTEGER NOT NULL,
    type VARCHAR(20) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    nameOrig VARCHAR(50) NOT NULL,  -- Sender
    oldBalanceOrig DECIMAL(15, 2) NOT NULL,
    newBalanceOrig DECIMAL(15, 2) NOT NULL,
    nameDest VARCHAR(50) NOT NULL,  -- Receiver
    oldBalanceDest DECIMAL(15, 2) NOT NULL,
    newBalanceDest DECIMAL(15, 2) NOT NULL,
    isFlaggedFraud INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### transaction_history Table

```sql
CREATE TABLE transaction_history (
    transaction_id UUID PRIMARY KEY,
    sender_id VARCHAR(50) NOT NULL,
    receiver_id VARCHAR(50) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    transaction_type VARCHAR(20) NOT NULL,
    old_balance_orig DECIMAL(15, 2) NOT NULL,
    new_balance_orig DECIMAL(15, 2) NOT NULL,
    old_balance_dest DECIMAL(15, 2) NOT NULL,
    new_balance_dest DECIMAL(15, 2) NOT NULL,
    step INTEGER,
    hour INTEGER,
    transaction_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fraud_probability DECIMAL(5, 4),
    fraud_decision VARCHAR(10),
    risk_level VARCHAR(20),
    model_confidence DECIMAL(5, 4),
    status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
    is_test_data BOOLEAN NOT NULL DEFAULT TRUE,
    test_dataset_id INTEGER REFERENCES test_dataset(id),
    note TEXT
);
```

## Workflow

1. **User enables Test Data Mode** → Form switches to test dataset mode
2. **User selects sender** → API fetches distinct senders from `test_dataset`
3. **User selects receiver** → API fetches receivers for that sender
4. **Auto-fill triggered** → API fetches most recent transaction between sender/receiver
5. **Form auto-fills** → Amount, type, and balances are populated
6. **User submits** → Transaction sent to ML inference API
7. **Result saved** → Transaction saved to `transaction_history` table with ML prediction results

## Differences from Regular Mode

| Feature | Regular Mode | Test Data Mode |
|---------|-------------|----------------|
| Sender Source | `users` table | `test_dataset` table (nameOrig) |
| Receiver Source | `users` table | `test_dataset` table (nameDest) |
| Balance Calculation | From user balance | From test dataset transaction |
| Transaction Storage | `transactions` table | `transaction_history` table |
| Auto-fill | Manual entry | Automatic from test dataset |
| Email Alerts | Enabled | Disabled |

## Troubleshooting

### API Routes Return 500 Error
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local`
- Check that the migration has been run successfully
- Verify the test_dataset table exists and has data

### No Senders/Receivers Appearing
- Run the import script to populate the test_dataset table
- Check browser console for API errors
- Verify Supabase connection settings

### Auto-fill Not Working
- Ensure both sender and receiver are selected
- Check that a transaction exists between the selected pair
- Verify API endpoint is accessible

### Transaction Not Saving
- Check browser console for errors
- Verify `transaction_history` table exists
- Ensure RLS policies allow inserts (if enabled)

## Security Notes

- The API routes use `SUPABASE_SERVICE_ROLE_KEY` for admin access
- These routes should be protected in production (add authentication)
- Test dataset data is read-only in the UI
- Only transaction results are written to `transaction_history`

## Next Steps

- Add pagination for large datasets
- Add search/filter functionality for senders/receivers
- Implement bulk transaction processing
- Add analytics dashboard for test dataset results

