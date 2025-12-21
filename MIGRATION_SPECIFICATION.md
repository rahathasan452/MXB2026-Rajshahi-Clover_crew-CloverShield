# CloverShield Migration Specification Document

**Version:** 1.0  
**Date:** 2024  
**Purpose:** Complete feature and data requirement mapping for migration from Streamlit to Supabase + Plasmic/React + Vercel stack

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Database Schema (Supabase PostgreSQL)](#database-schema-supabase-postgresql)
3. [API Endpoints (ML Service Contract)](#api-endpoints-ml-service-contract)
4. [Frontend Component Map (Plasmic/React)](#frontend-component-map-plasmicreact)
5. [Data Flow Architecture](#data-flow-architecture)
6. [Feature Mapping Matrix](#feature-mapping-matrix)

---

## Executive Summary

This document provides a complete specification for migrating the CloverShield fraud detection platform from a monolithic Streamlit application to a modern decoupled architecture:

- **Backend Database:** Supabase (PostgreSQL)
- **Frontend:** Plasmic/React (deployed on Vercel)
- **ML Service:** Decoupled Python service (FastAPI/Flask)

### Current Architecture
- **Monolithic Streamlit App** (`demo/app.py`)
- **Mock Data** (`demo/mock_data.py`)
- **ML Inference** (`demo/inference.py`)
- **Feature Engineering** (`demo/feature_engineering.py`)

### Target Architecture
- **Database:** Supabase PostgreSQL (replaces `mock_data.py`)
- **Frontend:** React components (replaces Streamlit UI)
- **ML API:** RESTful service (replaces direct `inference.py` calls)

---

## Database Schema (Supabase PostgreSQL)

### 1. Users Table

**Purpose:** Store user account information (replaces `MOCK_USERS` in `mock_data.py`)

```sql
CREATE TABLE users (
    -- Primary Key
    user_id VARCHAR(20) PRIMARY KEY,
    
    -- Identity Information
    name_en VARCHAR(100) NOT NULL,
    name_bn VARCHAR(100),
    phone VARCHAR(20) NOT NULL UNIQUE,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('bKash', 'Nagad', 'Rocket', 'Upay')),
    
    -- Account Status
    balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
    account_age_days INTEGER NOT NULL DEFAULT 0 CHECK (account_age_days >= 0),
    
    -- Transaction Statistics
    total_transactions INTEGER NOT NULL DEFAULT 0 CHECK (total_transactions >= 0),
    avg_transaction_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00 CHECK (avg_transaction_amount >= 0),
    
    -- Verification Status
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    kyc_complete BOOLEAN NOT NULL DEFAULT FALSE,
    risk_level VARCHAR(20) NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'suspicious')),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_transaction_at TIMESTAMP WITH TIME ZONE,
    
    -- Indexes
    INDEX idx_users_provider (provider),
    INDEX idx_users_risk_level (risk_level),
    INDEX idx_users_verified (verified),
    INDEX idx_users_phone (phone)
);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

**Field Mapping from `mock_data.py`:**
- `user_id` → `user_id` (VARCHAR)
- `name_en` → `name_en` (VARCHAR)
- `name_bn` → `name_bn` (VARCHAR)
- `phone` → `phone` (VARCHAR)
- `provider` → `provider` (VARCHAR, ENUM)
- `balance` → `balance` (DECIMAL)
- `account_age_days` → `account_age_days` (INTEGER)
- `total_transactions` → `total_transactions` (INTEGER)
- `avg_transaction_amount` → `avg_transaction_amount` (DECIMAL)
- `verified` → `verified` (BOOLEAN)
- `kyc_complete` → `kyc_complete` (BOOLEAN)
- `risk_level` → `risk_level` (VARCHAR, ENUM)

---

### 2. Transactions Table

**Purpose:** Store transaction history and real-time transactions (replaces transaction history in `mock_data.py`)

```sql
CREATE TABLE transactions (
    -- Primary Key
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Transaction Details
    sender_id VARCHAR(20) NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    receiver_id VARCHAR(20) NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('CASH_OUT', 'TRANSFER', 'CASH_IN', 'PAYMENT', 'DEBIT')),
    
    -- Balance States (snapshot at transaction time)
    old_balance_orig DECIMAL(15, 2) NOT NULL CHECK (old_balance_orig >= 0),
    new_balance_orig DECIMAL(15, 2) NOT NULL CHECK (new_balance_orig >= 0),
    old_balance_dest DECIMAL(15, 2) NOT NULL CHECK (old_balance_dest >= 0),
    new_balance_dest DECIMAL(15, 2) NOT NULL CHECK (new_balance_dest >= 0),
    
    -- Time Information
    step INTEGER,  -- Time step for ML model
    hour INTEGER CHECK (hour >= 0 AND hour < 24),
    transaction_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- ML Model Results
    fraud_probability DECIMAL(5, 4) CHECK (fraud_probability >= 0 AND fraud_probability <= 1),
    fraud_decision VARCHAR(10) CHECK (fraud_decision IN ('pass', 'warn', 'block')),
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high')),
    model_confidence DECIMAL(5, 4) CHECK (model_confidence >= 0 AND model_confidence <= 1),
    
    -- Transaction Status
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'BLOCKED', 'REVIEW', 'FAILED')),
    
    -- Optional Metadata
    note TEXT,
    analyst_id VARCHAR(50),  -- ID of analyst who reviewed (if applicable)
    reviewed_at TIMESTAMP WITH TIME ZONE,
    
    -- Indexes
    INDEX idx_transactions_sender (sender_id),
    INDEX idx_transactions_receiver (receiver_id),
    INDEX idx_transactions_timestamp (transaction_timestamp),
    INDEX idx_transactions_type (transaction_type),
    INDEX idx_transactions_status (status),
    INDEX idx_transactions_fraud_decision (fraud_decision),
    INDEX idx_transactions_fraud_probability (fraud_probability)
);

-- Composite index for user transaction history queries
CREATE INDEX idx_transactions_user_history ON transactions(sender_id, transaction_timestamp DESC);
```

**Field Mapping from `create_transaction_dataframe()`:**
- `step` → `step` (INTEGER)
- `type` → `transaction_type` (VARCHAR, ENUM)
- `amount` → `amount` (DECIMAL)
- `nameOrig` → `sender_id` (VARCHAR, FK to users)
- `oldBalanceOrig` → `old_balance_orig` (DECIMAL)
- `newBalanceOrig` → `new_balance_orig` (DECIMAL)
- `nameDest` → `receiver_id` (VARCHAR, FK to users)
- `oldBalanceDest` → `old_balance_dest` (DECIMAL)
- `newBalanceDest` → `new_balance_dest` (DECIMAL)
- `isFlaggedFraud` → `fraud_decision` (VARCHAR, derived from ML output)

---

### 3. Transaction Features Table (ML Feature Cache)

**Purpose:** Store engineered features for ML model (optional, for caching and analysis)

```sql
CREATE TABLE transaction_features (
    transaction_id UUID PRIMARY KEY REFERENCES transactions(transaction_id) ON DELETE CASCADE,
    
    -- Engineered Features (from feature_engineering.py)
    amount_log1p DECIMAL(15, 6),
    amount_over_old_balance_orig DECIMAL(15, 6),
    type_encoded INTEGER,
    hour INTEGER,
    orig_txn_count INTEGER,
    dest_txn_count INTEGER,
    amt_ratio_to_user_mean DECIMAL(15, 6),
    amt_ratio_to_user_median DECIMAL(15, 6),
    amt_log_ratio_to_user_median DECIMAL(15, 6),
    in_degree INTEGER,
    out_degree INTEGER,
    network_trust DECIMAL(5, 4),
    is_new_origin BOOLEAN,
    is_new_dest BOOLEAN,
    
    -- Metadata
    features_computed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Feature List (22 features from `feature_engineering.py`):**
1. `step` - Time step
2. `amount` - Transaction amount
3. `oldBalanceOrig` - Sender balance before
4. `newBalanceOrig` - Sender balance after
5. `oldBalanceDest` - Receiver balance before
6. `newBalanceDest` - Receiver balance after
7. `hour` - Transaction hour (0-23)
8. `orig_txn_count` - Sender transaction frequency
9. `dest_txn_count` - Receiver transaction frequency
10. `amt_ratio_to_user_mean` - Amount vs user average
11. `amount_log1p` - Log-transformed amount
12. `amount_over_oldBalanceOrig` - Amount as % of balance
13. `amt_ratio_to_user_median` - Amount vs user median
14. `amt_log_ratio_to_user_median` - Log ratio to median
15. `in_degree` - Receiver network connections
16. `out_degree` - Sender network connections
17. `network_trust` - Network trust score
18. `is_new_origin` - New sender account flag
19. `is_new_dest` - New receiver account flag
20. `type_encoded` - Transaction type (encoded)

---

### 4. SHAP Explanations Table

**Purpose:** Store SHAP feature contributions for explainability

```sql
CREATE TABLE shap_explanations (
    explanation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(transaction_id) ON DELETE CASCADE,
    
    -- Feature Contribution
    feature_name VARCHAR(100) NOT NULL,
    feature_value DECIMAL(15, 6),
    shap_value DECIMAL(15, 6),
    shap_abs DECIMAL(15, 6),
    
    -- Ranking
    contribution_rank INTEGER,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_shap_transaction (transaction_id),
    INDEX idx_shap_rank (transaction_id, contribution_rank)
);
```

---

### 5. LLM Explanations Table

**Purpose:** Store human-readable LLM explanations

```sql
CREATE TABLE llm_explanations (
    explanation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL UNIQUE REFERENCES transactions(transaction_id) ON DELETE CASCADE,
    
    -- Explanation Content
    explanation_text TEXT NOT NULL,
    language VARCHAR(5) NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'bn')),
    
    -- Metadata
    model_used VARCHAR(50) DEFAULT 'llama-3.1-8b-instant',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

### 6. Analyst Actions Table

**Purpose:** Track analyst actions (Create Case, Flag Account, Report Fraud)

```sql
CREATE TABLE analyst_actions (
    action_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES transactions(transaction_id) ON DELETE SET NULL,
    user_id VARCHAR(20) REFERENCES users(user_id) ON DELETE SET NULL,
    
    -- Action Details
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('CREATE_CASE', 'FLAG_ACCOUNT', 'REPORT_FRAUD', 'APPROVE', 'REJECT', 'REVIEW')),
    action_data JSONB,  -- Flexible JSON for action-specific data
    
    -- Analyst Information
    analyst_id VARCHAR(50) NOT NULL,
    analyst_name VARCHAR(100),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_analyst_actions_transaction (transaction_id),
    INDEX idx_analyst_actions_user (user_id),
    INDEX idx_analyst_actions_type (action_type)
);
```

---

### 7. Flagged Accounts Table

**Purpose:** Track accounts flagged for review

```sql
CREATE TABLE flagged_accounts (
    flag_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(20) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Flag Details
    flag_reason TEXT NOT NULL,
    flag_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    outcome VARCHAR(50) CHECK (outcome IN ('UNDER_REVIEW', 'CLEARED', 'CONFIRMED_FRAUD', 'RESOLVED')),
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    -- Analyst Information
    flagged_by VARCHAR(50),
    resolved_by VARCHAR(50),
    
    -- Indexes
    INDEX idx_flagged_accounts_user (user_id),
    INDEX idx_flagged_accounts_date (flag_date)
);
```

---

### 8. Analytics Snapshot Table

**Purpose:** Store aggregated analytics (money saved, transactions processed, etc.)

```sql
CREATE TABLE analytics_snapshots (
    snapshot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_date DATE NOT NULL,
    
    -- Metrics
    money_saved DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    transactions_processed INTEGER NOT NULL DEFAULT 0,
    fraud_detected INTEGER NOT NULL DEFAULT 0,
    accuracy_rate DECIMAL(5, 2),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraint
    UNIQUE(snapshot_date)
);
```

---

## API Endpoints (ML Service Contract)

### Base URL
```
https://ml-api.clovershield.com/v1
```

### Authentication
All endpoints require API key authentication:
```
Authorization: Bearer <API_KEY>
```

---

### 1. Predict Fraud (Primary Endpoint)

**Endpoint:** `POST /predict`

**Purpose:** Main fraud detection endpoint (replaces `FraudInference.predict_and_explain()`)

**Request Body:**
```json
{
  "transaction": {
    "step": 1,
    "type": "CASH_OUT",
    "amount": 5000.00,
    "nameOrig": "C123456789",
    "oldBalanceOrig": 50000.00,
    "newBalanceOrig": 45000.00,
    "nameDest": "C234567890",
    "oldBalanceDest": 25000.00,
    "newBalanceDest": 30000.00
  },
  "options": {
    "include_shap": true,
    "include_llm_explanation": true,
    "language": "en",
    "topk": 10
  }
}
```

**Request Schema:**
```yaml
Transaction:
  step: integer (optional, default: 1)
  type: string (enum: CASH_OUT, TRANSFER, CASH_IN, PAYMENT, DEBIT)
  amount: number (required, > 0)
  nameOrig: string (required, user_id format)
  oldBalanceOrig: number (required, >= 0)
  newBalanceOrig: number (required, >= 0)
  nameDest: string (required, user_id format)
  oldBalanceDest: number (required, >= 0)
  newBalanceDest: number (required, >= 0)

Options:
  include_shap: boolean (default: true)
  include_llm_explanation: boolean (default: true)
  language: string (enum: en, bn, default: en)
  topk: integer (default: 10, max: 20)
```

**Response (200 OK):**
```json
{
  "transaction_id": "550e8400-e29b-41d4-a716-446655440000",
  "prediction": {
    "fraud_probability": 0.2345,
    "decision": "pass",
    "risk_level": "low",
    "confidence": 0.85
  },
  "shap_explanations": [
    {
      "feature": "amount_over_oldBalanceOrig",
      "value": 0.1,
      "shap": 0.0234,
      "shap_abs": 0.0234,
      "rank": 1
    },
    {
      "feature": "amt_ratio_to_user_mean",
      "value": 1.43,
      "shap": 0.0156,
      "shap_abs": 0.0156,
      "rank": 2
    }
  ],
  "llm_explanation": {
    "text": "This transaction appears to be within normal parameters. The amount is consistent with the user's typical transaction pattern, and the account shows a healthy balance. No immediate concerns detected.",
    "language": "en"
  },
  "processing_time_ms": 145,
  "model_version": "1.0.0",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Response Schema:**
```yaml
Response:
  transaction_id: string (UUID)
  prediction:
    fraud_probability: number (0-1)
    decision: string (enum: pass, warn, block)
    risk_level: string (enum: low, medium, high)
    confidence: number (0-1)
  shap_explanations: array of:
    feature: string
    value: number
    shap: number
    shap_abs: number
    rank: integer
  llm_explanation:
    text: string
    language: string
  processing_time_ms: integer
  model_version: string
  timestamp: string (ISO 8601)
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid transaction data",
  "details": {
    "field": "amount",
    "issue": "Amount must be greater than 0"
  }
}
```

**500 Internal Server Error:**
```json
{
  "error": "MODEL_ERROR",
  "message": "Failed to load ML model",
  "details": {}
}
```

---

### 2. Batch Predict

**Endpoint:** `POST /predict/batch`

**Purpose:** Process multiple transactions in a single request

**Request Body:**
```json
{
  "transactions": [
    {
      "step": 1,
      "type": "CASH_OUT",
      "amount": 5000.00,
      "nameOrig": "C123456789",
      "oldBalanceOrig": 50000.00,
      "newBalanceOrig": 45000.00,
      "nameDest": "C234567890",
      "oldBalanceDest": 25000.00,
      "newBalanceDest": 30000.00
    }
  ],
  "options": {
    "include_shap": false,
    "include_llm_explanation": false
  }
}
```

**Response:**
```json
{
  "results": [
    {
      "transaction_id": "550e8400-e29b-41d4-a716-446655440000",
      "prediction": {
        "fraud_probability": 0.2345,
        "decision": "pass",
        "risk_level": "low"
      }
    }
  ],
  "processing_time_ms": 145,
  "total_transactions": 1
}
```

---

### 3. Health Check

**Endpoint:** `GET /health`

**Purpose:** Check ML service availability and model status

**Response:**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "model_version": "1.0.0",
  "shap_available": true,
  "llm_available": true,
  "uptime_seconds": 3600
}
```

---

### 4. Model Info

**Endpoint:** `GET /model/info`

**Purpose:** Get model metadata and feature information

**Response:**
```json
{
  "model_version": "1.0.0",
  "model_type": "XGBoost",
  "features": [
    {
      "name": "step",
      "type": "integer",
      "description": "Time step"
    },
    {
      "name": "amount",
      "type": "float",
      "description": "Transaction amount"
    }
  ],
  "threshold": 0.0793,
  "training_date": "2024-01-01"
}
```

---

## Frontend Component Map (Plasmic/React)

### Page Structure

```
CloverShield App
├── Layout (Main App Shell)
│   ├── Header Component
│   ├── Sidebar Component
│   └── Main Content Area
├── Transaction Simulator Page (/simulator)
│   ├── Transaction Input Form
│   ├── User Selection Component
│   └── Transaction History View
├── Guardian Command Center Page (/guardian)
│   ├── Decision Zone Component
│   ├── Explanation Zone Component
│   └── Analyst Actions Component
└── Analytics Dashboard Page (/analytics)
    ├── Metrics Cards
    └── Charts/Visualizations
```

---

### Component Breakdown

#### 1. Layout Components

**Header Component**
- **Location:** `components/Header.tsx`
- **Purpose:** App header with logo, title, language toggle
- **Props:**
  ```typescript
  interface HeaderProps {
    language: 'en' | 'bn';
    onLanguageChange: (lang: 'en' | 'bn') => void;
  }
  ```
- **Features:**
  - Logo display
  - App title (bilingual)
  - Language toggle (EN/BN)
  - Tagline display

**Sidebar Component**
- **Location:** `components/Sidebar.tsx`
- **Purpose:** Navigation and session stats
- **Props:**
  ```typescript
  interface SidebarProps {
    currentPage: string;
    onPageChange: (page: string) => void;
    sessionStats: {
      transactionsProcessed: number;
      fraudDetected: number;
      moneySaved: number;
    };
  }
  ```
- **Features:**
  - Navigation menu
  - Model status indicator
  - Session statistics
  - Language selector

---

#### 2. Transaction Simulator Page Components

**Transaction Input Form**
- **Location:** `pages/TransactionSimulator/TransactionInputForm.tsx`
- **Purpose:** Input zone for transaction details (replaces Zone 1 in Streamlit)
- **Props:**
  ```typescript
  interface TransactionInputFormProps {
    users: User[];
    onSubmit: (transaction: TransactionInput) => void;
    language: 'en' | 'bn';
  }
  ```
- **Features:**
  - Sender account selector (with balance display)
  - Transaction type selector (CASH_OUT/TRANSFER)
  - Receiver account selector (with recent receivers)
  - Amount input (with presets: 500, 1000, 5000, 10000)
  - Optional note field
  - Validation (amount > 0, sufficient balance, different accounts)
  - "Analyze Transaction" button

**User Selection Component**
- **Location:** `components/UserSelection.tsx`
- **Purpose:** User dropdown with account info
- **Props:**
  ```typescript
  interface UserSelectionProps {
    users: User[];
    selectedUserId: string | null;
    onUserSelect: (userId: string) => void;
    language: 'en' | 'bn';
  }
  ```
- **Features:**
  - Dropdown with user list
  - Account info display (name, balance, provider)
  - Balance display
  - Account age indicator

**Transaction History View**
- **Location:** `components/TransactionHistory.tsx`
- **Purpose:** Display recent transaction history
- **Props:**
  ```typescript
  interface TransactionHistoryProps {
    userId: string;
    limit?: number;
    language: 'en' | 'bn';
  }
  ```
- **Features:**
  - Transaction list (date, type, amount, receiver, status)
  - Sortable columns
  - Pagination

---

#### 3. Guardian Command Center Components

**Decision Zone Component**
- **Location:** `components/DecisionZone.tsx`
- **Purpose:** Unified decision card (replaces Zone 2 in Streamlit)
- **Props:**
  ```typescript
  interface DecisionZoneProps {
    probability: number;
    decision: 'pass' | 'warn' | 'block';
    riskLevel: 'low' | 'medium' | 'high';
    confidence: number;
    language: 'en' | 'bn';
  }
  ```
- **Features:**
  - Large fraud probability display (percentage)
  - Recommended action (APPROVE/REVIEW/BLOCK)
  - Confidence indicator
  - Compact gauge chart (Plotly/Recharts)
  - Risk level badge
  - Semantic color coding (blue/amber/red)

**Explanation Zone Component**
- **Location:** `components/ExplanationZone.tsx`
- **Purpose:** Tabbed explanation interface (replaces Zone 3 in Streamlit)
- **Props:**
  ```typescript
  interface ExplanationZoneProps {
    transactionId: string;
    shapTable: SHAPRow[];
    llmExplanation: string | null;
    transactionData: Transaction;
    language: 'en' | 'bn';
  }
  ```
- **Features:**
  - Tab navigation (Why?, Evidence, Technical, Developer)
  - Risk drivers display
  - Counterparty trust profile
  - Historical flags
  - SHAP visualization
  - API payload viewer

**Risk Drivers Component**
- **Location:** `components/RiskDrivers.tsx`
- **Purpose:** Human-readable risk driver cards
- **Props:**
  ```typescript
  interface RiskDriversProps {
    shapTable: SHAPRow[];
    language: 'en' | 'bn';
  }
  ```
- **Features:**
  - Categorized risk drivers (Transaction Behavior, Account History, etc.)
  - Strength indicators (Strong/Moderate/Weak)
  - Direction indicators (↑/↓)
  - Plain-language descriptions
  - Feature name mapping (technical → human-readable)

**Counterparty Trust Profile Component**
- **Location:** `components/CounterpartyTrust.tsx`
- **Purpose:** Display receiver trust information
- **Props:**
  ```typescript
  interface CounterpartyTrustProps {
    receiverId: string;
    trustLevel: 'High' | 'Medium' | 'Low';
    trustScore: number;
    receiverData: User;
    language: 'en' | 'bn';
  }
  ```
- **Features:**
  - Trust score display
  - Account age
  - Verification status
  - Transaction history summary
  - Trust badge

**Analyst Actions Component**
- **Location:** `components/AnalystActions.tsx`
- **Purpose:** One-click analyst actions
- **Props:**
  ```typescript
  interface AnalystActionsProps {
    transactionId: string;
    userId: string;
    decision: 'pass' | 'warn' | 'block';
    onAction: (action: 'CREATE_CASE' | 'FLAG_ACCOUNT' | 'REPORT_FRAUD') => void;
    language: 'en' | 'bn';
  }
  ```
- **Features:**
  - "Create Case" button
  - "Flag Account" button
  - "Report Fraud" button
  - Action confirmation modals

**Analyst Checklist Component**
- **Location:** `components/AnalystChecklist.tsx`
- **Purpose:** Context-aware checklist
- **Props:**
  ```typescript
  interface AnalystChecklistProps {
    decision: 'pass' | 'warn' | 'block';
    language: 'en' | 'bn';
  }
  ```
- **Features:**
  - Decision-specific checklist items
  - Checkbox list
  - Actionable guidance

---

#### 4. Analytics Dashboard Components

**Metrics Cards Component**
- **Location:** `components/MetricsCards.tsx`
- **Purpose:** Display key metrics
- **Props:**
  ```typescript
  interface MetricsCardsProps {
    moneySaved: number;
    transactionsProcessed: number;
    fraudDetected: number;
    accuracyRate: number;
    language: 'en' | 'bn';
  }
  ```
- **Features:**
  - Money saved today
  - Transactions processed
  - Fraud detected
  - System accuracy rate

**Charts Component**
- **Location:** `components/Charts.tsx`
- **Purpose:** Visualizations (Plotly/Recharts)
- **Features:**
  - Fraud probability gauge
  - SHAP bar chart
  - Transaction volume over time
  - Risk distribution

---

#### 5. Shared Components

**Language Toggle**
- **Location:** `components/LanguageToggle.tsx`
- **Purpose:** Switch between English and Bangla
- **Props:**
  ```typescript
  interface LanguageToggleProps {
    currentLanguage: 'en' | 'bn';
    onLanguageChange: (lang: 'en' | 'bn') => void;
  }
  ```

**Loading Spinner**
- **Location:** `components/LoadingSpinner.tsx`
- **Purpose:** Show loading state during ML prediction

**Error Display**
- **Location:** `components/ErrorDisplay.tsx`
- **Purpose:** Display error messages

**Confirmation Modal**
- **Location:** `components/ConfirmationModal.tsx`
- **Purpose:** Confirm analyst actions

---

### State Management

**Recommended:** Zustand or Redux Toolkit

**Store Structure:**
```typescript
interface AppState {
  // User Data
  users: User[];
  selectedUser: User | null;
  
  // Transaction State
  currentTransaction: TransactionInput | null;
  transactionResult: PredictionResult | null;
  
  // UI State
  language: 'en' | 'bn';
  currentPage: string;
  
  // Analytics
  sessionStats: {
    transactionsProcessed: number;
    fraudDetected: number;
    moneySaved: number;
  };
}
```

---

### API Integration

**API Client:**
- **Location:** `lib/api.ts`
- **Functions:**
  ```typescript
  // ML Service
  async function predictFraud(transaction: TransactionInput, options: PredictionOptions): Promise<PredictionResult>
  async function batchPredict(transactions: TransactionInput[]): Promise<PredictionResult[]>
  
  // Supabase
  async function getUsers(): Promise<User[]>
  async function getUser(userId: string): Promise<User>
  async function getTransactionHistory(userId: string, limit: number): Promise<Transaction[]>
  async function createTransaction(transaction: TransactionInput): Promise<Transaction>
  async function createAnalystAction(action: AnalystAction): Promise<void>
  async function flagAccount(userId: string, reason: string): Promise<void>
  ```

---

## Data Flow Architecture

### Transaction Processing Flow

```
1. User Input (Frontend)
   ↓
2. Validation (Frontend)
   ↓
3. Create Transaction Record (Supabase)
   ↓
4. Call ML API /predict (Frontend → ML Service)
   ↓
5. ML Service Processes:
   - Feature Engineering
   - Model Prediction
   - SHAP Explanation
   - LLM Explanation (optional)
   ↓
6. Return Prediction Result (ML Service → Frontend)
   ↓
7. Update Transaction Record with Results (Supabase)
   ↓
8. Store SHAP Explanations (Supabase)
   ↓
9. Store LLM Explanation (Supabase, if available)
   ↓
10. Display Results in UI (Frontend)
```

### Data Fetching Flow

```
Frontend Request
   ↓
Supabase Client (PostgreSQL)
   ↓
Row Level Security (RLS) Policies
   ↓
Return Data (JSON)
   ↓
Frontend Display
```

---

## Feature Mapping Matrix

### Streamlit Features → New Stack Components

| Streamlit Feature | Supabase Table | React Component | ML API Endpoint |
|------------------|----------------|-----------------|-----------------|
| `MOCK_USERS` | `users` | `UserSelection` | N/A |
| Transaction History | `transactions` | `TransactionHistory` | N/A |
| Transaction Input Form | `transactions` | `TransactionInputForm` | N/A |
| Fraud Prediction | `transactions` | `DecisionZone` | `POST /predict` |
| SHAP Explanations | `shap_explanations` | `RiskDrivers` | Included in `/predict` |
| LLM Explanations | `llm_explanations` | `ExplanationZone` | Included in `/predict` |
| Analyst Actions | `analyst_actions` | `AnalystActions` | N/A (Supabase only) |
| Flagged Accounts | `flagged_accounts` | `CounterpartyTrust` | N/A (Supabase only) |
| Analytics | `analytics_snapshots` | `MetricsCards` | N/A (Supabase only) |
| Language Toggle | N/A | `LanguageToggle` | N/A |
| Model Status | N/A | `Sidebar` | `GET /health` |

---

## Implementation Checklist

### Phase 1: Database Setup
- [ ] Create Supabase project
- [ ] Create all tables (users, transactions, etc.)
- [ ] Set up Row Level Security (RLS) policies
- [ ] Create indexes for performance
- [ ] Migrate mock data to Supabase

### Phase 2: ML API Service
- [ ] Set up FastAPI/Flask service
- [ ] Implement `/predict` endpoint
- [ ] Implement `/predict/batch` endpoint
- [ ] Implement `/health` endpoint
- [ ] Add authentication middleware
- [ ] Deploy ML service (separate from frontend)

### Phase 3: Frontend Development
- [ ] Set up React project with Plasmic
- [ ] Create layout components (Header, Sidebar)
- [ ] Implement Transaction Simulator page
- [ ] Implement Guardian Command Center page
- [ ] Implement Analytics Dashboard page
- [ ] Add state management (Zustand/Redux)
- [ ] Integrate Supabase client
- [ ] Integrate ML API client
- [ ] Add bilingual support
- [ ] Add error handling

### Phase 4: Integration & Testing
- [ ] End-to-end transaction flow testing
- [ ] ML API integration testing
- [ ] Database query performance testing
- [ ] UI/UX testing
- [ ] Bilingual content verification

### Phase 5: Deployment
- [ ] Deploy Supabase (production)
- [ ] Deploy ML API service
- [ ] Deploy React app to Vercel
- [ ] Set up environment variables
- [ ] Configure CORS
- [ ] Set up monitoring and logging

---

## OpenAPI Specification Draft

See `openapi-spec.yaml` (to be generated) for complete API specification including:
- Request/response schemas
- Error codes
- Authentication
- Rate limiting
- Versioning

---

## Notes

1. **Feature Engineering:** The ML service will handle feature engineering internally (using `FraudFeatureEngineer` class). The frontend only needs to send raw transaction data.

2. **Real-time Updates:** Consider using Supabase Realtime subscriptions for live transaction updates.

3. **Caching:** Cache user data and transaction history on the frontend to reduce API calls.

4. **Error Handling:** Implement comprehensive error handling for:
   - ML API failures
   - Database connection issues
   - Network timeouts
   - Invalid data

5. **Performance:** 
   - Use database indexes for fast queries
   - Implement pagination for transaction history
   - Cache SHAP explanations (they don't change)

6. **Security:**
   - Implement Row Level Security (RLS) in Supabase
   - Use API keys for ML service authentication
   - Sanitize all user inputs
   - Implement rate limiting

---

**Document Status:** ✅ Complete  
**Next Steps:** Begin Phase 1 implementation (Database Setup)

