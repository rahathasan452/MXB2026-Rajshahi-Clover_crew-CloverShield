
// Policy Engine for Client-Side Evaluation

export interface Condition {
  id: string
  feature: string
  operator: string
  value: string
  logic?: 'AND' | 'OR'
}

export const evaluatePolicy = (transaction: any, conditions: Condition[]): boolean => {
  if (!conditions || conditions.length === 0) return false;

  let result = evaluateCondition(transaction, conditions[0]);

  for (let i = 1; i < conditions.length; i++) {
    const condition = conditions[i];
    const logic = condition.logic || 'AND';
    const currentResult = evaluateCondition(transaction, condition);

    if (logic === 'AND') {
      result = result && currentResult;
    } else {
      result = result || currentResult;
    }
  }

  return result;
};

const evaluateCondition = (transaction: any, condition: Condition): boolean => {
  const { feature, operator, value } = condition;
  
  // Map feature names from Policy Lab to Transaction object keys
  // Transaction object in Simulator usually has: amount, type, oldBalanceOrig, etc.
  // We need to ensure the keys match what's in the Simulator's handleTransactionSubmit data object
  
  // NOTE: Some features like 'orig_txn_count', 'in_degree' might not be available in the raw form input.
  // The Simulator sends: { senderId, receiverId, amount, type, oldBalanceOrig, newBalanceOrig, ... }
  // Complex features (graph-based) are calculated on the backend.
  // For this "One Click Implement", we might be limited to features available in the frontend form 
  // OR we rely on the backend response if we want to support all features.
  
  // However, the requirement implies a quick client-side check or a check that overrides ML.
  // If we need backend features, we would need to fetch them first. 
  // The Simulator DOES call `predictFraud` which returns a prediction.
  // But strictly speaking, "Policy Detection" implies a rule-based check.
  
  // Let's assume for the prototype that we support basic features available in the input:
  // amount, type, oldBalanceOrig.
  // For others, we might default to false or try to map if possible.
  
  let txValue = transaction[feature];
  
  // Handle specific mappings if needed
  if (feature === 'oldBalanceOrig') txValue = transaction.oldBalanceOrig;
  // if (feature === 'type') txValue = transaction.type; // Matches
  // if (feature === 'amount') txValue = transaction.amount; // Matches

  if (txValue === undefined) {
    // If feature is missing (e.g. complex graph feature not in form), 
    // we can't evaluate it client-side easily without fetching data.
    // For now, let's treat missing features as not matching or safe.
    // Ideally, we warn the user.
    console.warn(`Feature ${feature} not available for client-side evaluation.`);
    return false; 
  }

  const numValue = Number(value);
  const txNumValue = Number(txValue);
  
  const isNumber = !isNaN(numValue) && !isNaN(txNumValue);

  switch (operator) {
    case '>':
      return isNumber ? txNumValue > numValue : String(txValue) > String(value);
    case '>=':
      return isNumber ? txNumValue >= numValue : String(txValue) >= String(value);
    case '<':
      return isNumber ? txNumValue < numValue : String(txValue) < String(value);
    case '<=':
      return isNumber ? txNumValue <= numValue : String(txValue) <= String(value);
    case '==':
      // eslint-disable-next-line eqeqeq
      return txValue == value; 
    case '!=':
      // eslint-disable-next-line eqeqeq
      return txValue != value;
    default:
      return false;
  }
};
