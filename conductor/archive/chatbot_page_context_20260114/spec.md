# Specification: Enhanced Page Context

## Overview
Currently, the chatbot receives `User is currently on page: /some/path`. We want to send a semantic description of the page to help the LLM provide better assistance.

## Functional Requirements
1.  **Context Mapping:**
    -   `/dashboard` -> "Main Mission Control. User is monitoring high-level stats and alerts."
    -   `/dashboard/scanner` -> "Fraud Scanner / Simulator. User is testing transactions or viewing real-time feeds."
    -   `/dashboard/graph` -> "Network Graph. User is investigating money laundering rings and connections."
    -   `/dashboard/cases` -> "Case Management. User is working on open investigations or SARs."
    -   `/dashboard/policy` -> "Policy Lab. User is writing or testing new fraud detection rules."
    -   `/dashboard/settings` -> "System Settings & Audit Log."
2.  **Implementation:**
    -   Implement this logic in `frontend/components/Chatbot.tsx`.

## Acceptance Criteria
-   Chatbot receives the descriptive text in the API call.
