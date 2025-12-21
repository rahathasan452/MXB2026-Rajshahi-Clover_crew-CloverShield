"""
CloverShield - Redesigned Analyst-Centric Fraud Detection Platform
Analyst-first fraud intelligence system with human-readable explanations
"""

import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
import json
from datetime import datetime, timedelta
import os
import sys
import base64

# Load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv()
    load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))
except ImportError:
    pass

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from config import TRANSLATIONS, RISK_THRESHOLDS, MODEL_CONFIG, THEME, DEMO_ANALYTICS
    from mock_data import mock_db, create_transaction_dataframe
except ImportError:
    st.error("Configuration files not found.")
    st.stop()

# Model imports
try:
    import joblib
    MODEL_AVAILABLE = True
except ImportError:
    MODEL_AVAILABLE = False

try:
    from feature_engineering import FraudFeatureEngineer
    import types
    if '__main__' not in sys.modules:
        sys.modules['__main__'] = types.ModuleType('__main__')
    setattr(sys.modules['__main__'], 'FraudFeatureEngineer', FraudFeatureEngineer)
except ImportError:
    from sklearn.base import BaseEstimator, TransformerMixin
    import types
    
    class FraudFeatureEngineer(BaseEstimator, TransformerMixin):
        def fit(self, X, y=None):
            return self
        def transform(self, X):
            return X
    
    if '__main__' not in sys.modules:
        sys.modules['__main__'] = types.ModuleType('__main__')
    setattr(sys.modules['__main__'], 'FraudFeatureEngineer', FraudFeatureEngineer)

try:
    from inference import load_inference_engine, FraudInference
    INFERENCE_AVAILABLE = True
except ImportError:
    INFERENCE_AVAILABLE = False

# Logo path
LOGO_FILENAME = "1766264240252.png"
LOGO_PATHS = [
    os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", LOGO_FILENAME),
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", LOGO_FILENAME),
    os.path.join("assets", LOGO_FILENAME),
]

LOGO_PATH = None
for path in LOGO_PATHS:
    if os.path.exists(path):
        LOGO_PATH = path
        break

# Page configuration
page_icon = LOGO_PATH if (LOGO_PATH and os.path.exists(LOGO_PATH)) else None
st.set_page_config(
    page_title="CloverShield - Fraud Detection",
    page_icon=page_icon,
    layout="wide",
    initial_sidebar_state="expanded"
)

# ============================================================================
# FEATURE NAME MAPPING - Human-readable labels for technical features
# ============================================================================

FEATURE_NAME_MAP = {
    # Amount features
    'amount': 'Transaction Amount',
    'amount_log1p': 'Transaction Amount (log scale)',
    'amt_ratio_to_user_mean': 'Amount vs User Average',
    'amt_ratio_to_user_median': 'Amount vs User Median',
    'amount_over_oldBalanceOrig': 'Amount as % of Balance',
    'amt_log_ratio_to_user_median': 'Amount Deviation (log)',
    
    # Transaction behavior
    'orig_txn_count': 'Sender Transaction Frequency',
    'dest_txn_count': 'Receiver Transaction Frequency',
    'type_encoded': 'Transaction Type',
    
    # Network features
    'in_degree': 'Receiver Network Connections',
    'out_degree': 'Sender Network Connections',
    'network_trust': 'Network Trust Score',
    
    # Account features
    'is_new_origin': 'New Sender Account',
    'is_new_dest': 'New Receiver Account',
    
    # Balance features
    'oldBalanceOrig': 'Sender Balance Before',
    'newBalanceOrig': 'Sender Balance After',
    'oldBalanceDest': 'Receiver Balance Before',
    'newBalanceDest': 'Receiver Balance After',
    
    # Time features
    'hour': 'Transaction Hour',
    'step': 'Time Step',
}

# Risk driver categories
RISK_CATEGORIES = {
    'transaction_behavior': {
        'name': 'Transaction Behavior',
        'icon': '💸',
        'features': ['amount', 'amount_log1p', 'amount_over_oldBalanceOrig', 'amt_ratio_to_user_mean', 
                    'amt_ratio_to_user_median', 'type_encoded']
    },
    'account_history': {
        'name': 'Account History',
        'icon': '📊',
        'features': ['orig_txn_count', 'dest_txn_count', 'is_new_origin', 'is_new_dest']
    },
    'counterparty_risk': {
        'name': 'Counterparty Risk',
        'icon': '👤',
        'features': ['network_trust', 'in_degree', 'out_degree', 'oldBalanceDest', 'newBalanceDest']
    },
    'temporal_patterns': {
        'name': 'Temporal Patterns',
        'icon': '⏰',
        'features': ['hour', 'step']
    },
    'balance_anomalies': {
        'name': 'Balance Anomalies',
        'icon': '💰',
        'features': ['oldBalanceOrig', 'newBalanceOrig', 'oldBalanceDest', 'newBalanceDest']
    }
}

# ============================================================================
# SEMANTIC COLOR SYSTEM
# ============================================================================

SEMANTIC_COLORS = {
    'neutral': '#3B82F6',      # Blue - Neutral/Approved
    'caution': '#F59E0B',       # Amber - Review/Caution
    'high_risk': '#EF4444',     # Red - High Risk
    'success': '#10B981',       # Green - Success/Pass
    'info': '#6366F1',          # Indigo - Information
    'warning': '#F59E0B',       # Amber - Warning
    'danger': '#EF4444',        # Red - Danger
}

# ============================================================================
# CUSTOM CSS - Redesigned with semantic colors and better hierarchy
# ============================================================================

