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
            DataFrame with engineered features matching the training feature set
        """
        # Create a copy to avoid modifying original
        df = X.copy()
        
        # Basic amount features
        df['amount_log1p'] = np.log1p(df['amount'])
        
        # Balance ratio features (only amount_over_oldBalanceOrig was in training)
        df['amount_over_oldBalanceOrig'] = df['amount'] / (df['oldBalanceOrig'] + 1e-6)
        
        # Transaction type encoding
        type_map = {
            'CASH_OUT': 1,
            'TRANSFER': 0,
            'CASH_IN': 2,
            'DEBIT': 3,
            'PAYMENT': 4
        }
        df['type_encoded'] = df['type'].map(type_map).fillna(0)
        
        # Time features (only hour was in training, not day)
        if 'step' in df.columns:
            df['hour'] = (df['step'] % 24).astype(int)
        else:
            df['hour'] = 12  # Default
        
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
        
        # Select and return engineered features in the EXACT order expected by the model
        # This matches the training feature order: 
        # ['step', 'amount', 'oldBalanceOrig', 'newBalanceOrig', 'oldBalanceDest', 
        #  'newBalanceDest', 'hour', 'orig_txn_count', 'dest_txn_count', 
        #  'amt_ratio_to_user_mean', 'amount_log1p', 'amount_over_oldBalanceOrig', 
        #  'amt_ratio_to_user_median', 'amt_log_ratio_to_user_median', 
        #  'in_degree', 'out_degree', 'network_trust', 'is_new_origin', 
        #  'is_new_dest', 'type_encoded']
        feature_cols = [
            'step', 'amount', 'oldBalanceOrig', 'newBalanceOrig', 
            'oldBalanceDest', 'newBalanceDest', 'hour', 
            'orig_txn_count', 'dest_txn_count', 
            'amt_ratio_to_user_mean', 'amount_log1p', 'amount_over_oldBalanceOrig', 
            'amt_ratio_to_user_median', 'amt_log_ratio_to_user_median', 
            'in_degree', 'out_degree', 'network_trust', 
            'is_new_origin', 'is_new_dest', 'type_encoded'
        ]
        
        # Only include columns that exist and maintain order
        available_cols = [col for col in feature_cols if col in df.columns]
        
        # Ensure all required columns exist, fill missing with defaults
        for col in feature_cols:
            if col not in df.columns:
                if col in ['step', 'hour', 'orig_txn_count', 'dest_txn_count', 
                          'in_degree', 'out_degree', 'is_new_origin', 'is_new_dest', 
                          'type_encoded']:
                    df[col] = 0
                elif col in ['amount', 'oldBalanceOrig', 'newBalanceOrig', 
                            'oldBalanceDest', 'newBalanceDest']:
                    df[col] = 0.0
                elif col in ['amt_ratio_to_user_mean', 'amt_ratio_to_user_median', 
                            'amount_over_oldBalanceOrig', 'network_trust']:
                    df[col] = 0.0
                elif col == 'amount_log1p':
                    df[col] = np.log1p(df.get('amount', 0))
                elif col == 'amt_log_ratio_to_user_median':
                    df[col] = 0.0
        
        return df[feature_cols]

