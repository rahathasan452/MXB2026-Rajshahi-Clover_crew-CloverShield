# Initial Concept

**CloverShield: Sovereign AI Fraud Analyst Workstation**

**Goal:** Create a "Sovereign AI" solution that runs entirely on-premise (via Docker) to ensure data privacy ("Zero-Trust Deployment"). The system combines a high-performance XGBoost model for real-time risk scoring (<200ms) with Explainable AI (SHAP + LLM) to give human analysts clear reasons for every "Block" decision.

## Target Users

-   **Fraud Analysts at Mobile Financial Services (MFS) providers:** The primary operators of the workstation, responsible for monitoring transactions, investigating alerts, and making final decisions on blocked activities.

## Core Goals

-   **Real-time Fraud Detection:** Minimize financial losses by identifying and blocking fraudulent transactions in under 200ms using a high-performance XGBoost model.
-   **Explainable AI (XAI):** Empower human analysts with transparent decision-making support. The system provides clear, "human-in-the-loop" explanations for every flagged transaction using SHAP values and LLM-generated narratives.
-   **Sovereign Data Privacy:** Ensure complete data sovereignty and zero-trust security by designing the system for strictly on-premise, air-gapped deployment via Docker, preventing sensitive financial data from ever leaving the secure local environment.

## Key Features

-   **Mission Control Dashboard:** A localized "Security HUD" built with Next.js 14, prioritizing high-risk transactions and offering full bilingual (English/Bangla) support.
-   **Fraud Scanner:** A Hybrid Detection Engine combining real-time XGBoost risk scoring with active SQL rules, providing immediate feedback on transaction legitimacy.
-   **Customer 360 Network Graph:** Advanced visualization tool with on-demand expansion (up to 2nd degree) and risk-based node coloring for tracing complex fraud rings.
-   **Policy Lab:** A sandbox environment for backtesting and deploying new fraud detection rules, allowing analysts to instantly block new vectors without model retraining.
-   **Analyst Copilot:** An LLM-powered chatbot assistant that provides context-aware insights, explains fraud patterns, and drafts reports.
-   **Audit Trail:** A comprehensive, immutable record of system activities, ML predictions, and analyst decisions, ensuring regulatory compliance and "Sovereign Defense" integrity.
- **Case Management Station:** A dedicated workflow for deep-dive investigations, featuring persistent checklists, automated SAR generation for BFIU reporting, and collaborative tracking through explicit analyst assignments.
-   **Model Registry:** A code-free interface for uploading datasets, retraining models, and hot-swapping versions, democratizing AI maintenance for non-technical teams.
-   **Model Health Monitor:** Real-time tracking of concept drift and system latency to ensure continued reliability.
-   **Secure QR Data Bridge:** An air-gapped mechanism for importing external evidence via QR codes, maintaining the zero-trust environment.
