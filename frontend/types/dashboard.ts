export interface UserProfile {
  user_id: string;
  name_en: string;
  name_bn: string;
  phone: string;
  provider: string;
  balance: number;
  account_age_days: number;
  total_transactions: number;
  avg_transaction_amount: number;
  verified: boolean;
  kyc_complete: boolean;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  is_from_test_dataset?: boolean;
}

export interface Transaction {
  transaction_id: string;
  sender_id: string;
  receiver_id: string;
  amount: number;
  transaction_type: string;
  created_at?: string; // ISO String
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'BLOCKED' | 'REVIEW';
  is_test_data?: boolean;
  fraud_probability?: number;
}
