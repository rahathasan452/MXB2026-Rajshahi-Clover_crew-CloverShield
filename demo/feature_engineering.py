"""
Feature Engineering Module for Fraud Detection
Defines FraudFeatureEngineer class for model pipeline compatibility
"""

import pandas as pd
import numpy as np
from sklearn.base import BaseEstimator, TransformerMixin
import networkx as nx
from typing import Optional


class FraudFeatureEngineer(BaseEstimator, TransformerMixin):
    """
    Feature engineering transformer for fraud detection pipeline.
    This class must be available when loading the pickled model.
    """
    
    def __init__(self):
        """Initialize the feature engineer"""
        pass
    
    def fit(self, X: pd.DataFrame, y: Optional[pd.Series] = None):
        """
        Fit the transformer (no-op for this transformer)
        
        Args:
            X: Input DataFrame
            y: Optional target variable
            
        Returns:
            self
        """
        return self
    
    def transform(self, X: pd.DataFrame) -> pd.DataFrame:
        """
        Transform input data by engineering features
        
        Args:
            X: Input DataFrame with raw transaction data
            
        Returns:
            DataFrame with engineered features
        """
        # Create a copy to avoid modifying original
        df = X.copy()
        
        # Basic amount features
        df['amount_log1p'] = np.log1p(df['amount'])
        
        # Balance ratio features
        df['amount_over_oldBalanceOrig'] = df['amount'] / (df['oldBalanceOrig'] + 1e-6)
        df['amount_over_oldBalanceDest'] = df['amount'] / (df['oldBalanceDest'] + 1e-6)
        
        # Balance error features
        df['orig_balance_error'] = np.abs(
            df['oldBalanceOrig'] - df['amount'] - df['newBalanceOrig']
        )
        df['dest_balance_error'] = np.abs(
            df['oldBalanceDest'] + df['amount'] - df['newBalanceDest']
        )
        
        # Transaction type encoding
        type_map = {
            'CASH_OUT': 1,
            'TRANSFER': 0,
            'CASH_IN': 2,
            'DEBIT': 3,
            'PAYMENT': 4
        }
        df['type_encoded'] = df['type'].map(type_map).fillna(0)
        
        # Time features
        if 'step' in df.columns:
            df['hour'] = (df['step'] % 24).astype(int)
            df['day'] = (df['step'] // 24).astype(int)
        else:
            df['hour'] = 12  # Default
            df['day'] = 1
        
        # Initialize graph features (simplified - actual implementation may differ)
        df['in_degree'] = 0
        df['out_degree'] = 0
        df['network_trust'] = 0.0
        df['orig_txn_count'] = 1
        df['dest_txn_count'] = 1
        
        # Amount ratio features (simplified - actual may use user history)
        df['amt_ratio_to_user_mean'] = 1.0
        df['amt_ratio_to_user_median'] = 1.0
        df['amt_log_ratio_to_user_median'] = 0.0
        
        # New account flags
        df['is_new_origin'] = 0
        df['is_new_dest'] = 0
        
        # Select and return engineered features
        # This should match the features expected by the model
        feature_cols = [
            'amount', 'amount_log1p',
            'amount_over_oldBalanceOrig', 'amount_over_oldBalanceDest',
            'orig_balance_error', 'dest_balance_error',
            'type_encoded', 'hour', 'day',
            'in_degree', 'out_degree', 'network_trust',
            'orig_txn_count', 'dest_txn_count',
            'amt_ratio_to_user_mean', 'amt_ratio_to_user_median',
            'amt_log_ratio_to_user_median',
            'is_new_origin', 'is_new_dest',
            'oldBalanceOrig', 'newBalanceOrig',
            'oldBalanceDest', 'newBalanceDest',
            'step'
        ]
        
        # Only include columns that exist
        available_cols = [col for col in feature_cols if col in df.columns]
        
        return df[available_cols]