def load_custom_css():
    st.markdown(f"""
    <style>
    /* Main theme */
    .stApp {{
        background: linear-gradient(135deg, {THEME['dark_bg']} 0%, #1a1a2e 100%);
    }}
    
    /* Headers */
    h1, h2, h3 {{
        color: {THEME['text_primary']} !important;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }}
    
    /* Header Section - Redesigned */
    .main-header {{
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
        border-radius: 0 0 24px 24px;
        padding: 30px 20px;
        margin: -1rem -1rem 2rem -1rem;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        border-bottom: 3px solid {SEMANTIC_COLORS['success']};
    }}
    
    .header-content {{
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 30px;
        flex-wrap: wrap;
    }}
    
    .header-logo-container {{
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
    }}
    
    .header-logo-container img {{
        filter: drop-shadow(0 4px 8px rgba(16, 185, 129, 0.3));
        transition: transform 0.3s ease;
    }}
    
    .header-logo-container img:hover {{
        transform: scale(1.05);
    }}
    
    .header-text {{
        flex: 1;
        text-align: center;
        min-width: 300px;
    }}
    
    .header-title {{
        font-size: 2.5rem;
        font-weight: 700;
        margin: 0;
        background: linear-gradient(135deg, #ffffff 0%, {SEMANTIC_COLORS['success']} 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        text-shadow: 0 2px 10px rgba(16, 185, 129, 0.2);
    }}
    
    .header-subtitle {{
        font-size: 1.3rem;
        color: {THEME['text_primary']};
        margin: 8px 0;
        font-weight: 500;
    }}
    
    .header-subtitle-bengali {{
        font-size: 1.1rem;
        color: {THEME['text_secondary']};
        margin: 4px 0;
        font-weight: 400;
    }}
    
    .header-tagline {{
        font-size: 0.95rem;
        color: {SEMANTIC_COLORS['success']};
        margin: 8px 0 0 0;
        font-style: italic;
        opacity: 0.9;
    }}
    
    @media (max-width: 768px) {{
        .header-content {{
            flex-direction: column;
            gap: 20px;
        }}
        
        .header-title {{
            font-size: 2rem;
        }}
        
        .header-subtitle {{
            font-size: 1.1rem;
        }}
    }}
    
    /* Decision Card - Unified */
    .decision-card {{
        background: {THEME['card_bg']};
        border-radius: 16px;
        padding: 30px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        border: 2px solid;
        margin: 20px 0;
        transition: all 0.3s ease;
    }}
    
    .decision-card.pass {{
        border-color: {SEMANTIC_COLORS['success']};
        box-shadow: 0 8px 32px rgba(16, 185, 129, 0.2);
    }}
    
    .decision-card.warn {{
        border-color: {SEMANTIC_COLORS['caution']};
        box-shadow: 0 8px 32px rgba(245, 158, 11, 0.2);
    }}
    
    .decision-card.block {{
        border-color: {SEMANTIC_COLORS['high_risk']};
        box-shadow: 0 8px 32px rgba(239, 68, 68, 0.3);
    }}
    
    /* Risk Driver Cards */
    .risk-driver-card {{
        background: {THEME['card_bg']};
        border-radius: 12px;
        padding: 20px;
        margin: 10px 0;
        border-left: 4px solid;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        transition: transform 0.2s;
    }}
    
    .risk-driver-card:hover {{
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
    }}
    
    .risk-driver-card.strong {{
        border-left-color: {SEMANTIC_COLORS['high_risk']};
    }}
    
    .risk-driver-card.moderate {{
        border-left-color: {SEMANTIC_COLORS['caution']};
    }}
    
    .risk-driver-card.weak {{
        border-left-color: {SEMANTIC_COLORS['neutral']};
    }}
    
    /* Info boxes */
    .info-box {{
        background: rgba(59, 130, 246, 0.1);
        border-left: 4px solid {SEMANTIC_COLORS['neutral']};
        padding: 15px;
        border-radius: 8px;
        margin: 10px 0;
    }}
    
    /* Action buttons */
    .action-button {{
        background: linear-gradient(90deg, {SEMANTIC_COLORS['neutral']} 0%, #2563EB 100%);
        color: white;
        font-weight: bold;
        border: none;
        border-radius: 8px;
        padding: 12px 24px;
        margin: 5px;
        cursor: pointer;
        transition: all 0.3s;
    }}
    
    .action-button:hover {{
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
    }}
    
    .action-button.danger {{
        background: linear-gradient(90deg, {SEMANTIC_COLORS['high_risk']} 0%, #DC2626 100%);
    }}
    
    .action-button.warning {{
        background: linear-gradient(90deg, {SEMANTIC_COLORS['caution']} 0%, #D97706 100%);
    }}
    
    /* Badge styles */
    .badge {{
        display: inline-block;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: bold;
        margin: 2px;
    }}
    
    .badge.trust-high {{
        background: rgba(16, 185, 129, 0.2);
        color: {SEMANTIC_COLORS['success']};
    }}
    
    .badge.trust-medium {{
        background: rgba(245, 158, 11, 0.2);
        color: {SEMANTIC_COLORS['caution']};
    }}
    
    .badge.trust-low {{
        background: rgba(239, 68, 68, 0.2);
        color: {SEMANTIC_COLORS['high_risk']};
    }}
    
    /* Confidence indicator */
    .confidence-indicator {{
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        border-radius: 20px;
        background: rgba(99, 102, 241, 0.1);
        border: 1px solid {SEMANTIC_COLORS['info']};
    }}
    
    /* Animations */
    @keyframes fadeIn {{
        from {{ opacity: 0; transform: translateY(-10px); }}
        to {{ opacity: 1; transform: translateY(0); }}
    }}
    
    .fade-in {{
        animation: fadeIn 0.5s ease-in;
    }}
    
    /* Transaction Input Section - Redesigned */
    .transaction-input-container {{
        background: linear-gradient(135deg, {THEME['card_bg']} 0%, rgba(30, 41, 59, 0.8) 100%);
        border-radius: 20px;
        padding: 30px;
        margin: 20px 0;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(59, 130, 246, 0.2);
    }}
    
    .transaction-input-title {{
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 25px;
        padding-bottom: 15px;
        border-bottom: 2px solid rgba(59, 130, 246, 0.3);
    }}
    
    .transaction-input-title h2 {{
        margin: 0;
        font-size: 1.8rem;
        background: linear-gradient(135deg, #ffffff 0%, {SEMANTIC_COLORS['neutral']} 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }}
    
    .transaction-input-title .icon {{
        font-size: 2rem;
        filter: drop-shadow(0 2px 4px rgba(59, 130, 246, 0.4));
    }}
    
    .input-field-wrapper {{
        margin-bottom: 15px;
    }}
    
    .input-field-wrapper label {{
        font-size: 0.9rem;
        font-weight: 600;
        color: {THEME['text_secondary']};
        text-transform: uppercase;
        letter-spacing: 0.5px;
        display: block;
        margin-bottom: 8px;
    }}
    
    .analyze-button-container {{
        margin-top: 10px;
    }}
    
    /* Style Streamlit selectbox and number input within container */
    .transaction-input-container .stSelectbox,
    .transaction-input-container .stNumberInput {{
        margin-top: 0;
    }}
    
    /* Improve input field styling */
    .transaction-input-container div[data-baseweb="select"],
    .transaction-input-container div[data-baseweb="input"] {{
        border-radius: 8px;
    }}
    
    /* Redesigned Transaction Input - Mobile First */
    .txn-form-field {{
        margin-bottom: 24px;
    }}
    
    .txn-form-label {{
        font-size: 0.875rem;
        font-weight: 600;
        color: {THEME['text_secondary']};
        margin-bottom: 8px;
        display: block;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }}
    
    .balance-display {{
        background: rgba(16, 185, 129, 0.1);
        border: 1px solid rgba(16, 185, 129, 0.3);
        border-radius: 12px;
        padding: 14px 18px;
        margin-top: 10px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }}
    
    .balance-label {{
        font-size: 0.875rem;
        color: {THEME['text_secondary']};
        font-weight: 500;
    }}
    
    .balance-amount {{
        font-size: 1.25rem;
        font-weight: 700;
        color: {SEMANTIC_COLORS['success']};
    }}
    
    /* Segmented Control Styling */
    .segmented-control {{
        display: flex;
        background: rgba(30, 41, 59, 0.5);
        border-radius: 12px;
        padding: 4px;
        gap: 4px;
        margin-top: 8px;
    }}
    
    .segmented-control button {{
        flex: 1;
        border-radius: 8px;
        border: none;
        padding: 12px 16px;
        font-weight: 600;
        transition: all 0.2s ease;
        min-height: 44px;
    }}
    
    .segmented-control button[kind="primary"] {{
        background: {SEMANTIC_COLORS['neutral']};
        color: white;
        box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
    }}
    
    .segmented-control button[kind="secondary"] {{
        background: transparent;
        color: {THEME['text_secondary']};
    }}
    
    .segmented-control button[kind="secondary"]:hover {{
        background: rgba(255, 255, 255, 0.05);
        color: {THEME['text_primary']};
    }}
    
    /* Recent Receivers Chips */
    .recent-receivers {{
        margin-bottom: 12px;
    }}
    
    .recent-receivers button {{
        background: rgba(59, 130, 246, 0.1);
        border: 1px solid rgba(59, 130, 246, 0.3);
        color: {SEMANTIC_COLORS['neutral']};
        border-radius: 8px;
        padding: 8px 12px;
        font-size: 0.875rem;
        font-weight: 500;
        min-height: 44px;
    }}
    
    .recent-receivers button:hover {{
        background: rgba(59, 130, 246, 0.2);
        border-color: {SEMANTIC_COLORS['neutral']};
    }}
    
    /* Amount Presets */
    .amount-presets {{
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
        margin-bottom: 12px;
    }}
    
    .amount-presets button {{
        background: rgba(59, 130, 246, 0.1);
        border: 1px solid rgba(59, 130, 246, 0.3);
        color: {SEMANTIC_COLORS['neutral']};
        border-radius: 8px;
        padding: 10px;
        font-size: 0.875rem;
        font-weight: 600;
        min-height: 44px;
        transition: all 0.2s ease;
    }}
    
    .amount-presets button:hover {{
        background: rgba(59, 130, 246, 0.2);
        border-color: {SEMANTIC_COLORS['neutral']};
        transform: translateY(-1px);
    }}
    
    /* Account Info Display */
    .account-info {{
        background: rgba(99, 102, 241, 0.1);
        border: 1px solid rgba(99, 102, 241, 0.2);
        border-radius: 8px;
        padding: 10px 14px;
        margin-top: 8px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }}
    
    .account-name {{
        font-size: 0.9rem;
        font-weight: 600;
        color: {THEME['text_primary']};
    }}
    
    .account-id-masked {{
        font-size: 0.85rem;
        color: {THEME['text_secondary']};
        font-family: monospace;
    }}
    
    /* Trust Signals */
    .trust-signal {{
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 12px;
        padding: 10px;
        background: rgba(16, 185, 129, 0.1);
        border-radius: 8px;
        border-left: 3px solid {SEMANTIC_COLORS['success']};
    }}
    
    .trust-signal-icon {{
        font-size: 1.2rem;
    }}
    
    .trust-signal-text {{
        font-size: 0.875rem;
        color: {SEMANTIC_COLORS['success']};
        font-weight: 500;
    }}
    
    /* Enhanced Input Styling */
    .transaction-input-container input[type="number"],
    .transaction-input-container .stSelectbox > div {{
        background: rgba(30, 41, 59, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 12px 16px;
        color: {THEME['text_primary']};
        font-size: 1rem;
        min-height: 44px;
    }}
    
    .transaction-input-container input[type="number"]:focus,
    .transaction-input-container .stSelectbox > div:focus-within {{
        border-color: {SEMANTIC_COLORS['neutral']};
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        outline: none;
    }}
    
    /* Note Field */
    .note-field {{
        margin-top: 8px;
    }}
    
    .note-field textarea {{
        background: rgba(30, 41, 59, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 12px 16px;
        color: {THEME['text_primary']};
        font-size: 0.9rem;
        min-height: 80px;
        resize: vertical;
        width: 100%;
        font-family: inherit;
    }}
    
    .note-field textarea:focus {{
        border-color: {SEMANTIC_COLORS['neutral']};
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        outline: none;
    }}
    
    /* Mobile Responsive */
    @media (max-width: 768px) {{
        .transaction-input-container {{
            padding: 20px;
            border-radius: 16px;
        }}
        
        .amount-presets {{
            grid-template-columns: repeat(2, 1fr);
        }}
        
        .segmented-control {{
            flex-direction: column;
        }}
        
        .balance-display {{
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
        }}
    }}
    
    /* Segmented Control */
    .segmented-control {{
        display: flex;
        background: rgba(30, 41, 59, 0.5);
        border-radius: 10px;
        padding: 4px;
        gap: 4px;
    }}
    
    .segmented-option {{
        flex: 1;
        padding: 12px 16px;
        text-align: center;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
        font-weight: 500;
        color: {THEME['text_secondary']};
        background: transparent;
        border: none;
    }}
    
    .segmented-option.active {{
        background: {SEMANTIC_COLORS['neutral']};
        color: white;
        box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
    }}
    
    /* Amount Presets */
    .amount-presets {{
        display: flex;
        gap: 8px;
        margin-top: 8px;
        flex-wrap: wrap;
    }}
    
    .amount-preset-btn {{
        flex: 1;
        min-width: 80px;
        padding: 10px 16px;
        background: rgba(30, 41, 59, 0.5);
        border: 1px solid rgba(59, 130, 246, 0.3);
        border-radius: 8px;
        color: {THEME['text_primary']};
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        text-align: center;
    }}
    
    .amount-preset-btn:hover {{
        background: rgba(59, 130, 246, 0.2);
        border-color: {SEMANTIC_COLORS['neutral']};
    }}
    
    .amount-preset-btn.active {{
        background: {SEMANTIC_COLORS['neutral']};
        border-color: {SEMANTIC_COLORS['neutral']};
        color: white;
    }}
    
    /* Account Selector */
    .account-selector {{
        position: relative;
    }}
    
    .account-info {{
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: rgba(30, 41, 59, 0.5);
        border-radius: 8px;
        margin-top: 8px;
    }}
    
    .account-name {{
        font-weight: 600;
        color: {THEME['text_primary']};
    }}
    
    .account-id-masked {{
        font-size: 0.875rem;
        color: {THEME['text_secondary']};
        font-family: monospace;
    }}
    
    /* Recent Receivers */
    .recent-receivers {{
        display: flex;
        gap: 8px;
        margin-top: 8px;
        flex-wrap: wrap;
    }}
    
    .recent-receiver-chip {{
        padding: 8px 12px;
        background: rgba(30, 41, 59, 0.5);
        border: 1px solid rgba(59, 130, 246, 0.3);
        border-radius: 20px;
        font-size: 0.875rem;
        color: {THEME['text_primary']};
        cursor: pointer;
        transition: all 0.2s;
    }}
    
    .recent-receiver-chip:hover {{
        background: rgba(59, 130, 246, 0.2);
        border-color: {SEMANTIC_COLORS['neutral']};
    }}
    
    /* Error Messages */
    .field-error {{
        color: {SEMANTIC_COLORS['high_risk']};
        font-size: 0.875rem;
        margin-top: 4px;
        display: block;
    }}
    
    /* Confirmation Modal */
    .confirmation-modal {{
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        backdrop-filter: blur(4px);
    }}
    
    .modal-content {{
        background: {THEME['card_bg']};
        border-radius: 16px;
        padding: 30px;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(59, 130, 246, 0.3);
    }}
    
    .modal-header {{
        margin-bottom: 20px;
    }}
    
    .modal-title {{
        font-size: 1.5rem;
        font-weight: 700;
        color: {THEME['text_primary']};
        margin-bottom: 8px;
    }}
    
    .summary-item {{
        display: flex;
        justify-content: space-between;
        padding: 12px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }}
    
    .summary-label {{
        color: {THEME['text_secondary']};
        font-size: 0.875rem;
    }}
    
    .summary-value {{
        color: {THEME['text_primary']};
        font-weight: 600;
        text-align: right;
    }}
    
    .modal-actions {{
        display: flex;
        gap: 12px;
        margin-top: 24px;
    }}
    
    /* Mobile Responsive */
    @media (max-width: 768px) {{
        .transaction-input-container {{
            padding: 20px;
        }}
        
        .amount-presets {{
            flex-direction: column;
        }}
        
        .amount-preset-btn {{
            width: 100%;
        }}
        
        .modal-content {{
            padding: 20px;
            margin: 20px;
        }}
    }}
    </style>
    """, unsafe_allow_html=True)

