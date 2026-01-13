# Specification: One Command Deploy & Documentation Update

## Overview
This track aims to solidify the "One Command Deploy" selling point of CloverShield. We will create simplified deployment scripts for Windows and Unix-based systems and update the documentation to highlight this capability as a core "Sovereign AI" feature.

## Functional Requirements
1.  **Deployment Scripts:**
    -   `deploy.sh` (Linux/Mac): Check/install dependencies (Docker), copy env templates if missing, and run `docker-compose up`.
    -   `deploy.bat` (Windows): Similar functionality for Windows environments.
    -   The scripts should be robust and handle basic error checking (e.g., is Docker running?).
2.  **Documentation Updates:**
    -   **README.md:**
        -   Replace/Enhance "Quick Start" with the new script method.
        -   Add a "Why One Command?" box explaining the value (Ease of use for non-tech analysts, Speed).
    -   **02_Solution_Description.md:**
        -   Add a dedicated section or callout about "Rapid Deployment in Secure Zones."
    -   **03_AI_System_Architecture.md:**
        -   Emphasize the "Portable Container" aspect.

## Non-Functional Requirements
-   **Security:** Scripts must not hardcode secrets. They should prompt or use the template defaults.
-   **Clarity:** Documentation should be accessible to semi-technical users (IT Support at banks).

## Acceptance Criteria
-   `deploy.sh` and `deploy.bat` exist in the root and function correctly.
-   `README.md` prominently features the "One Command" instruction.
-   Other MD files reflect the "One Click / Zero Trust" narrative.
