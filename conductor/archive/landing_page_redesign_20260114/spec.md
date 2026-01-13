# Specification: Landing Page Redesign

## Overview
Redesign the main landing page (`frontend/app/page.tsx`) to reflect the "Sovereign AI Fraud Analyst Workstation" branding. The new design should be "Cyber-Industrial" (Dark, Emerald, Mono-spaced accents) and highlight the 6 key modules: Copilot, Hybrid Scanner, Graph, Policy Lab, Audit Trail, and Model Registry.

## Functional Requirements
1.  **Hero Section:**
    *   Headline: "Sovereign AI Defense for Financial Frontiers".
    *   Subhead: "Deploy on-premise. Detect in <200ms. Explain every decision."
    *   Visual: Abstract data stream or "radar" motif.
2.  **Feature Grid (The Digital Immune System):**
    *   **Hybrid Engine:** XGBoost + SQL Rules.
    *   **Analyst Copilot:** "Your AI Partner" (Chatbot).
    *   **Graph Intelligence:** "Follow the money".
    *   **Governance:** Audit Logs & SAR Generation.
    *   **Model Registry:** Code-free retraining.
    *   **Secure Bridge:** QR Code evidence import.
3.  **Technical Deep Dive:**
    *   Showcase "Zero Trust" architecture (Docker, Air-gapped).
    *   Highlight "Transparent AI" (SHAP values).
4.  **Footer:**
    *   Simple, professional, links to Privacy/Terms.

## Non-Functional Requirements
-   **Aesthetic:** "Command Center". Dark mode only.
-   **Typography:** Use `font-mono` for headers, KPIs, and code snippets. `font-sans` for body text.
-   **Performance:** Use Next.js `Image` and lazy loading.
-   **Responsiveness:** Mobile-first stackable grids.

## Acceptance Criteria
-   All new features (Copilot, Registry, etc.) are visible.
-   Design uses the `emerald-500` / `slate-950` palette.
-   No hardcoded hex values where Tailwind classes suffice.
