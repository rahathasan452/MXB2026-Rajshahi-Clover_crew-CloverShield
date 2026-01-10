# Product Guidelines

## Prose Style

-   **Professional & Technical:** The user interface uses a direct, data-centric, and efficient prose style. It employs industry-standard terminology for fraud analysis to ensure clarity and precision for expert users.

## Visual Identity

-   **Analyst Station Vibe:** Dark mode is the default theme to minimize eye strain during extended monitoring sessions. High-contrast colors, specifically Emerald (Success/Safe) and Red (Risk/Alert), are used for clear and immediate status communication.
-   **Data Density:** The UI is designed for high information density, utilizing compact tables and visualizations (like Recharts and React-Force-Graph) to provide maximum context at a glance without excessive scrolling.
-   **Bilingual Consistency:** All user-facing text, including labels, alerts, and AI-generated narratives, must be strictly consistent across English and Bengali localizations, maintaining typographical integrity for both languages.

## Brand Messaging

-   **Sovereign Defense:** The core brand message focuses on independence, data privacy, and local control. CloverShield is presented as a "Digital Immune System" that empowers local institutions with world-class AI without compromising data sovereignty.

## Data Handling & Privacy

-   **Masking by Default:** To minimize exposure, sensitive information such as full account numbers, customer names, and balance details are masked in the UI by default. Analysts must perform a deliberate action (e.g., click-to-reveal) to see unmasked data.
-   **Strict Audit Logging:** Every interaction with sensitive data, including views and decision actions (Block/Approve), is automatically captured in a secure audit log with timestamps and the analyst's identity.

## AI Communication

-   **Confidence & Drivers:**
    -   **Probability Ranges:** Fraud risk is communicated via clear percentage scores (0-100%) visualized through color-coded "FraudGauges".
    -   **Categorization:** Transactions are clearly bucketed into "Safe", "Suspicious", or "High Risk" categories.
    -   **Risk Drivers:** For every decision, the top contributing features (Risk Drivers) are highlighted based on SHAP values, providing the "Why" behind the AI's score.