# ============================================================================
# HELPER FUNCTIONS FOR REDESIGNED TRANSACTION INPUT
# ============================================================================

def mask_account_number(account_id, show_last=4):
    """Mask account number showing only last N digits"""
    if len(account_id) <= show_last:
        return account_id
    return "****" + account_id[-show_last:]

def format_currency(amount, lang='en'):
    """Format currency with proper symbol and commas"""
    formatted = f"৳ {amount:,.0f}"
    return formatted

def get_recent_receivers(sender_id, limit=3):
    """Get recent receivers for autocomplete (mock implementation)"""
    all_users = mock_db.get_all_users()
    receivers = [u for u in all_users if u['user_id'] != sender_id]
    # In real app, this would query transaction history
    return receivers[:limit]

def validate_transaction(sender_id, receiver_id, amount, sender_balance):
    """Validate transaction inputs"""
    errors = []
    
    if not sender_id or not receiver_id:
        errors.append(get_text('field_required'))
    
    if sender_id == receiver_id:
        errors.append(get_text('same_account_error'))
    
    if amount <= 0:
        errors.append(get_text('amount_invalid'))
    elif amount > sender_balance:
        errors.append(get_text('amount_too_large'))
    
    return errors

# ============================================================================
# SESSION STATE INITIALIZATION
# ============================================================================

