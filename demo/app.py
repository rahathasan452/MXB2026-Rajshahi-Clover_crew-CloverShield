"""
CloverShield - Mobile Banking Fraud Detection Demo
A bilingual, user-friendly fraud detection system for Bangladeshi mobile banking
"""

import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
import json
from datetime import datetime
import os
import sys

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from config import TRANSLATIONS, RISK_THRESHOLDS, MODEL_CONFIG, THEME, DEMO_ANALYTICS
    from mock_data import mock_db, create_transaction_dataframe
except ImportError:
    st.error("⚠️ Configuration files not found. Please ensure config.py and mock_data.py are in the same directory as app.py")
    st.stop()

# Try to import model dependencies
try:
    import joblib
    MODEL_AVAILABLE = True
except ImportError:
    MODEL_AVAILABLE = False
    st.warning("⚠️ joblib not installed. Running in demo mode without ML model.")

# Page configuration
st.set_page_config(
    page_title="CloverShield - Fraud Detection",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for beautiful UI
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
    
    /* Cards */
    .card {{
        background: {THEME['card_bg']};
        border-radius: 15px;
        padding: 20px;
        box-shadow: 0 8px 32px rgba(0, 217, 255, 0.1);
        border: 1px solid rgba(0, 217, 255, 0.2);
        margin: 10px 0;
    }}
    
    /* Metric cards */
    .metric-card {{
        background: linear-gradient(135deg, {THEME['card_bg']} 0%, #252a4a 100%);
        border-radius: 12px;
        padding: 15px;
        text-align: center;
        border: 1px solid {THEME['primary']};
        box-shadow: 0 4px 16px rgba(0, 217, 255, 0.2);
    }}
    
    /* Buttons */
    .stButton>button {{
        background: linear-gradient(90deg, {THEME['primary']} 0%, #0099cc 100%);
        color: white;
        font-weight: bold;
        border: none;
        border-radius: 8px;
        padding: 10px 24px;
        transition: all 0.3s;
    }}
    
    .stButton>button:hover {{
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0, 217, 255, 0.4);
    }}
    
    /* Decision badges */
    .decision-badge {{
        font-size: 24px;
        font-weight: bold;
        padding: 15px 30px;
        border-radius: 10px;
        text-align: center;
        margin: 20px 0;
        animation: fadeIn 0.5s;
    }}
    
    .decision-pass {{
        background: linear-gradient(135deg, {THEME['success']} 0%, #00cc66 100%);
        color: white;
        box-shadow: 0 4px 20px rgba(0, 255, 136, 0.3);
    }}
    
    .decision-warn {{
        background: linear-gradient(135deg, {THEME['warning']} 0%, #ffaa00 100%);
        color: #1a1a2e;
        box-shadow: 0 4px 20px rgba(255, 215, 0, 0.3);
    }}
    
    .decision-block {{
        background: linear-gradient(135deg, {THEME['danger']} 0%, #cc0000 100%);
        color: white;
        box-shadow: 0 4px 20px rgba(255, 68, 68, 0.3);
    }}
    
    /* Info boxes */
    .info-box {{
        background: rgba(0, 217, 255, 0.1);
        border-left: 4px solid {THEME['primary']};
        padding: 15px;
        border-radius: 8px;
        margin: 10px 0;
    }}
    
    /* Animations */
    @keyframes fadeIn {{
        from {{ opacity: 0; transform: translateY(-10px); }}
        to {{ opacity: 1; transform: translateY(0); }}
    }}
    
    @keyframes pulse {{
        0%, 100% {{ opacity: 1; }}
        50% {{ opacity: 0.7; }}
    }}
    
    /* Sidebar */
    .css-1d391kg {{
        background: {THEME['card_bg']};
    }}
    
    /* Expander */
    .streamlit-expanderHeader {{
        background: {THEME['card_bg']};
        border-radius: 8px;
    }}
    
    /* Footer */
    .footer {{
        text-align: center;
        padding: 20px;
        color: {THEME['text_secondary']};
        border-top: 1px solid rgba(0, 217, 255, 0.2);
        margin-top: 40px;
    }}
    
    /* Dataframe styling */
    .dataframe {{
        background: {THEME['card_bg']};
        border-radius: 8px;
    }}
    </style>
    """, unsafe_allow_html=True)

# Initialize session state
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
        if MODEL_AVAILABLE:
            load_ml_model()

def load_ml_model():
    """Load the ML model pipeline"""
    try:
        # Try multiple paths
        paths = [
            MODEL_CONFIG['model_path'],
            MODEL_CONFIG['fallback_model_path'],
            'fraud_pipeline_final.pkl',
            '../fraud_pipeline_final.pkl'
        ]
        
        for path in paths:
            if os.path.exists(path):
                st.session_state.ml_model = joblib.load(path)
                st.sidebar.success(f"✅ Model loaded from {path}")
                return
        
        st.sidebar.warning("⚠️ ML model not found. Using rule-based detection.")
    except Exception as e:
        st.sidebar.error(f"Error loading model: {str(e)}")

def get_text(key):
    """Get translated text"""
    return TRANSLATIONS[st.session_state.language].get(key, key)

def create_gauge_chart(value, title):
    """Create a gauge chart for probability visualization"""
    fig = go.Figure(go.Indicator(
        mode="gauge+number+delta",
        value=value * 100,
        domain={'x': [0, 1], 'y': [0, 1]},
        title={'text': title, 'font': {'size': 20, 'color': THEME['text_primary']}},
        number={'suffix': "%", 'font': {'size': 40, 'color': THEME['text_primary']}},
        gauge={
            'axis': {'range': [None, 100], 'tickwidth': 1, 'tickcolor': THEME['text_secondary']},
            'bar': {'color': THEME['primary']},
            'bgcolor': THEME['card_bg'],
            'borderwidth': 2,
            'bordercolor': THEME['text_secondary'],
            'steps': [
                {'range': [0, 30], 'color': 'rgba(0, 255, 136, 0.3)'},
                {'range': [30, 70], 'color': 'rgba(255, 215, 0, 0.3)'},
                {'range': [70, 100], 'color': 'rgba(255, 68, 68, 0.3)'}
            ],
            'threshold': {
                'line': {'color': "red", 'width': 4},
                'thickness': 0.75,
                'value': MODEL_CONFIG['default_threshold'] * 100
            }
        }
    ))
    
    fig.update_layout(
        paper_bgcolor=THEME['card_bg'],
        plot_bgcolor=THEME['card_bg'],
        font={'color': THEME['text_primary']},
        height=300
    )
    
    return fig

def rule_based_fraud_detection(transaction_df, sender_data):
    """
    Fallback rule-based fraud detection when ML model is not available
    """
    amount = transaction_df['amount'].iloc[0]
    txn_type = transaction_df['type'].iloc[0]
    balance = transaction_df['oldBalanceOrig'].iloc[0]
    
    risk_score = 0.0
    reasons = []
    
    # Rule 1: Amount exceeds balance
    if amount > balance:
        risk_score += 0.5
        reasons.append("Amount exceeds available balance")
    
    # Rule 2: Large transaction (>50% of balance)
    if amount > balance * 0.5:
        risk_score += 0.2
        reasons.append("Large transaction relative to balance")
    
    # Rule 3: Very high amount
    if amount > 50000:
        risk_score += 0.3
        reasons.append("Unusually high transaction amount")
    
    # Rule 4: New user with high amount
    if sender_data['total_transactions'] < 10 and amount > 10000:
        risk_score += 0.25
        reasons.append("New account with high-value transaction")
    
    # Rule 5: Suspicious user profile
    if sender_data['risk_level'] == 'suspicious':
        risk_score += 0.4
        reasons.append("Account flagged as suspicious")
    elif sender_data['risk_level'] == 'high':
        risk_score += 0.2
        reasons.append("High-risk account profile")
    
    # Rule 6: Unverified account
    if not sender_data['verified']:
        risk_score += 0.15
        reasons.append("Unverified account")
    
    # Rule 7: Amount deviates from user's typical behavior
    if amount > sender_data['avg_transaction_amount'] * 3:
        risk_score += 0.2
        reasons.append("Amount significantly deviates from typical behavior")
    
    # Cap risk score at 1.0
    risk_score = min(risk_score, 1.0)
    
    return risk_score, reasons

def process_transaction_ml(transaction_df, sender_data):
    """Process transaction using ML model"""
    try:
        if st.session_state.ml_model is None:
            # Use rule-based detection
            return rule_based_fraud_detection(transaction_df, sender_data)
        
        # ML model prediction
        probability = st.session_state.ml_model.predict_proba(transaction_df)[0, 1]
        
        # Get feature importances (simplified - actual SHAP would be more complex)
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
        st.error(f"ML model error: {str(e)}")
        return rule_based_fraud_detection(transaction_df, sender_data)

def render_user_card(user_data, title):
    """Render user information card"""
    if user_data is None:
        st.info("👤 Select a user to view details")
        return
    
    st.markdown(f"### {title}")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown(f"""
        <div class="info-box">
            <strong>{get_text('account_id')}:</strong> {user_data['user_id']}<br>
            <strong>{get_text('name')}:</strong> {user_data['name_bn']} / {user_data['name_en']}<br>
            <strong>{get_text('phone')}:</strong> {user_data['phone']}<br>
            <strong>{get_text('provider')}:</strong> {user_data['provider']}
        </div>
        """, unsafe_allow_html=True)
    
    with col2:
        verified_icon = "✅" if user_data['verified'] else "❌"
        kyc_icon = "✅" if user_data['kyc_complete'] else "❌"
        
        st.markdown(f"""
        <div class="info-box">
            <strong>{get_text('balance')}:</strong> ৳ {user_data['balance']:,}<br>
            <strong>{get_text('total_txns')}:</strong> {user_data['total_transactions']}<br>
            <strong>{get_text('verified')}:</strong> {verified_icon}<br>
            <strong>{get_text('kyc')}:</strong> {kyc_icon}
        </div>
        """, unsafe_allow_html=True)

def render_transaction_history(user_id):
    """Render transaction history"""
    history = mock_db.get_user_history(user_id)
    
    if not history:
        st.info(get_text('no_history'))
        return
    
    st.markdown(f"#### {get_text('history_title')}")
    df_history = pd.DataFrame(history)
    st.dataframe(df_history, use_container_width=True, height=200)

def render_decision_panel(probability, decision, reasons):
    """Render the decision panel with visual feedback"""
    st.markdown(f"## {get_text('decision_title')}")
    
    # Gauge chart
    gauge_fig = create_gauge_chart(probability, get_text('fraud_probability'))
    st.plotly_chart(gauge_fig, use_container_width=True)
    
    # Decision badge
    if decision == 'pass':
        decision_class = 'decision-pass'
        decision_text = get_text('action_pass')
        risk_text = get_text('risk_low')
    elif decision == 'warn':
        decision_class = 'decision-warn'
        decision_text = get_text('action_warn')
        risk_text = get_text('risk_medium')
    else:  # block
        decision_class = 'decision-block'
        decision_text = get_text('action_block')
        risk_text = get_text('risk_high')
    
    st.markdown(f"""
    <div class="decision-badge {decision_class}">
        {decision_text}
    </div>
    """, unsafe_allow_html=True)
    
    # Risk assessment
    st.markdown(f"### {get_text('risk_assessment')}")
    st.markdown(f"<h2 style='text-align: center;'>{risk_text}</h2>", unsafe_allow_html=True)
    
    # Explanation
    st.markdown(f"### {get_text('explanation_title')}")
    st.markdown(f"*{get_text('explanation_subtitle')}*")
    
    for reason in reasons:
        st.markdown(f"- {reason}")

def render_analytics():
    """Render real-time analytics dashboard"""
    st.markdown(f"## {get_text('analytics_title')}")
    
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.markdown(f"""
        <div class="metric-card">
            <h4>{get_text('money_saved')}</h4>
            <h2 style='color: {THEME['success']}'>৳ {st.session_state.money_saved:,}</h2>
        </div>
        """, unsafe_allow_html=True)
    
    with col2:
        st.markdown(f"""
        <div class="metric-card">
            <h4>{get_text('transactions_processed')}</h4>
            <h2 style='color: {THEME['primary']}'>{st.session_state.transactions_processed:,}</h2>
        </div>
        """, unsafe_allow_html=True)
    
    with col3:
        st.markdown(f"""
        <div class="metric-card">
            <h4>{get_text('fraud_detected')}</h4>
            <h2 style='color: {THEME['danger']}'>{st.session_state.fraud_detected}</h2>
        </div>
        """, unsafe_allow_html=True)
    
    with col4:
        st.markdown(f"""
        <div class="metric-card">
            <h4>{get_text('accuracy_rate')}</h4>
            <h2 style='color: {THEME['success']}'>{DEMO_ANALYTICS['accuracy_rate']}%</h2>
        </div>
        """, unsafe_allow_html=True)

def render_payload_viewer(transaction_data, result_data):
    """Render API payload viewer for developers"""
    st.markdown(f"## {get_text('payload_title')}")
    st.markdown(f"*{get_text('payload_subtitle')}*")
    
    if st.button(get_text('show_payload') if not st.session_state.show_payload else get_text('hide_payload')):
        st.session_state.show_payload = not st.session_state.show_payload
    
    if st.session_state.show_payload:
        payload = {
            "request": {
                "transaction_id": f"TXN{datetime.now().strftime('%Y%m%d%H%M%S')}",
                "timestamp": datetime.now().isoformat(),
                "sender": transaction_data['nameOrig'].iloc[0],
                "receiver": transaction_data['nameDest'].iloc[0],
                "amount": float(transaction_data['amount'].iloc[0]),
                "type": transaction_data['type'].iloc[0],
                "oldBalanceOrig": float(transaction_data['oldBalanceOrig'].iloc[0]),
                "newBalanceOrig": float(transaction_data['newBalanceOrig'].iloc[0])
            },
            "response": {
                "fraud_probability": result_data['probability'],
                "decision": result_data['decision'],
                "risk_level": result_data['risk_level'],
                "factors": result_data['reasons'],
                "processing_time_ms": 145
            }
        }
        
        st.json(payload)

# Main app
def main():
    # Initialize
    init_session_state()
    load_custom_css()
    
    # Header
    st.markdown(f"""
    <div style='text-align: center; padding: 20px;'>
        <h1>{get_text('app_title')}</h1>
        <h3 style='color: {THEME['primary']};'>{get_text('app_subtitle')}</h3>
        <p style='color: {THEME['text_secondary']};'>{get_text('tagline')}</p>
    </div>
    """, unsafe_allow_html=True)
    
    # Sidebar
    with st.sidebar:
        st.markdown("## ⚙️ Settings")
        
        # Language toggle
        language = st.radio(
            "Language / ভাষা",
            options=['en', 'bn'],
            format_func=lambda x: "🇬🇧 English" if x == 'en' else "🇧🇩 বাংলা",
            horizontal=True
        )
        st.session_state.language = language
        
        st.markdown("---")
        
        # Model status
        st.markdown("### 🤖 Model Status")
        if st.session_state.ml_model:
            st.success("✅ ML Model Active")
        else:
            st.warning("⚠️ Rule-Based Mode")
        
        st.markdown("---")
        
        # Quick stats
        st.markdown("### 📊 Session Stats")
        st.metric("Transactions", st.session_state.transactions_processed)
        st.metric("Fraud Blocked", st.session_state.fraud_detected)
        
        st.markdown("---")
        st.markdown(f"<div style='font-size: 12px; color: {THEME['text_secondary']};'>{get_text('safety_notice')}</div>", unsafe_allow_html=True)
    
    # Main content - Twin View
    col_left, col_right = st.columns([1, 1], gap="large")
    
    # LEFT PANEL: Transaction Simulator
    with col_left:
        st.markdown(f"# {get_text('simulator_title')}")
        st.markdown("---")
        
        # Sender selection
        st.markdown(f"### {get_text('sender_label')}")
        
        col_btn1, col_btn2 = st.columns([3, 1])
        with col_btn1:
            all_users = mock_db.get_all_users()
            sender_options = [f"{u['user_id']} - {u['name_en']} ({u['provider']})" for u in all_users]
            selected_sender_idx = st.selectbox(
                "Select sender",
                range(len(sender_options)),
                format_func=lambda i: sender_options[i],
                label_visibility="collapsed"
            )
            sender_data = all_users[selected_sender_idx]
        
        with col_btn2:
            if st.button(get_text('random_user_button')):
                st.rerun()
        
        render_user_card(sender_data, get_text('user_info'))
        render_transaction_history(sender_data['user_id'])
        
        st.markdown("---")
        
        # Transaction form
        st.markdown("### 💸 Transaction Details")
        
        # Receiver
        receiver_options = [u['user_id'] for u in all_users if u['user_id'] != sender_data['user_id']]
        receiver_id = st.selectbox(get_text('receiver_label'), receiver_options)
        
        # Amount
        amount = st.number_input(
            get_text('amount_label'),
            min_value=1,
            max_value=100000,
            value=5000,
            step=100
        )
        
        # Transaction type
        txn_type = st.selectbox(
            get_text('transaction_type_label'),
            options=['CASH_OUT', 'TRANSFER'],
            format_func=lambda x: get_text(x.lower())
        )
        
        # Submit button
        process_button = st.button(get_text('submit_button'), use_container_width=True)
    
    # RIGHT PANEL: Guardian Command Center
    with col_right:
        st.markdown(f"# {get_text('guardian_title')}")
        st.markdown("---")
        
        if process_button:
            # Validation
            if amount <= 0:
                st.error(get_text('alert_amount_invalid'))
            elif amount > sender_data['balance']:
                st.warning(get_text('alert_insufficient'))
                
                # Still process to show fraud detection
                transaction_df = create_transaction_dataframe(
                    sender_data, receiver_id, amount, txn_type
                )
                
                probability, reasons = process_transaction_ml(transaction_df, sender_data)
                
                # Update analytics
                st.session_state.transactions_processed += 1
                
                # Decision logic
                if probability >= RISK_THRESHOLDS['block']:
                    decision = 'block'
                    risk_level = get_text('risk_high')
                    st.session_state.fraud_detected += 1
                    st.session_state.money_saved += int(amount)
                elif probability >= RISK_THRESHOLDS['warn']:
                    decision = 'warn'
                    risk_level = get_text('risk_medium')
                else:
                    decision = 'pass'
                    risk_level = get_text('risk_low')
                
                render_decision_panel(probability, decision, reasons)
                
            else:
                # Process transaction
                transaction_df = create_transaction_dataframe(
                    sender_data, receiver_id, amount, txn_type
                )
                
                with st.spinner('🔍 Analyzing transaction...'):
                    probability, reasons = process_transaction_ml(transaction_df, sender_data)
                
                # Update analytics
                st.session_state.transactions_processed += 1
                
                # Decision logic
                if probability >= RISK_THRESHOLDS['block']:
                    decision = 'block'
                    risk_level = get_text('risk_high')
                    st.session_state.fraud_detected += 1
                    st.session_state.money_saved += int(amount)
                elif probability >= RISK_THRESHOLDS['warn']:
                    decision = 'warn'
                    risk_level = get_text('risk_medium')
                else:
                    decision = 'pass'
                    risk_level = get_text('risk_low')
                
                render_decision_panel(probability, decision, reasons)
                
                # Store result for payload viewer
                result_data = {
                    'probability': float(probability),
                    'decision': decision,
                    'risk_level': risk_level,
                    'reasons': reasons
                }
                
                st.markdown("---")
                render_payload_viewer(transaction_df, result_data)
        else:
            # Default state
            st.info("👆 Enter transaction details in the left panel and click 'Process Transaction'")
            
            # Show demo analytics
            render_analytics()
    
    # Footer
    st.markdown("---")
    st.markdown(f"""
    <div class="footer">
        <p>{get_text('footer_text')}</p>
        <p style='font-size: 12px;'>Contact: @rahathasan452 | GitHub: Team Clover Crew</p>
    </div>
    """, unsafe_allow_html=True)

if __name__ == "__main__":
    main()

