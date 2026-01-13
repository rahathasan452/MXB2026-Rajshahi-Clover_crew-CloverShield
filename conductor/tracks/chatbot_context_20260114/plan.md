# Implementation Plan - Chatbot Context

## Phase 1: Context Aggregation
- [x] Task: Create `ml-api/utils/prompts.py`.
    - [x] Sub-task: Read `USER_GUIDE.md`, `02_Solution_Description.md`, `03_AI_System_Architecture.md`.
    - [x] Sub-task: Synthesize them into a Python string variable `SYSTEM_PROMPT`.

## Phase 2: Backend Integration
- [x] Task: Update `ml-api/main.py`.
    - [x] Sub-task: Import `SYSTEM_PROMPT` from `utils.prompts`.
    - [x] Sub-task: Replace the hardcoded prompt in `/chat` endpoint.

## Phase 3: Verification
- [ ] Task: Conductor - User Manual Verification 'Chatbot Context' (Protocol in workflow.md).
