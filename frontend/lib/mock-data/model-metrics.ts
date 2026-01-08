
export const MODEL_SUMMARY = {
  accuracy: 0.98,
  precision: 0.95,
  recall: 0.92,
  f1: 0.93,
};

// Structure: x = Predicted, y = Actual
export const CONFUSION_MATRIX_DATA = [
  { x: 'Legit', y: 'Legit', v: 900 }, // True Negative
  { x: 'Fraud', y: 'Legit', v: 5 },   // False Positive
  { x: 'Legit', y: 'Fraud', v: 8 },   // False Negative
  { x: 'Fraud', y: 'Fraud', v: 92 },  // True Positive
];

export const ROC_DATA = [
  { x: 0, y: 0 },
  { x: 0.01, y: 0.40 },
  { x: 0.03, y: 0.75 },
  { x: 0.05, y: 0.88 },
  { x: 0.10, y: 0.94 },
  { x: 0.15, y: 0.97 },
  { x: 0.20, y: 0.98 },
  { x: 0.50, y: 0.995 },
  { x: 1, y: 1 },
];
