# 📚 CloverShield Analyst User Guide

Welcome to the official operator's manual for the CloverShield Sovereign AI Workstation. This guide covers the end-to-end workflows for fraud investigation, policy management, and system governance.

---

## 🕵️ 1. Investigation Workflow (The Daily Loop)

Your primary task is to monitor the **Investigative Queue** and resolve high-risk alerts.

### Step 1: Monitoring & Assignment
1.  Navigate to the **Mission Control Dashboard**.
2.  Look at the **"Pending Alerts"** widget.
3.  Click on any alert (Yellow/Red) to open the **Transaction Detail View**.
4.  **Action:** Click the "Assign to Me" button to lock the case and prevent duplicate work.

### Step 2: The Deep Dive
Once a case is open, use the following tools to gather intelligence:

*   **Fraud Gauge:** Check the AI Score.
    *   **Score > 0.7:** High Probability of Fraud.
    *   **Score 0.3 - 0.7:** Suspicious (requires manual review).
*   **Risk Drivers:** Look at the "Top 3 Reasons" provided by SHAP.
    *   *Example:* "Transaction amount is 500% higher than user's monthly average."
*   **Network Graph:**
    *   Click the **"View Graph"** tab.
    *   Look for **"Star Patterns"** (one central node receiving funds from many sources).
    *   Red nodes indicate known high-risk accounts.
*   **Analyst Copilot:**
    *   Open the Chat window in the bottom-right corner.
    *   **Context Aware:** The bot knows which page you are on (e.g., Graph vs. Scanner) and will give relevant advice.
    *   **Knowledge Base:** Ask any "How to..." question about the platform. It has read this entire guide!
    *   **Reset Chat:** Click the **Refresh Icon** in the chat header to clear history before starting a new investigation.
    *   Ask: *"Has this user sent money to this recipient before?"* or *"What is the typical behavior for this account age?"*

### Step 3: Making a Decision
1.  **If Legitimate:** Click **"Approve"**. The transaction is released, and the system learns this pattern is safe (False Positive correction).
2.  **If Fraudulent:** Click **"Block & Ban"**. This freezes the user's wallet and adds them to the blacklist.
3.  **If Unsure:** Click **"Create Case"** to escalate to a full investigation.

---

## ⚖️ 2. Policy Lab & Rules

The Policy Lab allows you to create "Safety Nets" that catch fraud missed by the AI model.

### Writing a Rule
Rules use a simple SQL-like syntax. You can combine multiple conditions using `AND`, `OR`.

**Common Examples:**
*   **Catch High-Value Night Transfers:**
    ```sql
    amount > 50000 AND hour >= 2 AND hour <= 4
    ```
*   **Catch Rapid Velocity (Smurfing):**
    ```sql
    dest_txn_count > 10 AND type == 'CASH_OUT'
    ```
*   **Catch New Account Bursts:**
    ```sql
    is_new_origin == True AND amount > 5000
    ```

### Backtesting & Deploying
1.  Go to **Policy Lab**.
2.  Enter your rule logic in the editor.
3.  Click **"Run Backtest"**.
4.  **Analyze Results:**
    *   **Fraud Caught:** How many bad transactions would this have stopped?
    *   **False Positives:** How many good users would this have blocked? (Aim for < 1%).
5.  If the results are good, click **"Deploy Rule"**. It is now active in the live Fraud Scanner.

---

## 📲 3. Secure QR Import (Air-Gapped Data)

Use this feature to import external files (police reports, bank statements) without connecting the workstation to the internet.

1.  **Prepare the Data:** On your secure, internet-connected tablet/device, convert the file to a CloverShield QR Stream.
2.  **Open Scanner:** On the workstation dashboard, click **"Secure Import"** -> **"Scan QR"**.
3.  **Scan:** Hold the tablet screen up to the workstation's webcam.
4.  **Verify:** The system will decode the stream and reconstruct the file.
5.  **Attach:** Click **"Save to Case"** to attach the file to the current investigation.

---

## 📝 4. Compliance & Reporting

Every action you take is a legal record.

### Creating a Case File
1.  From a transaction, click **"Create Case"**.
2.  **Checklist:** You *must* complete the mandatory steps:
    *   [ ] Verify KYC Documents
    *   [ ] Check Watchlist
    *   [ ] Call Customer (if protocol requires)
3.  **Notes:** Add your observations in the "Analyst Notes" section.

### Generating a SAR (Suspicious Activity Report)
1.  Inside a Case File, click the **"Generate SAR"** button.
2.  The **Analyst Copilot** will draft a formal narrative for the BFIU (Bangladesh Financial Intelligence Unit).
3.  Review the text for accuracy.
4.  Click **"Finalize & Export"** to download the PDF/JSON.

### Audit Trail
*   To view your own activity or search for past actions, go to **Settings** -> **Audit Log**.
*   You cannot delete or modify these logs.

---

## 🧠 5. Model Management (Retraining)

Use the **Model Registry** to keep the AI smart without writing code.

1.  **Upload Data:** Go to **Model Registry** -> **"New Version"**. Upload your latest labeled transaction CSV (must match the standard schema).
2.  **Configure:**
    *   **Name:** e.g., "Q1_2026_Retrain"
    *   **Base Model:** Select the previous best version.
3.  **Train:** Click **"Start Training"**. This runs in the background.
4.  **Evaluate:** Once finished, check the "Accuracy" and "F1 Score".
5.  **Activate:** If the new model is better, click **"Activate"**. The live system effectively hot-swaps to this new brain instantly.

---

**Need Help?**
Use the **Analyst Copilot** chat widget in the bottom-right corner for instant answers about any feature.