def init_session_state():
    if 'language' not in st.session_state:
        st.session_state.language = 'en'
    if 'money_saved' not in st.session_state:
        st.session_state.money_saved = DEMO_ANALYTICS['money_saved']
    if 'transactions_processed' not in st.session_state:
        st.session_state.transactions_processed = DEMO_ANALYTICS['transactions_processed']
    if 'fraud_detected' not in st.session_state:
        st.session_state.fraud_detected = DEMO_ANALYTICS['fraud_detected']
    if 'show_payload' not in st.session_state:
        st.session_state.show_payload = False
    if 'ml_model' not in st.session_state:
        st.session_state.ml_model = None
    if 'inference_engine' not in st.session_state:
        st.session_state.inference_engine = None
    if 'shap_background' not in st.session_state:
        st.session_state.shap_background = None
    if 'shap_table' not in st.session_state:
        st.session_state.shap_table = None
    if 'llm_explanation' not in st.session_state:
        st.session_state.llm_explanation = None
    if 'model_load_attempted' not in st.session_state:
        st.session_state.model_load_attempted = False
    if 'case_history' not in st.session_state:
        st.session_state.case_history = []
    if 'flagged_accounts' not in st.session_state:
        st.session_state.flagged_accounts = set()
    
    if MODEL_AVAILABLE and not st.session_state.model_load_attempted:
        st.session_state.model_load_attempted = True
        load_ml_model()

def load_ml_model():
    """Load the ML model pipeline and inference engine"""
    try:
        if INFERENCE_AVAILABLE:
            try:
                groq_key = os.getenv('GROQ_API_KEY')
                st.session_state.inference_engine = load_inference_engine(
                    model_path=MODEL_CONFIG['model_path'],
                    threshold=MODEL_CONFIG['default_threshold'],
                    groq_api_key=groq_key
                )
                if st.session_state.inference_engine and st.session_state.inference_engine.pipeline:
                    st.session_state.ml_model = st.session_state.inference_engine.pipeline
                return
            except Exception as e:
                pass
        
        paths = [
            MODEL_CONFIG['model_path'],
            MODEL_CONFIG['fallback_model_path'],
            'fraud_pipeline_final.pkl',
            '../fraud_pipeline_final.pkl'
        ]
        
        for path in paths:
            if os.path.exists(path):
                st.session_state.ml_model = joblib.load(path)
                return
        
    except Exception as e:
        pass

def get_text(key):
    """Get translated text"""
    return TRANSLATIONS[st.session_state.language].get(key, key)

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_human_readable_feature_name(feature_name):
    """Convert technical feature name to human-readable label"""
    return FEATURE_NAME_MAP.get(feature_name, feature_name.replace('_', ' ').title())

def categorize_risk_driver(feature_name, shap_value):
    """Categorize risk driver by strength"""
    abs_shap = abs(shap_value)
    if abs_shap > 0.3:
        return 'strong'  # Maps to .risk-driver-card.strong CSS class
    elif abs_shap > 0.1:
        return 'moderate'  # Maps to .risk-driver-card.moderate CSS class
    else:
        return 'weak'  # Maps to .risk-driver-card.weak CSS class

def get_risk_category(feature_name):
    """Get the category for a feature"""
    for cat_key, cat_info in RISK_CATEGORIES.items():
        if feature_name in cat_info['features']:
            return cat_key, cat_info
    return None, None

def format_risk_driver_description(feature_name, shap_value, feature_value):
    """Create human-readable description of risk driver"""
    human_name = get_human_readable_feature_name(feature_name)
    direction = "increases" if shap_value > 0 else "decreases"
    
    # Special formatting for specific features
    if feature_name == 'amount_over_oldBalanceOrig':
        ratio = feature_value * 100
        return f"Transaction amount is {ratio:.1f}% of account balance ({direction} risk)"
    elif feature_name == 'amt_ratio_to_user_mean':
        return f"Amount is {feature_value:.1f}x user's typical transaction ({direction} risk)"
    elif feature_name == 'type_encoded':
        txn_type = "Cash Out" if feature_value == 1 else "Transfer"
        return f"{txn_type} transaction type ({direction} risk)"
    elif feature_name == 'is_new_origin' and feature_value == 1:
        return f"New sender account ({direction} risk)"
    elif feature_name == 'is_new_dest' and feature_value == 1:
        return f"New receiver account ({direction} risk)"
    elif feature_name == 'hour':
        return f"Transaction at {int(feature_value)}:00 ({direction} risk)"
    else:
        return f"{human_name} ({direction} risk)"

def calculate_confidence(probability):
    """Calculate confidence level based on probability"""
    if probability < 0.1 or probability > 0.9:
        return "High", 0.9
    elif probability < 0.2 or probability > 0.8:
        return "Medium-High", 0.75
    elif probability < 0.3 or probability > 0.7:
        return "Medium", 0.6
    else:
        return "Low", 0.4

def get_counterparty_trust(receiver_id, sender_id):
    """Calculate counterparty trust score"""
    # Mock implementation - in real system, would check transaction history
    receiver_data = mock_db.get_user(receiver_id)
    if not receiver_data:
        return "Unknown", 0.0
    
    # Simple trust calculation based on account age and verification
    trust_score = 0.5
    if receiver_data.get('verified'):
        trust_score += 0.2
    if receiver_data.get('kyc_complete'):
        trust_score += 0.2
    if receiver_data.get('account_age_days', 0) > 180:
        trust_score += 0.1
    
    if trust_score >= 0.8:
        return "High", trust_score
    elif trust_score >= 0.5:
        return "Medium", trust_score
    else:
        return "Low", trust_score

def get_historical_flags(user_id):
    """Get historical flagging information"""
    # Mock implementation
    flags = []
    if user_id in st.session_state.flagged_accounts:
        flags.append({
            'date': (datetime.now() - timedelta(days=5)).strftime('%Y-%m-%d'),
            'reason': 'Suspicious transaction pattern',
            'outcome': 'Under review'
        })
    return flags

# ============================================================================
# VISUALIZATION COMPONENTS
# ============================================================================

def create_compact_gauge_chart(value, title):
    """Create a compact gauge chart"""
    fig = go.Figure(go.Indicator(
        mode="gauge+number",
        value=value * 100,
        domain={'x': [0, 1], 'y': [0, 1]},
        title={'text': title, 'font': {'size': 16}},
        number={'suffix': "%", 'font': {'size': 32}},
        gauge={
            'axis': {'range': [None, 100]},
            'bar': {'color': SEMANTIC_COLORS['neutral']},
            'steps': [
                {'range': [0, 30], 'color': SEMANTIC_COLORS['success']},
                {'range': [30, 70], 'color': SEMANTIC_COLORS['caution']},
                {'range': [70, 100], 'color': SEMANTIC_COLORS['high_risk']}
            ],
            'threshold': {
                'line': {'color': "red", 'width': 3},
                'thickness': 0.75,
                'value': MODEL_CONFIG['default_threshold'] * 100
            }
        }
    ))
    
    fig.update_layout(
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        font={'color': THEME['text_primary']},
        height=200,
        margin=dict(l=20, r=20, t=40, b=20)
    )
    
    return fig

