# Specification: Analyst User Guide Documentation

## Overview
This track focuses on creating a comprehensive "Analyst User Guide" to empower end-users (fraud analysts) to effectively utilize the full suite of CloverShield features. Instead of cluttering the main `README.md`, we will create a dedicated `USER_GUIDE.md` file and link to it. This guide will cover end-to-end workflows, from investigation to policy creation.

## Functional Requirements
1.  **Create `USER_GUIDE.md`:**
    -   Create a new file in the root directory named `USER_GUIDE.md`.
    -   **Section 1: Investigation Workflow:** Step-by-step guide on picking an alert, using the Graph, consulting the Chatbot, and making a decision.
    -   **Section 2: Policy Lab:** How to write a rule (syntax examples), backtest it, and deploy it.
    -   **Section 3: Evidence Import:** Detailed instructions on using the QR Code Bridge (generating the QR, scanning it).
    -   **Section 4: Compliance & Reporting:** How to generate a SAR, complete a checklist, and view the Audit Trail.
    -   **Section 5: Model Management:** How to use the Model Registry to upload data and retrain.
2.  **Update `README.md`:**
    -   Add a prominent "📚 Analyst User Guide" section or link near the top (e.g., under "Project Overview" or "Setup").
    -   Ensure the link points correctly to `./USER_GUIDE.md`.

## Non-Functional Requirements
-   **Clarity:** Use simple, direct language suitable for non-technical analysts.
-   **Visuals (Text-Based):** Use clear headers, bullet points, and code blocks (for rule examples) to make the guide scannable.
-   **Tone:** Professional, helpful, and instructional ("Click this," "Select that").

## Acceptance Criteria
-   `USER_GUIDE.md` exists and covers all 5 requested workflows (Investigation, Policy, Import, Reporting, Model).
-   `README.md` has a clear, working link to the new guide.
-   The guide provides sufficient detail for a new analyst to perform their daily tasks without external help.

## Out of Scope
-   Creating video tutorials or screenshots (text-based guide only for now).
