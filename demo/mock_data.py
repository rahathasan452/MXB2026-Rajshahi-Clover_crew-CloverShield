"""
Mock Database and Data Generator for CloverShield Demo
Provides mock user data and transaction history for demonstration purposes
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

# Mock user database
MOCK_USERS = [
    {
        'user_id': 'C123456789',
        'name_en': 'Abdul Rahman',
        'name_bn': 'আব্দুল রহমান',
        'phone': '+8801712345678',
        'provider': 'bKash',
        'balance': 50000,
        'account_age_days': 450,
        'total_transactions': 125,
        'avg_transaction_amount': 3500,
        'verified': True,
        'kyc_complete': True,
        'risk_level': 'low'
    },
    {
        'user_id': 'C234567890',
        'name_en': 'Fatima Begum',
        'name_bn': 'ফাতিমা বেগম',
        'phone': '+8801812345678',
        'provider': 'Nagad',
        'balance': 25000,
        'account_age_days': 320,
        'total_transactions': 89,
        'avg_transaction_amount': 2800,
        'verified': True,
        'kyc_complete': True,
        'risk_level': 'low'
    },
    {
        'user_id': 'C345678901',
        'name_en': 'Karim Uddin',
        'name_bn': 'করিম উদ্দিন',
        'phone': '+8801912345678',
        'provider': 'Rocket',
        'balance': 75000,
        'account_age_days': 680,
        'total_transactions': 234,
        'avg_transaction_amount': 4200,
        'verified': True,
        'kyc_complete': True,
        'risk_level': 'low'
    },
    {
        'user_id': 'C456789012',
        'name_en': 'Rashida Khatun',
        'name_bn': 'রাশিদা খাতুন',
        'phone': '+8801612345678',
        'provider': 'Upay',
        'balance': 15000,
        'account_age_days': 120,
        'total_transactions': 45,
        'avg_transaction_amount': 2200,
        'verified': True,
        'kyc_complete': False,
        'risk_level': 'medium'
    },
    {
        'user_id': 'C567890123',
        'name_en': 'Hasan Ali',
        'name_bn': 'হাসান আলী',
        'phone': '+8801712345679',
        'provider': 'bKash',
        'balance': 30000,
        'account_age_days': 89,
        'total_transactions': 12,
        'avg_transaction_amount': 5000,
        'verified': False,
        'kyc_complete': False,
        'risk_level': 'medium'
    },
    {
        'user_id': 'C678901234',
        'name_en': 'Ayesha Sultana',
        'name_bn': 'আয়েশা সুলতানা',
        'phone': '+8801812345679',
        'provider': 'Nagad',
        'balance': 8000,
        'account_age_days': 45,
        'total_transactions': 8,
        'avg_transaction_amount': 1500,
        'verified': False,
        'kyc_complete': False,
        'risk_level': 'high'
    },
    {
        'user_id': 'C789012345',
        'name_en': 'Mohammad Hossain',
        'name_bn': 'মোহাম্মদ হোসেন',
        'phone': '+8801912345679',
        'provider': 'Rocket',
        'balance': 120000,
        'account_age_days': 890,
        'total_transactions': 456,
        'avg_transaction_amount': 3800,
        'verified': True,
        'kyc_complete': True,
        'risk_level': 'low'
    },
    {
        'user_id': 'C890123456',
        'name_en': 'Nusrat Jahan',
        'name_bn': 'নুসরাত জাহান',
        'phone': '+8801612345679',
        'provider': 'Upay',
        'balance': 18000,
        'account_age_days': 200,
        'total_transactions': 67,
        'avg_transaction_amount': 3200,
        'verified': True,
        'kyc_complete': True,
        'risk_level': 'low'
    },
    {
        'user_id': 'C901234567',
        'name_en': 'Shahidul Islam',
        'name_bn': 'শাহিদুল ইসলাম',
        'phone': '+8801712345680',
        'provider': 'bKash',
        'balance': 22000,
        'account_age_days': 156,
        'total_transactions': 34,
        'avg_transaction_amount': 4500,
        'verified': True,
        'kyc_complete': False,
        'risk_level': 'medium'
    },
    {
        'user_id': 'C012345678',
        'name_en': 'Rokeya Begum',
        'name_bn': 'রোকেয়া বেগম',
        'phone': '+8801812345680',
        'provider': 'Nagad',
        'balance': 35000,
        'account_age_days': 567,
        'total_transactions': 178,
        'avg_transaction_amount': 2900,
        'verified': True,
        'kyc_complete': True,
        'risk_level': 'low'
    },
    {
        'user_id': 'C111222333',
        'name_en': 'Kamal Ahmed',
        'name_bn': 'কামাল আহমেদ',
        'phone': '+8801912345680',
        'provider': 'Rocket',
        'balance': 5000,
        'account_age_days': 23,
        'total_transactions': 5,
        'avg_transaction_amount': 2000,
        'verified': False,
        'kyc_complete': False,
        'risk_level': 'suspicious'
    },
    {
        'user_id': 'C222333444',
        'name_en': 'Salma Akter',
        'name_bn': 'সালমা আক্তার',
        'phone': '+8801612345680',
        'provider': 'Upay',
        'balance': 95000,
        'account_age_days': 720,
        'total_transactions': 312,
        'avg_transaction_amount': 4100,
        'verified': True,
        'kyc_complete': True,
        'risk_level': 'low'
    },
    {
        'user_id': 'C333444555',
        'name_en': 'Rafiqul Islam',
        'name_bn': 'রফিকুল ইসলাম',
        'phone': '+8801712345681',
        'provider': 'bKash',
        'balance': 28000,
        'account_age_days': 234,
        'total_transactions': 78,
        'avg_transaction_amount': 3600,
        'verified': True,
        'kyc_complete': True,
        'risk_level': 'low'
    },
    {
        'user_id': 'C444555666',
        'name_en': 'Jahanara Begum',
        'name_bn': 'জাহানারা বেগম',
        'phone': '+8801812345681',
        'provider': 'Nagad',
        'balance': 42000,
        'account_age_days': 389,
        'total_transactions': 145,
        'avg_transaction_amount': 3300,
        'verified': True,
        'kyc_complete': True,
        'risk_level': 'low'
    },
    {
        'user_id': 'C555666777',
        'name_en': 'Tariqul Hasan',
        'name_bn': 'তারিকুল হাসান',
        'phone': '+8801912345681',
        'provider': 'Rocket',
        'balance': 15000,
        'account_age_days': 67,
        'total_transactions': 15,
        'avg_transaction_amount': 2800,
        'verified': False,
        'kyc_complete': False,
        'risk_level': 'high'
    }
]


class MockDatabase:
    """Mock database for demo purposes"""
    
    def __init__(self):
        self.users = {user['user_id']: user.copy() for user in MOCK_USERS}
        self.transaction_history = {}
        self._initialize_history()
    
    def _initialize_history(self):
        """Initialize transaction history for all users"""
        for user_id in self.users.keys():
            self.transaction_history[user_id] = self._generate_history(user_id)
    
    def _generate_history(self, user_id, count=10):
        """Generate mock transaction history"""
        user = self.users[user_id]
        history = []
        
        for i in range(count):
            days_ago = random.randint(1, 30)
            timestamp = datetime.now() - timedelta(days=days_ago)
            
            # Generate realistic transaction amounts
            base_amount = user['avg_transaction_amount']
            amount = random.randint(int(base_amount * 0.5), int(base_amount * 2))
            
            txn_types = ['CASH_OUT', 'TRANSFER', 'PAYMENT', 'CASH_IN']
            txn_type = random.choice(txn_types)
            
            # Select random receiver
            other_users = [uid for uid in self.users.keys() if uid != user_id]
            receiver = random.choice(other_users) if other_users else user_id
            
            history.append({
                'date': timestamp.strftime('%Y-%m-%d %H:%M'),
                'type': txn_type,
                'amount': amount,
                'receiver': receiver,
                'status': random.choice(['COMPLETED', 'COMPLETED', 'COMPLETED', 'PENDING'])
            })
        
        # Sort by date (most recent first)
        history.sort(key=lambda x: x['date'], reverse=True)
        return history
    
    def get_all_users(self):
        """Get all users"""
        return list(self.users.values())
    
    def get_user(self, user_id):
        """Get user by ID"""
        return self.users.get(user_id)
    
    def get_user_history(self, user_id, limit=10):
        """Get transaction history for a user"""
        return self.transaction_history.get(user_id, [])[:limit]
    
    def update_balance(self, user_id, new_balance):
        """Update user balance"""
        if user_id in self.users:
            self.users[user_id]['balance'] = new_balance


# Global mock database instance
mock_db = MockDatabase()


def create_transaction_dataframe(sender_data, receiver_id, amount, txn_type):
    """
    Create a transaction dataframe in the format expected by the ML model
    
    Args:
        sender_data: Dictionary with sender user information
        receiver_id: Receiver user ID
        amount: Transaction amount
        txn_type: Transaction type ('CASH_OUT', 'TRANSFER', etc.)
    
    Returns:
        pandas DataFrame with transaction features
    """
    # Get receiver data if available
    receiver_data = mock_db.get_user(receiver_id)
    
    # Calculate balances
    old_balance_orig = sender_data.get('balance', 0)
    new_balance_orig = max(0, old_balance_orig - amount) if txn_type in ['CASH_OUT', 'TRANSFER'] else old_balance_orig + amount
    
    old_balance_dest = receiver_data.get('balance', 0) if receiver_data else 0
    new_balance_dest = old_balance_dest + amount if txn_type in ['TRANSFER', 'CASH_IN'] else old_balance_dest
    
    # Create transaction dataframe with required columns
    transaction_data = {
        'step': 1,  # Time step (simplified for demo)
        'type': txn_type,
        'amount': float(amount),
        'nameOrig': sender_data.get('user_id', 'C000000000'),
        'oldBalanceOrig': float(old_balance_orig),
        'newBalanceOrig': float(new_balance_orig),
        'nameDest': receiver_id,
        'oldBalanceDest': float(old_balance_dest),
        'newBalanceDest': float(new_balance_dest),
        'isFlaggedFraud': 0  # Will be determined by model
    }
    
    # Create DataFrame
    df = pd.DataFrame([transaction_data])
    
    # Note: Additional feature engineering (amount_log1p, amount_over_oldBalanceOrig, etc.)
    # will be handled by the FraudFeatureEngineer in the pipeline
    # We only need to provide the raw transaction data here
    
    return df

