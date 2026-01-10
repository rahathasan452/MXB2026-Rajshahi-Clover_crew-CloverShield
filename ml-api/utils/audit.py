from supabase import Client
import logging

# Configure logger for internal errors
logger = logging.getLogger(__name__)

class AuditLogger:
    def __init__(self, supabase_client: Client):
        self.supabase = supabase_client

    def log_prediction(self, transaction_id: str, fraud_score: float, features: dict):
        """
        Logs an ML prediction event to the audit_logs table via RPC.
        """
        try:
            self.supabase.rpc("log_activity", {
                "p_action_type": "ML_PREDICTION",
                "p_message": f"ML Model prediction: {fraud_score:.4f}",
                "p_resource_type": "transaction",
                "p_resource_id": str(transaction_id),
                "p_metadata": {
                    "fraud_score": fraud_score,
                    "features_snapshot": features
                }
            }).execute()
        except Exception as e:
            # We catch all exceptions to ensuring logging failures don't block the main inference
            logger.error(f"Failed to log prediction audit: {str(e)}")

    def log_backtest(self, policy_name: str, passed: bool, impact_score: float):
        """
        Logs a policy backtest simulation.
        """
        try:
            status = "PASSED" if passed else "FAILED"
            self.supabase.rpc("log_activity", {
                "p_action_type": "POLICY_BACKTEST",
                "p_message": f"Policy '{policy_name}' backtest {status}",
                "p_resource_type": "policy",
                "p_resource_id": policy_name,
                "p_metadata": {
                    "passed": passed,
                    "impact_score": impact_score
                }
            }).execute()
        except Exception as e:
            logger.error(f"Failed to log backtest audit: {str(e)}")