# ============================================================================
# RENDERING FUNCTIONS - REDESIGNED
# ============================================================================

def render_decision_zone(probability, decision, risk_level):
    """Render unified Decision Zone card"""
    decision_class = decision  # pass, warn, block
    
    # Get recommended action
    if decision == 'pass':
        action_text = "APPROVE TRANSACTION"
        action_color = SEMANTIC_COLORS['success']
    elif decision == 'warn':
        action_text = "REQUIRES MANUAL REVIEW"
        action_color = SEMANTIC_COLORS['caution']
    else:
        action_text = "BLOCK TRANSACTION"
        action_color = SEMANTIC_COLORS['high_risk']
    
    # Calculate confidence
    confidence_level, confidence_score = calculate_confidence(probability)
    
    st.markdown(f"""
    <div class="decision-card {decision_class} fade-in">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="margin: 0; color: {THEME['text_primary']};">Fraud Risk Assessment</h2>
            <div class="confidence-indicator">
                <span>Confidence: {confidence_level}</span>
            </div>
        </div>
        <div style="text-align: center; margin: 30px 0;">
            <h1 style="font-size: 48px; margin: 10px 0; color: {action_color};">{probability*100:.1f}%</h1>
            <h3 style="margin: 10px 0; color: {action_color};">{action_text}</h3>
            <p style="color: {THEME['text_secondary']}; margin-top: 10px;">Risk Level: {risk_level.upper()}</p>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    # Compact gauge
    gauge_fig = create_compact_gauge_chart(probability, "Fraud Probability")
    st.plotly_chart(gauge_fig, use_container_width=True)

def render_risk_drivers(shap_table, transaction_df, sender_data):
    """Render human-readable Top Risk Drivers"""
    if shap_table is None or len(shap_table) == 0:
        return
    
    st.markdown("### Top Risk Drivers")
    
    # Process SHAP values into risk drivers
    risk_drivers = []
    for _, row in shap_table.head(10).iterrows():
        feature = row['feature']
        shap_val = row['shap']
        value = row['value']
        
        if abs(shap_val) > 0.05:  # Only significant contributors
            strength = categorize_risk_driver(feature, shap_val)
            category_key, category_info = get_risk_category(feature)
            description = format_risk_driver_description(feature, shap_val, value)
            
            risk_drivers.append({
                'feature': feature,
                'description': description,
                'strength': strength,
                'shap_value': shap_val,
                'category': category_key,
                'category_name': category_info['name'] if category_info else 'Other',
                'category_icon': category_info['icon'] if category_info else '📋'
            })
    
    # Group by category
    categories = {}
    for driver in risk_drivers:
        cat = driver['category_name']
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(driver)
    
    # Render by category
    for category_name, drivers in categories.items():
        st.markdown(f"#### {drivers[0]['category_icon']} {category_name}")
        for driver in drivers:
            strength_class = driver['strength']
            direction_icon = "↑" if driver['shap_value'] > 0 else "↓"
            
            st.markdown(f"""
            <div class="risk-driver-card {strength_class}">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>{direction_icon} {driver['description']}</strong>
                        <div style="color: {THEME['text_secondary']}; font-size: 12px; margin-top: 5px;">
                            Impact: {abs(driver['shap_value']):.3f}
                        </div>
                    </div>
                    <span class="badge trust-{strength_class}" style="text-transform: capitalize;">
                        {strength_class.title()}
                    </span>
                </div>
            </div>
            """, unsafe_allow_html=True)

def render_analyst_checklist(probability, decision, reasons):
    """Render analyst checklist"""
    st.markdown("### Analyst Checklist")
    
    checklist_items = []
    
    if decision == 'block':
        checklist_items.append("✓ Verify account balance and transaction history")
        checklist_items.append("✓ Check for similar flagged transactions")
        checklist_items.append("✓ Contact account holder if necessary")
        checklist_items.append("✓ Document decision in case management system")
    elif decision == 'warn':
        checklist_items.append("✓ Review transaction details carefully")
        checklist_items.append("✓ Check account verification status")
        checklist_items.append("✓ Monitor for follow-up transactions")
        checklist_items.append("✓ Escalate if pattern continues")
    else:
        checklist_items.append("✓ Transaction appears normal")
        checklist_items.append("✓ No immediate action required")
    
    for item in checklist_items:
        st.markdown(f"- {item}")

def render_counterparty_info(receiver_id, sender_id):
    """Render counterparty trust profile"""
    trust_level, trust_score = get_counterparty_trust(receiver_id, sender_id)
    receiver_data = mock_db.get_user(receiver_id)
    
    if not receiver_data:
        return
    
    trust_class = "high" if trust_level == "High" else ("medium" if trust_level == "Medium" else "low")
    
    st.markdown("### Counterparty Trust Profile")
    st.markdown(f"""
    <div class="info-box">
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
                <strong>Receiver:</strong> {receiver_data.get('name_en', receiver_id)}<br>
                <strong>Account Age:</strong> {receiver_data.get('account_age_days', 0)} days<br>
                <strong>Total Transactions:</strong> {receiver_data.get('total_transactions', 0)}<br>
                <strong>Verified:</strong> {'Yes' if receiver_data.get('verified') else 'No'}
            </div>
            <div>
                <span class="badge trust-{trust_class}">Trust: {trust_level}</span>
                <div style="margin-top: 10px; font-size: 24px; font-weight: bold; color: {SEMANTIC_COLORS.get('neutral', '#3B82F6')};">
                    {trust_score*100:.0f}%
                </div>
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)

def render_historical_flags(user_id):
    """Render historical flagging information"""
    flags = get_historical_flags(user_id)
    
    if not flags:
        return
    
    st.markdown("### Historical Flags")
    for flag in flags:
        st.markdown(f"""
        <div class="info-box">
            <strong>{flag['date']}</strong>: {flag['reason']}<br>
            <span style="color: {THEME['text_secondary']};">Outcome: {flag['outcome']}</span>
        </div>
        """, unsafe_allow_html=True)

def render_analyst_actions(transaction_id, decision, user_id):
    """Render one-click analyst actions"""
    st.markdown("### Analyst Actions")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        if st.button("📋 Create Case", use_container_width=True, key="create_case"):
            case_id = f"CASE-{datetime.now().strftime('%Y%m%d%H%M%S')}"
            st.session_state.case_history.append({
                'id': case_id,
                'transaction_id': transaction_id,
                'user_id': user_id,
                'decision': decision,
                'created': datetime.now().isoformat()
            })
            st.success(f"Case {case_id} created")
    
    with col2:
        if st.button("🚩 Flag Account", use_container_width=True, key="flag_account"):
            st.session_state.flagged_accounts.add(user_id)
            st.warning(f"Account {user_id} flagged for review")
    
    with col3:
        if st.button("🚨 Report Fraud", use_container_width=True, key="report_fraud"):
            st.error("Fraud report submitted to security team")

