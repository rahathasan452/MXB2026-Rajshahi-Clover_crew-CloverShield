import unittest
from unittest.mock import MagicMock, patch
from utils.audit import AuditLogger

class TestAuditLogger(unittest.TestCase):
    def setUp(self):
        self.mock_supabase = MagicMock()
        self.logger = AuditLogger(self.mock_supabase)

    def test_log_prediction(self):
        """Test logging a prediction event."""
        transaction_id = "test_tx_123"
        fraud_score = 0.85
        features = {"amount": 100, "type": "TRANSFER"}

        self.logger.log_prediction(transaction_id, fraud_score, features)

        self.mock_supabase.rpc.assert_called_once()
        args, kwargs = self.mock_supabase.rpc.call_args
        self.assertEqual(args[0], "log_activity")
        
        payload = args[1]
        self.assertEqual(payload['p_action_type'], 'ML_PREDICTION')
        self.assertEqual(payload['p_resource_type'], 'transaction')
        self.assertEqual(payload['p_resource_id'], transaction_id)
        self.assertIn('0.85', payload['p_message'])
        self.assertEqual(payload['p_metadata']['fraud_score'], fraud_score)

    def test_log_error_handling(self):
        """Test that logging errors are caught and do not crash the app."""
        self.mock_supabase.rpc.side_effect = Exception("Connection failed")
        
        # Should not raise exception
        try:
            self.logger.log_prediction("tx_123", 0.5, {})
        except Exception:
            self.fail("AuditLogger raised exception on failure")

if __name__ == '__main__':
    unittest.main()
