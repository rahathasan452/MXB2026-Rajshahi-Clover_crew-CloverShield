# Model Description

This document summarizes the two trained binary classification models ("model1" and "model2") and their selected operating thresholds. Both models were evaluated using cross-validation on the training data; thresholds were chosen to achieve a target recall ≈ 0.95 for the positive class.

## Summary (shared)
- Task: Binary classification (negative class = 0, positive class = 1).
- Threshold selection method: chosen on TRAIN (CV) to achieve target recall ≈ 0.95.
- Notes: High recall was prioritized for the positive class, which reduces false negatives at the cost of lower precision.

---

## Model 1
- Chosen threshold from TRAIN (CV): 0.07931428 (target recall 0.95)

Training (CV) performance at chosen threshold (class 0 = negative, class 1 = positive):

              precision    recall  f1-score   support

           0       1.00      1.00      1.00   2,627,355
           1       0.51      0.95      0.66      5,275

    accuracy                           1.00   2,632,630
   macro avg       0.76      0.97      0.83   2,632,630
weighted avg       1.00      1.00      1.00   2,632,630

Train confusion matrix:
[[2,622,551    4,804]
 [    263    5,012]]

Randomized search — best hyperparameters:
- clf__colsample_bytree: 0.7599443886861021
- clf__learning_rate: 0.03559987958563385
- clf__max_depth: 7
- clf__n_estimators: 489
- clf__scale_pos_weight: 498
- clf__subsample: 0.7271819303598462

Interpretation / notes for Model 1:
- At the chosen threshold Model 1 achieves high recall (≈0.95) for the positive class while precision is moderate (~0.51), indicating a trade-off: many positive predictions will be false positives but few positives will be missed.
- Confusion matrix shows a small number of false negatives (263) compared to true positives (5,012).

---

## Model 2
- Chosen threshold from TRAIN (CV): 0.12684587 (target recall 0.95)

Training (CV) performance at chosen threshold:

              precision    recall  f1-score   support

           0       1.00      1.00      1.00   2,627,355
           1       0.52      0.95      0.67      5,275

    accuracy                           1.00   2,632,630
   macro avg       0.76      0.97      0.83   2,632,630
weighted avg       1.00      1.00      1.00   2,632,630

Train confusion matrix:
[[2,622,668    4,687]
 [    263    5,012]]

Randomized search — best hyperparameters:
- colsample_bytree: 0.7599443886861021
- learning_rate: 0.03559987958563385
- max_depth: 7
- n_estimators: 489
- scale_pos_weight: 498
- subsample: 0.7271819303598462

Interpretation / notes for Model 2:
- Model 2 shows nearly identical overall performance to Model 1 at the chosen threshold: recall is preserved at ≈0.95 while precision is slightly higher (~0.52).
- Confusion matrix again shows very few false negatives (263) and a larger number of true positives (5,012).

---

## Recommendations & Next steps
- Threshold tuning:
  - The thresholds were tuned on CV to meet recall requirements; you should validate the chosen thresholds on a held-out test set or recent production data before deploying.
  - Consider monitoring precision/false positive rate in production because precision is moderate and FP rate may be operationally costly.

- Calibration & uncertainty:
  - If well-calibrated probabilities are required, evaluate probability calibration (Platt scaling / isotonic) on validation data.

- Deployment & reproducibility:
  - Save the full pipeline (preprocessing + model) with joblib or pickle; store versioned artifacts (use Git LFS for large files).
  - Record package versions (scikit-learn, xgboost, pandas, numpy, joblib) in requirements.txt or environment.yml.

- Evaluation & monitoring:
  - Track the same metrics (precision, recall, F1, confusion matrix) on production data and monitor for data drift.
  - Add unit tests / smoke tests that load the saved pipeline and run a small inference to ensure compatibility.

---

## How to load the model (example)
Note: Only load pickles from trusted sources.

Python (example):
import joblib
model = joblib.load("Models/pipeline.pkl")  # update path if different
# Ensure input DataFrame uses the same feature order as training
preds = model.predict(X)
probs = model.predict_proba(X)[:, 1]

To apply the chosen threshold for binary decisions:
threshold = 0.07931428  # model1 threshold (example)
binary_preds = (probs >= threshold).astype(int)

---

## Contact
For questions about training data, feature definitions, or reproduction steps contact: @rahathasan452

(Generated & updated on 2025-12-20)
