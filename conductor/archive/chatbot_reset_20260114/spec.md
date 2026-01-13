# Specification: Chatbot Reset Button

## Overview
Add a button to the chatbot interface that allows the user to clear the current conversation history and restart the session.

## Functional Requirements
1.  **UI:**
    *   Add a "Trash" or "Refresh" icon button in the Chatbot header (next to the close button).
    *   Tooltip: "Clear History" or "Reset Chat".
2.  **Behavior:**
    *   On click, clear the `messages` array in the `Chatbot` component state.
    *   Reset `inputValue` to empty.
    *   The UI should revert to the "empty state" (showing suggestions).

## Non-Functional Requirements
-   **UX:** Provide immediate feedback (clearing the list).

## Acceptance Criteria
-   Clicking the reset button clears all messages.
-   The "Welcome" suggestions reappear.