def render_explanation_zone(probability, decision, reasons, shap_table, transaction_df, sender_data, receiver_id, risk_level):
    """Render tabbed Explanation Zone"""
    tab1, tab2, tab3, tab4 = st.tabs(["Why?", "Evidence", "Technical", "Developer"])
    
    with tab1:
        st.markdown("### Decision Summary")
        
        # LLM explanation if available
        if st.session_state.llm_explanation:
            st.info(st.session_state.llm_explanation)
        else:
            # Fallback explanation
            if decision == 'block':
                st.warning("This transaction has been flagged as high-risk based on multiple indicators. "
                          "The system recommends blocking this transaction and conducting further investigation.")
            elif decision == 'warn':
                st.info("This transaction shows some risk indicators that warrant manual review. "
                       "Please verify the transaction details before approval.")
            else:
                st.success("This transaction appears to be within normal parameters. "
                          "No immediate concerns detected.")
        
        # Top Risk Drivers
        render_risk_drivers(shap_table, transaction_df, sender_data)
        
        # Analyst Checklist
        render_analyst_checklist(probability, decision, reasons)
    
    with tab2:
        st.markdown("### Evidence & Context")
        
        # Counterparty info
        render_counterparty_info(receiver_id, sender_data['user_id'])
        
        # Historical flags
        render_historical_flags(sender_data['user_id'])
        
        # Transaction details
        st.markdown("### Transaction Details")
        col1, col2 = st.columns(2)
        with col1:
            st.metric("Amount", f"৳ {transaction_df['amount'].iloc[0]:,.0f}")
            st.metric("Type", transaction_df['type'].iloc[0])
        with col2:
            st.metric("Sender Balance", f"৳ {transaction_df['oldBalanceOrig'].iloc[0]:,.0f}")
            st.metric("New Balance", f"৳ {transaction_df['newBalanceOrig'].iloc[0]:,.0f}")
    
    with tab3:
        st.markdown("### Technical Details")
        st.markdown("*For advanced users and model debugging*")
        
        if shap_table is not None and len(shap_table) > 0:
            # SHAP visualization (hidden by default, shown in Technical tab)
            st.markdown("#### SHAP Feature Contributions")
            top_features = shap_table.head(10)
            
            fig = go.Figure()
            
            pos_features = top_features[top_features['shap'] > 0]
            if len(pos_features) > 0:
                fig.add_trace(go.Bar(
                    x=pos_features['shap'],
                    y=pos_features['feature'],
                    orientation='h',
                    name='Increases Risk',
                    marker_color=SEMANTIC_COLORS['high_risk'],
                ))
            
            neg_features = top_features[top_features['shap'] <= 0]
            if len(neg_features) > 0:
                fig.add_trace(go.Bar(
                    x=neg_features['shap'],
                    y=neg_features['feature'],
                    orientation='h',
                    name='Decreases Risk',
                    marker_color=SEMANTIC_COLORS['success'],
                ))
            
            fig.update_layout(
                title="SHAP Feature Contributions",
                xaxis_title="SHAP Value",
                yaxis_title="Feature",
                height=400,
                paper_bgcolor=THEME['card_bg'],
                plot_bgcolor=THEME['card_bg'],
                font={'color': THEME['text_primary']},
            )
            
            st.plotly_chart(fig, use_container_width=True)
            
            # Detailed table
            with st.expander("Detailed Feature Contributions"):
                display_table = shap_table[['feature', 'value', 'shap', 'shap_abs']].copy()
                display_table.columns = ['Feature', 'Value', 'SHAP Contribution', '|SHAP|']
                st.dataframe(display_table, use_container_width=True)
        else:
            st.info("No SHAP data available. Using rule-based detection.")
    
    with tab4:
        st.markdown("### Developer View")
        st.markdown("*API payload and technical details*")
        
        if st.button("Show/Hide Payload"):
            st.session_state.show_payload = not st.session_state.show_payload
        
        if st.session_state.show_payload:
            payload = {
                "request": {
                    "transaction_id": f"TXN{datetime.now().strftime('%Y%m%d%H%M%S')}",
                    "timestamp": datetime.now().isoformat(),
                    "sender": transaction_df['nameOrig'].iloc[0],
                    "receiver": transaction_df['nameDest'].iloc[0],
                    "amount": float(transaction_df['amount'].iloc[0]),
                    "type": transaction_df['type'].iloc[0],
                },
                "response": {
                    "fraud_probability": float(probability),
                    "decision": decision,
                    "risk_level": risk_level,
                    "processing_time_ms": 145
                }
            }
            st.json(payload)

# ============================================================================
# TRANSACTION PROCESSING
# ============================================================================

def process_transaction_ml(transaction_df, sender_data):
    """Process transaction using ML model with SHAP and LLM explanations"""
    try:
        if st.session_state.inference_engine is not None:
            try:
                shap_bg = st.session_state.shap_background
                current_language = st.session_state.get('language', 'en')
                result = st.session_state.inference_engine.predict_and_explain(
                    transaction_df,
                    shap_background=shap_bg,
                    topk=10,
                    use_llm=True,
                    language=current_language
                )
                
                probability = float(result['probabilities'][0])
                reasons = []
                shap_table = result['shap_table']
                
                for _, row in shap_table.head(5).iterrows():
                    feature = row['feature']
                    shap_val = row['shap']
                    value = row['value']
                    
                    if abs(shap_val) > 0.1:
                        direction = "increases" if shap_val > 0 else "decreases"
                        reasons.append(f"{get_human_readable_feature_name(feature)} {direction} fraud risk")
                
                if result.get('llm_explanation'):
                    st.session_state.llm_explanation = result['llm_explanation']
                else:
                    st.session_state.llm_explanation = None
                
                st.session_state.shap_table = shap_table
                
                return probability, reasons
                
            except Exception as e:
                st.session_state.shap_table = None
                st.session_state.llm_explanation = None
        
        if st.session_state.ml_model is None:
            st.session_state.shap_table = None
            st.session_state.llm_explanation = None
            return rule_based_fraud_detection(transaction_df, sender_data)
        
        st.session_state.shap_table = None
        st.session_state.llm_explanation = None
        
        probability = st.session_state.ml_model.predict_proba(transaction_df)[0, 1]
        
        reasons = []
        amount = transaction_df['amount'].iloc[0]
        balance = transaction_df['oldBalanceOrig'].iloc[0]
        
        if amount > balance * 0.5:
            reasons.append("High transaction amount relative to balance")
        if sender_data['total_transactions'] < 20:
            reasons.append("Limited transaction history")
        if transaction_df['type'].iloc[0] == 'CASH_OUT':
            reasons.append("Cash-out transaction type")
        if amount > sender_data['avg_transaction_amount'] * 2:
            reasons.append("Amount exceeds typical behavior pattern")
        
        return float(probability), reasons
        
    except Exception as e:
        st.session_state.shap_table = None
        st.session_state.llm_explanation = None
        return rule_based_fraud_detection(transaction_df, sender_data)

def rule_based_fraud_detection(transaction_df, sender_data):
    """Fallback rule-based fraud detection"""
    amount = transaction_df['amount'].iloc[0]
    txn_type = transaction_df['type'].iloc[0]
    balance = transaction_df['oldBalanceOrig'].iloc[0]
    
    risk_score = 0.0
    reasons = []
    
    if amount > balance:
        risk_score += 0.5
        reasons.append("Amount exceeds available balance")
    if amount > balance * 0.5:
        risk_score += 0.2
        reasons.append("Large transaction relative to balance")
    if amount > 50000:
        risk_score += 0.3
        reasons.append("Unusually high transaction amount")
    if sender_data['total_transactions'] < 10 and amount > 10000:
        risk_score += 0.25
        reasons.append("New account with high-value transaction")
    if sender_data['risk_level'] == 'suspicious':
        risk_score += 0.4
        reasons.append("Account flagged as suspicious")
    elif sender_data['risk_level'] == 'high':
        risk_score += 0.2
        reasons.append("High-risk account profile")
    if not sender_data['verified']:
        risk_score += 0.15
        reasons.append("Unverified account")
    if amount > sender_data['avg_transaction_amount'] * 3:
        risk_score += 0.2
        reasons.append("Amount significantly deviates from typical behavior")
    
    risk_score = min(risk_score, 1.0)
    
    return risk_score, reasons

# ============================================================================
# MAIN APPLICATION
# ============================================================================

