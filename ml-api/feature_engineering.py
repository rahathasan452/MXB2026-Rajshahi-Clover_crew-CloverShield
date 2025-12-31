"""
Feature Engineering Module for Fraud Detection
Defines FraudFeatureEngineer class for model pipeline compatibility
"""

import pandas as pd
import numpy as np
from sklearn.base import BaseEstimator, TransformerMixin
from typing import Optional
import networkx as nx


class FraudFeatureEngineer(BaseEstimator, TransformerMixin):
    """
    Vectorized, deterministic feature transformer.
    - Builds weighted directed graph (aggregated by (origin,dest) counts)
    - Creates frequency, ratio, log and graph features
    """
    
    def __init__(self, pagerank_limit=None):
        """
        Initialize the feature engineer
        
        Args:
            pagerank_limit: Optional limit on number of nodes for PageRank computation
        """
        self.pagerank_limit = pagerank_limit
        self.stats = {}
        self.graph_meta = {}
        self.type_map = {'TRANSFER': 0, 'CASH_OUT': 1}
        self.global_mean = 0.0
        self.global_median = 0.0
    
    def fit(self, X, y=None):
        """
        Fit the feature engineer on training/test data (memory-optimized)
        
        Args:
            X: Input DataFrame with raw transaction data
            y: Optional target variable (not used)
            
        Returns:
            self
        """
        # Memory optimization: work with views where possible, avoid unnecessary copies
        # Only copy if we need to modify (sorting)
        if 'step' in X.columns:
            # Sort in-place if possible, or use a view
            X_sorted = X.sort_values('step', kind='mergesort')  # Stable sort
        else:
            X_sorted = X

        # Basic global stats (compute once, reuse)
        self.global_mean = float(X_sorted['amount'].mean())
        self.global_median = float(X_sorted['amount'].median())

        # Frequency & mean - use memory-efficient operations
        self.stats['orig_counts'] = X_sorted['nameOrig'].value_counts().to_dict()
        self.stats['dest_counts'] = X_sorted['nameDest'].value_counts().to_dict()
        
        # Groupby operations - compute once, store as dicts
        orig_groups = X_sorted.groupby('nameOrig')['amount']
        self.stats['orig_mean_amt'] = orig_groups.mean().to_dict()
        self.stats['orig_median_amt'] = orig_groups.median().to_dict()
        self.stats['orig_log_median_amt'] = orig_groups.apply(lambda s: np.log1p(s).median()).to_dict()
        
        if 'step' in X_sorted.columns:
            self.stats['last_step'] = X_sorted.groupby('nameOrig')['step'].last().to_dict()
        else:
            self.stats['last_step'] = {}

        # Weighted graph: count transactions per (origin,dest) - memory efficient
        # Use value_counts on tuples for edge weights (more memory efficient)
        edge_counts = X_sorted.groupby(['nameOrig', 'nameDest']).size()
        
        # Build graph directly from edge counts (avoid intermediate DataFrame)
        G = nx.DiGraph()
        if len(edge_counts) > 0:
            # Add edges directly from the Series (more memory efficient)
            for (orig, dest), weight in edge_counts.items():
                G.add_edge(orig, dest, weight=float(weight))

        # Store degree dictionaries (memory efficient)
        self.graph_meta['in_degree'] = dict(G.in_degree(weight='weight'))
        self.graph_meta['out_degree'] = dict(G.out_degree(weight='weight'))

        # Pagerank: limit nodes if requested to save time/memory
        # Default to limiting if graph is large
        default_pagerank_limit = 10000  # Limit to top 10k nodes by default
        try:
            if G.number_of_nodes() == 0:
                self.graph_meta['pagerank'] = {}
            else:
                # Use pagerank_limit if set, otherwise use default limit for large graphs
                effective_limit = self.pagerank_limit if self.pagerank_limit else default_pagerank_limit
                
                if effective_limit < G.number_of_nodes():
                    # Only compute PageRank on top nodes by degree
                    top_nodes = sorted(G.degree(weight='weight'), key=lambda x: x[1], reverse=True)[:effective_limit]
                    keep = set(n for n, _ in top_nodes)
                    sub = G.subgraph(keep).copy()
                    self.graph_meta['pagerank'] = nx.pagerank(sub, alpha=0.85, weight='weight', tol=1e-4)
                    print(f"📊 PageRank computed on {len(keep):,} top nodes (graph has {G.number_of_nodes():,} total nodes)")
                else:
                    self.graph_meta['pagerank'] = nx.pagerank(G, alpha=0.85, weight='weight', tol=1e-4)
        except Exception as e:
            # Pagerank failure should not break training
            print(f"⚠️ PageRank computation failed: {str(e)}, using empty pagerank")
            self.graph_meta['pagerank'] = {}

        return self
    
    def transform(self, X):
        """
        Transform input data by engineering features
        
        Args:
            X: Input DataFrame with raw transaction data
            
        Returns:
            DataFrame with engineered features matching the training feature set
        """
        X = X.copy()

        # Time features
        X['hour'] = X['step'] % 24 if 'step' in X.columns else 0
        
        # Frequency mapping
        X['orig_txn_count'] = X['nameOrig'].map(self.stats.get('orig_counts', {})).fillna(0).astype(int)
        X['dest_txn_count'] = X['nameDest'].map(self.stats.get('dest_counts', {})).fillna(0).astype(int)

        # Ratio features
        user_mean = X['nameOrig'].map(self.stats.get('orig_mean_amt', {})).fillna(self.global_mean)
        X['amt_ratio_to_user_mean'] = X['amount'] / (user_mean + 1.0)
        X['amount_log1p'] = np.log1p(X['amount'])
        X['amount_over_oldBalanceOrig'] = X['amount'] / (X['oldBalanceOrig'].replace(0, np.nan).fillna(1.0))
        
        user_median = X['nameOrig'].map(self.stats.get('orig_median_amt', {})).fillna(self.global_median)
        # Apply fallback to global median for users with too few transactions
        MIN_TXNS = 3
        user_median = np.where(X['orig_txn_count'] >= MIN_TXNS, user_median, self.global_median)
        X['amt_ratio_to_user_median'] = (X['amount'] / (user_median + 1.0))
        
        user_log_median = X['nameOrig'].map(self.stats.get('orig_log_median_amt', {})).fillna(np.log1p(self.global_median))
        X['amt_log_ratio_to_user_median'] = (np.log1p(X['amount']) / (user_log_median + 1e-6))

        # Graph features
        X['in_degree'] = X['nameDest'].map(self.graph_meta.get('in_degree', {})).fillna(0).astype(float)
        X['out_degree'] = X['nameOrig'].map(self.graph_meta.get('out_degree', {})).fillna(0).astype(float)
        X['network_trust'] = X['nameOrig'].map(self.graph_meta.get('pagerank', {})).fillna(0.0).astype(float)

        # New/novelty flags
        X['is_new_origin'] = (X['orig_txn_count'] == 0).astype(int)
        X['is_new_dest'] = (X['dest_txn_count'] == 0).astype(int)

        # Type encoding (fast & vectorized)
        X['type_encoded'] = X['type'].map(self.type_map).fillna(-1).astype(int)

        # Drop identifiers and non-numeric columns
        for c in ['nameOrig', 'nameDest', 'type', 'isFlaggedFraud', 'isFraud']:
            if c in X.columns:
                X.drop(columns=c, inplace=True)

        # Return numeric-only DataFrame expected by XGBoost & SHAP
        return X.select_dtypes(include=[np.number])

