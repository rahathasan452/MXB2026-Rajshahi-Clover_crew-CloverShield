"""
Configuration and Bilingual Content for CloverShield Fraud Detection Demo
"""

# Language translations
TRANSLATIONS = {
    "en": {
        # Header
        "app_title": "🛡️ CloverShield",
        "app_subtitle": "Mobile Banking Fraud Detection System",
        "tagline": "Protecting Bangladesh's Digital Financial Ecosystem",
        
        # Main sections
        "simulator_title": "💳 Transaction Simulator",
        "guardian_title": "🔒 Guardian Command Center",
        
        # Form labels
        "sender_label": "Sender Account",
        "receiver_label": "Receiver Account",
        "amount_label": "Amount (৳)",
        "transaction_type_label": "Transaction Type",
        "submit_button": "🚀 Process Transaction",
        "random_user_button": "🎲 Random User",
        
        # User info
        "user_info": "User Information",
        "account_id": "Account ID",
        "name": "Name",
        "phone": "Phone",
        "provider": "Provider",
        "balance": "Current Balance",
        "account_age": "Account Age",
        "total_txns": "Total Transactions",
        "avg_amount": "Avg. Transaction",
        "verified": "Verified",
        "kyc": "KYC Complete",
        "days": "days",
        
        # Transaction history
        "history_title": "Recent Transaction History",
        "no_history": "No transaction history available",
        
        # Decision panel
        "decision_title": "🎯 Decision",
        "fraud_probability": "Fraud Probability",
        "confidence_level": "Confidence Level",
        "risk_assessment": "Risk Assessment",
        
        # Risk levels
        "risk_low": "🟢 LOW RISK",
        "risk_medium": "🟡 MEDIUM RISK",
        "risk_high": "🔴 HIGH RISK",
        
        # Actions
        "action_pass": "✅ TRANSACTION APPROVED",
        "action_warn": "⚠️ MANUAL VERIFICATION REQUIRED",
        "action_block": "🚫 TRANSACTION BLOCKED",
        
        # Explanations
        "explanation_title": "📊 Risk Analysis",
        "explanation_subtitle": "Key factors influencing this decision:",
        
        # Analytics
        "analytics_title": "📈 Real-Time Analytics",
        "money_saved": "Money Saved Today",
        "transactions_processed": "Transactions Processed",
        "fraud_detected": "Fraud Detected",
        "accuracy_rate": "System Accuracy",
        
        # Payload viewer
        "payload_title": "👨‍💻 Developer View",
        "payload_subtitle": "API Request Payload (Production-Ready Format)",
        "show_payload": "Show Request Payload",
        "hide_payload": "Hide Payload",
        
        # Alerts
        "alert_insufficient": "⚠️ Insufficient Balance",
        "alert_amount_invalid": "⚠️ Please enter a valid amount",
        "alert_success": "Transaction processed successfully",
        
        # Footer
        "footer_text": "Built by Team Clover Crew for MXB2026 Rajshahi | Powered by XGBoost & SHAP",
        "safety_notice": "🔒 Demo Environment: No real money is being transferred",
        
        # Transaction types
        "cash_out": "Cash Out",
        "transfer": "Transfer",
        "payment": "Payment",
        "cash_in": "Cash In",
    },
    
    "bn": {
        # Header
        "app_title": "🛡️ ক্লোভারশিল্ড",
        "app_subtitle": "মোবাইল ব্যাংকিং জালিয়াতি সনাক্তকরণ ব্যবস্থা",
        "tagline": "বাংলাদেশের ডিজিটাল আর্থিক ইকোসিস্টেম রক্ষা করছি",
        
        # Main sections
        "simulator_title": "💳 লেনদেন সিমুলেটর",
        "guardian_title": "🔒 গার্ডিয়ান কমান্ড সেন্টার",
        
        # Form labels
        "sender_label": "প্রেরক অ্যাকাউন্ট",
        "receiver_label": "গ্রহীতা অ্যাকাউন্ট",
        "amount_label": "পরিমাণ (৳)",
        "transaction_type_label": "লেনদেনের ধরন",
        "submit_button": "🚀 লেনদেন প্রক্রিয়া করুন",
        "random_user_button": "🎲 র্যান্ডম ব্যবহারকারী",
        
        # User info
        "user_info": "ব্যবহারকারীর তথ্য",
        "account_id": "অ্যাকাউন্ট আইডি",
        "name": "নাম",
        "phone": "ফোন",
        "provider": "প্রদানকারী",
        "balance": "বর্তমান ব্যালেন্স",
        "account_age": "অ্যাকাউন্টের বয়স",
        "total_txns": "মোট লেনদেন",
        "avg_amount": "গড় লেনদেন",
        "verified": "যাচাইকৃত",
        "kyc": "KYC সম্পন্ন",
        "days": "দিন",
        
        # Transaction history
        "history_title": "সাম্প্রতিক লেনদেন ইতিহাস",
        "no_history": "কোন লেনদেন ইতিহাস উপলব্ধ নেই",
        
        # Decision panel
        "decision_title": "🎯 সিদ্ধান্ত",
        "fraud_probability": "জালিয়াতির সম্ভাবনা",
        "confidence_level": "আত্মবিশ্বাসের স্তর",
        "risk_assessment": "ঝুঁকি মূল্যায়ন",
        
        # Risk levels
        "risk_low": "🟢 নিম্ন ঝুঁকি",
        "risk_medium": "🟡 মাঝারি ঝুঁকি",
        "risk_high": "🔴 উচ্চ ঝুঁকি",
        
        # Actions
        "action_pass": "✅ লেনদেন অনুমোদিত",
        "action_warn": "⚠️ ম্যানুয়াল যাচাইকরণ প্রয়োজন",
        "action_block": "🚫 লেনদেন ব্লক করা হয়েছে",
        
        # Explanations
        "explanation_title": "📊 ঝুঁকি বিশ্লেষণ",
        "explanation_subtitle": "এই সিদ্ধান্তে প্রভাব ফেলেছে এমন মূল বিষয়:",
        
        # Analytics
        "analytics_title": "📈 রিয়েল-টাইম অ্যানালিটিক্স",
        "money_saved": "আজ সংরক্ষিত অর্থ",
        "transactions_processed": "প্রক্রিয়াকৃত লেনদেন",
        "fraud_detected": "জালিয়াতি সনাক্ত",
        "accuracy_rate": "সিস্টেম নির্ভুলতা",
        
        # Payload viewer
        "payload_title": "👨‍💻 ডেভেলপার ভিউ",
        "payload_subtitle": "API রিকুয়েস্ট পেলোড (প্রোডাকশন-রেডি ফরম্যাট)",
        "show_payload": "রিকুয়েস্ট পেলোড দেখান",
        "hide_payload": "পেলোড লুকান",
        
        # Alerts
        "alert_insufficient": "⚠️ অপর্যাপ্ত ব্যালেন্স",
        "alert_amount_invalid": "⚠️ দয়া করে একটি বৈধ পরিমাণ লিখুন",
        "alert_success": "লেনদেন সফলভাবে প্রক্রিয়া করা হয়েছে",
        
        # Footer
        "footer_text": "টিম ক্লোভার ক্রু কর্তৃক নির্মিত MXB2026 রাজশাহীর জন্য | XGBoost ও SHAP দ্বারা চালিত",
        "safety_notice": "🔒 ডেমো পরিবেশ: কোন প্রকৃত অর্থ স্থানান্তরিত হচ্ছে না",
        
        # Transaction types
        "cash_out": "ক্যাশ আউট",
        "transfer": "স্থানান্তর",
        "payment": "পেমেন্ট",
        "cash_in": "ক্যাশ ইন",
    }
}

# Risk thresholds
RISK_THRESHOLDS = {
    "pass": 0.30,      # Below this: PASS
    "warn": 0.30,      # Between pass and warn: WARN (0.30 to 0.70)
    "block": 0.70      # Above this: BLOCK
}

# Model configuration
MODEL_CONFIG = {
    "default_threshold": 0.0793,  # From training
    "target_recall": 0.95,
    "model_path": "Models/fraud_pipeline_final.pkl",
    "fallback_model_path": "../Models/fraud_pipeline_final.pkl"
}

# UI Theme colors
THEME = {
    "primary": "#00D9FF",
    "success": "#00FF88",
    "warning": "#FFD700",
    "danger": "#FF4444",
    "dark_bg": "#0A0E27",
    "card_bg": "#1A1F3A",
    "text_primary": "#FFFFFF",
    "text_secondary": "#A0AEC0"
}

# Analytics tracking (demo values)
DEMO_ANALYTICS = {
    "money_saved": 2547890,  # BDT
    "transactions_processed": 15847,
    "fraud_detected": 342,
    "accuracy_rate": 99.8
}