def main():
    init_session_state()
    load_custom_css()
    
    # Header - Redesigned with proper logo placement and attractive styling
    current_lang = st.session_state.get('language', 'en')
    
    # Helper function to encode image to base64
    def get_image_base64(image_path):
        try:
            with open(image_path, "rb") as img_file:
                return base64.b64encode(img_file.read()).decode()
        except:
            return None
    
    # Create beautiful header
    # Get text content
    app_title = get_text('app_title')
    app_subtitle = get_text('app_subtitle')
    tagline = get_text('tagline')
    bengali_subtitle = TRANSLATIONS["bn"]["app_subtitle"] if current_lang == 'en' else ""
    
    # Build HTML components separately to avoid f-string nesting issues
    if LOGO_PATH and os.path.exists(LOGO_PATH):
        logo_base64 = get_image_base64(LOGO_PATH)
        if logo_base64:
            logo_html = '<img src="data:image/png;base64,' + logo_base64 + '" style="height: 120px; width: auto; filter: drop-shadow(0 4px 8px rgba(16, 185, 129, 0.3));" />'
        else:
            # Escape the path for HTML
            logo_path_escaped = LOGO_PATH.replace('"', '&quot;')
            logo_html = '<img src="' + logo_path_escaped + '" style="height: 120px; width: auto; filter: drop-shadow(0 4px 8px rgba(16, 185, 129, 0.3));" />'
        
        # Build Bengali subtitle HTML if needed
        if bengali_subtitle:
            bengali_html = '<p class="header-subtitle-bengali">' + bengali_subtitle + '</p>'
        else:
            bengali_html = ''
        
        # Build complete header HTML
        header_html = (
            '<div class="main-header">'
            '<div class="header-content">'
            '<div class="header-logo-container">' + logo_html + '</div>'
            '<div class="header-text">'
            '<h1 class="header-title">' + app_title + '</h1>'
            '<h2 class="header-subtitle">' + app_subtitle + '</h2>'
            + bengali_html +
            '<p class="header-tagline">' + tagline + '</p>'
            '</div>'
            '</div>'
            '</div>'
        )
        
        st.markdown(header_html, unsafe_allow_html=True)
    else:
        # Build Bengali subtitle HTML if needed
        if bengali_subtitle:
            bengali_html = '<p class="header-subtitle-bengali">' + bengali_subtitle + '</p>'
        else:
            bengali_html = ''
        
        # Build complete header HTML without logo
        header_html = (
            '<div class="main-header">'
            '<div class="header-content">'
            '<div class="header-text">'
            '<h1 class="header-title">' + app_title + '</h1>'
            '<h2 class="header-subtitle">' + app_subtitle + '</h2>'
            + bengali_html +
            '<p class="header-tagline">' + tagline + '</p>'
            '</div>'
            '</div>'
            '</div>'
        )
        
        st.markdown(header_html, unsafe_allow_html=True)
    
    st.markdown("<br>", unsafe_allow_html=True)
    
    # Sidebar
    with st.sidebar:
        if LOGO_PATH and os.path.exists(LOGO_PATH):
            st.image(LOGO_PATH, use_container_width=True)
            st.markdown("---")
        
        st.markdown("## Settings")
        
        language = st.radio(
            "Language / ভাষা",
            options=['en', 'bn'],
            format_func=lambda x: "English" if x == 'en' else "বাংলা",
            horizontal=True
        )
        st.session_state.language = language
        
        st.markdown("---")
        
        st.markdown("### Model Status")
        if st.session_state.inference_engine:
            st.success("ML Model + SHAP + LLM Active")
        elif st.session_state.ml_model:
            st.success("ML Model Active")
        else:
            st.warning("Rule-Based Mode")
        
        st.markdown("---")
        
        st.markdown("### Session Stats")
        st.metric("Transactions", st.session_state.transactions_processed)
        st.metric("Fraud Blocked", st.session_state.fraud_detected)
        st.metric("Money Saved", f"৳ {st.session_state.money_saved:,}")
    
    # ========================================================================
    # THREE-ZONE LAYOUT
    # ========================================================================
    
    # ZONE 1: INPUT ZONE (Redesigned - Mobile-First, User-Friendly)
    # Get all users data
    all_users = mock_db.get_all_users()
    sender_options = [f"{u['user_id']} - {u['name_en']} ({u['provider']})" for u in all_users]
    
    # Initialize form state
    if 'txn_sender_idx' not in st.session_state:
        st.session_state.txn_sender_idx = 0
    if 'txn_receiver_id' not in st.session_state:
        st.session_state.txn_receiver_id = None
    if 'txn_amount' not in st.session_state:
        st.session_state.txn_amount = 5000
    if 'txn_type' not in st.session_state:
        st.session_state.txn_type = 'CASH_OUT'
    if 'form_errors' not in st.session_state:
        st.session_state.form_errors = {}
    
    # Create styled container
    st.markdown("""
    <div class="transaction-input-container">
        <div class="transaction-input-title">
            <span class="icon">💳</span>
            <h2>{}</h2>
        </div>
    """.format(get_text('transaction_input_title')), unsafe_allow_html=True)
    
    # FIELD 1: Sender Account (with balance display)
    st.markdown('<div class="txn-form-field">', unsafe_allow_html=True)
    st.markdown('<label class="txn-form-label">👤 {}</label>'.format(get_text('sender_account')), unsafe_allow_html=True)
    
    selected_sender_idx = st.selectbox(
        "Select Sender",
        range(len(sender_options)),
        format_func=lambda i: sender_options[i],
        label_visibility="collapsed",
        key="txn_sender_select",
        index=st.session_state.txn_sender_idx
    )
    sender_data = all_users[selected_sender_idx]
    st.session_state.txn_sender_idx = selected_sender_idx
    
    # Display balance
    balance = sender_data.get('balance', 0)
    st.markdown(f"""
    <div class="balance-display">
        <span class="balance-label">{get_text('available_balance')}</span>
        <span class="balance-amount">{format_currency(balance)}</span>
    </div>
    """, unsafe_allow_html=True)
    st.markdown('</div>', unsafe_allow_html=True)
    
    # FIELD 2: Transaction Type (Segmented Control)
    st.markdown('<div class="txn-form-field">', unsafe_allow_html=True)
    st.markdown('<label class="txn-form-label">📋 {}</label>'.format(get_text('transaction_type')), unsafe_allow_html=True)
    
    # Use radio buttons styled as segmented control
    col_type1, col_type2 = st.columns(2)
    with col_type1:
        cash_out_selected = st.button(
            get_text('cash_out'),
            use_container_width=True,
            key="txn_type_cashout",
            type="primary" if st.session_state.txn_type == 'CASH_OUT' else "secondary"
        )
        if cash_out_selected:
            st.session_state.txn_type = 'CASH_OUT'
    
    with col_type2:
        transfer_selected = st.button(
            get_text('transfer'),
            use_container_width=True,
            key="txn_type_transfer",
            type="primary" if st.session_state.txn_type == 'TRANSFER' else "secondary"
        )
        if transfer_selected:
            st.session_state.txn_type = 'TRANSFER'
    
    txn_type = st.session_state.txn_type
    st.markdown('</div>', unsafe_allow_html=True)
    
    # FIELD 3: Receiver Account (with recent receivers)
    st.markdown('<div class="txn-form-field">', unsafe_allow_html=True)
    st.markdown('<label class="txn-form-label">📥 {}</label>'.format(get_text('receiver_account')), unsafe_allow_html=True)
    
    receiver_options = [u['user_id'] for u in all_users if u['user_id'] != sender_data['user_id']]
    recent_receivers = get_recent_receivers(sender_data['user_id'])
    
    # Show recent receivers as chips
    if recent_receivers:
        st.markdown('<div class="recent-receivers">', unsafe_allow_html=True)
        cols_recent = st.columns(min(len(recent_receivers), 3))
        for idx, recent in enumerate(recent_receivers[:3]):
            with cols_recent[idx]:
                if st.button(
                    mask_account_number(recent['user_id']),
                    key=f"recent_{recent['user_id']}",
                    use_container_width=True
                ):
                    # Update both the session state and the widget's internal state
                    # Streamlit stores the selected value (string), not the index
                    st.session_state.txn_receiver_id = recent['user_id']
                    st.session_state.txn_receiver_select = recent['user_id']
        st.markdown('</div>', unsafe_allow_html=True)
    
    # Receiver selectbox - use widget's key for state management
    # Streamlit stores the selected value (string) in the widget state when using key parameter
    # If txn_receiver_select exists and is a valid receiver_id, use it directly
    # Otherwise, initialize with the first option or from txn_receiver_id
    if 'txn_receiver_select' not in st.session_state:
        if st.session_state.get('txn_receiver_id') and st.session_state.txn_receiver_id in receiver_options:
            st.session_state.txn_receiver_select = st.session_state.txn_receiver_id
        else:
            st.session_state.txn_receiver_select = receiver_options[0] if receiver_options else None
    
    # Ensure the stored value is valid
    if st.session_state.txn_receiver_select not in receiver_options:
        st.session_state.txn_receiver_select = receiver_options[0] if receiver_options else None
    
    receiver_id = st.selectbox(
        "Receiver",
        receiver_options,
        label_visibility="collapsed",
        key="txn_receiver_select"
    )
    # Sync back to txn_receiver_id for use elsewhere
    st.session_state.txn_receiver_id = receiver_id
    
    # Show receiver info
    receiver_data = mock_db.get_user(receiver_id)
    if receiver_data:
        st.markdown(f"""
        <div class="account-info">
            <span class="account-name">{receiver_data.get('name_en', receiver_id)}</span>
            <span class="account-id-masked">{mask_account_number(receiver_id)}</span>
        </div>
        """, unsafe_allow_html=True)
    
    st.markdown('</div>', unsafe_allow_html=True)
    
    # FIELD 4: Amount (with presets)
    st.markdown('<div class="txn-form-field">', unsafe_allow_html=True)
    st.markdown('<label class="txn-form-label">💰 {}</label>'.format(get_text('amount')), unsafe_allow_html=True)
    
    # Amount presets
    amount_presets = [500, 1000, 5000, 10000]
    cols_preset = st.columns(4)
    preset_selected = False
    for idx, preset in enumerate(amount_presets):
        with cols_preset[idx]:
            if st.button(
                format_currency(preset),
                key=f"preset_{preset}",
                use_container_width=True
            ):
                # Update both the session state and the widget's internal state
                st.session_state.txn_amount = preset
                st.session_state.txn_amount_input = preset
                preset_selected = True
    
    # Amount input - use widget's key for state management
    if 'txn_amount_input' not in st.session_state:
        st.session_state.txn_amount_input = st.session_state.get('txn_amount', 5000)
    
    amount = st.number_input(
        "Amount",
        min_value=1,
        max_value=100000,
        value=st.session_state.txn_amount_input,
        step=100,
        label_visibility="collapsed",
        key="txn_amount_input"
    )
    # Sync back to txn_amount for use elsewhere
    st.session_state.txn_amount = amount
    
    st.markdown('</div>', unsafe_allow_html=True)
    
    # FIELD 5: Optional Note
    st.markdown('<div class="txn-form-field">', unsafe_allow_html=True)
    st.markdown('<label class="txn-form-label">📝 {}</label>'.format(get_text('optional_note')), unsafe_allow_html=True)
    
    if 'txn_note' not in st.session_state:
        st.session_state.txn_note = ""
    
    note = st.text_area(
        get_text('note_placeholder'),
        value=st.session_state.txn_note,
        max_chars=200,
        label_visibility="collapsed",
        key="txn_note_input",
        height=80
    )
    st.session_state.txn_note = note
    st.markdown('</div>', unsafe_allow_html=True)
    
    # Validation - centralized validation to avoid duplicate error messages
    validation_errors = validate_transaction(
        sender_data['user_id'],
        receiver_id,
        amount,
        balance
    )
    
    # Display validation errors (single location to avoid duplication)
    if validation_errors:
        for error in validation_errors:
            st.markdown(f'<span class="field-error">{error}</span>', unsafe_allow_html=True)
    
    # Trust Signal
    st.markdown("""
    <div class="trust-signal">
        <span class="trust-signal-icon">🔒</span>
        <span class="trust-signal-text">{}</span>
    </div>
    """.format(get_text('security_note')), unsafe_allow_html=True)
    
    # Primary CTA Button (fixed near bottom on mobile)
    st.markdown("""
        <div class="analyze-button-container" style="margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
    """, unsafe_allow_html=True)
    
    # Primary CTA Button - directly processes transaction
    process_button = st.button(
        get_text('analyze_transaction'),
        use_container_width=True,
        type="primary",
        key="analyze_btn",
        disabled=len(validation_errors) > 0
    )
    
    st.markdown("""
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    st.markdown("<br>", unsafe_allow_html=True)
    
    # ZONE 2 & 3: DECISION & EXPLANATION ZONES
    if process_button:
        # Validation
        if amount <= 0:
            st.error("Please enter a valid amount")
        else:
            transaction_df = create_transaction_dataframe(
                sender_data, receiver_id, amount, txn_type
            )
            
            with st.spinner('Analyzing transaction...'):
                probability, reasons = process_transaction_ml(transaction_df, sender_data)
            
            # Update analytics
            st.session_state.transactions_processed += 1
            
            # Decision logic
            if probability >= RISK_THRESHOLDS['block']:
                decision = 'block'
                risk_level = 'high'
                st.session_state.fraud_detected += 1
                st.session_state.money_saved += int(amount)
            elif probability >= RISK_THRESHOLDS['warn']:
                decision = 'warn'
                risk_level = 'medium'
            else:
                decision = 'pass'
                risk_level = 'low'
            
            # ZONE 2: DECISION ZONE (Above the Fold)
            render_decision_zone(probability, decision, risk_level)
            
            # Analyst Actions
            transaction_id = f"TXN{datetime.now().strftime('%Y%m%d%H%M%S')}"
            render_analyst_actions(transaction_id, decision, sender_data['user_id'])
            
            st.markdown("---")
            
            # ZONE 3: EXPLANATION ZONE (Tabbed, Progressive)
            render_explanation_zone(
                probability, decision, reasons, 
                st.session_state.shap_table, 
                transaction_df, 
                sender_data,
                receiver_id,
                risk_level
            )
    else:
        # Default state - show analytics
        st.info("👆 Enter transaction details above and click 'Analyze Transaction' to begin")
        
        col1, col2, col3, col4 = st.columns(4)
        with col1:
            st.metric("Money Saved Today", f"৳ {st.session_state.money_saved:,}")
        with col2:
            st.metric("Transactions Processed", st.session_state.transactions_processed)
        with col3:
            st.metric("Fraud Detected", st.session_state.fraud_detected)
        with col4:
            st.metric("System Accuracy", f"{DEMO_ANALYTICS['accuracy_rate']}%")
    
    # Footer
    st.markdown("---")
    st.markdown(f"""
    <div style='text-align: center; padding: 20px; color: {THEME['text_secondary']};'>
        <p>{get_text('footer_text')}</p>
        <p style='font-size: 12px;'>Analyst-Centric Fraud Intelligence Platform | Redesigned for Decision-Making</p>
    </div>
    """, unsafe_allow_html=True)

if __name__ == "__main__":
    main()

