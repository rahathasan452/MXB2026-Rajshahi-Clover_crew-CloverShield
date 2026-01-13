# Specification: Context-Aware Analyst Copilot

## Overview
The goal is to upgrade the "Analyst Copilot" (Chatbot) from a generic assistant to a **context-aware expert** that "knows" the CloverShield documentation, user guide, and system architecture.

## Functional Requirements
1.  **System Prompt Upgrade:**
    *   Ingest content from `USER_GUIDE.md` (Analyst workflows).
    *   Ingest content from `02_Solution_Description.md` (Module definitions).
    *   Define specific "Persona" rules (Tone: Professional, Role: Sovereign AI Support).
2.  **Backend Implementation:**
    *   Move the system prompt logic out of `main.py` into a dedicated `prompts.py` module for maintainability.
    *   Ensure the prompt is injected into every `/chat` request.

## Non-Functional Requirements
-   **Performance:** The prompt shouldn't be so massive it exceeds token limits (though Llama-3.1-8b has a decent window, we should be efficient).
-   **Maintainability:** Hardcoding text in `main.py` is bad. Use a separate file.

## Acceptance Criteria
-   Chatbot can answer questions like "How do I use the Policy Lab?" with specific steps from the User Guide.
-   Chatbot knows about "Zero-Trust" and "Sovereign AI" branding.
