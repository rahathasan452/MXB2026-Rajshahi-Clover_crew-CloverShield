# CloverShield: Solution Description
## The Sovereign Fraud Analyst Workstation

---

## Core Modules

CloverShield transforms the role of a fraud analyst from a "spreadsheet reviewer" to a "cyber-investigator." The solution is divided into four integrated modules:

### 1. Mission Control (The Dashboard)
**The "Heads-Up Display" for Security Operations.**
- **Investigative Queue:** Uses real-time scoring to prioritize high-risk cases. Analysts stop fishing for fraud and start investigating the top 1% of threats.
- **Language Switcher:** Instantly toggles the entire interface and AI explanations between English and Bengali, empowering local analysts.

### 2. The Fraud Scanner (Real-Time XAI)
**The "Engine Room" of Detection.**
- **Sub-200ms Inference:** Powered by an optimized XGBoost model (trained on temporal splits to handle drift).
- **Explainable AI (XAI):** We don't just say "Block." We use **SHAP (SHapley Additive exPlanations)** to visualize exactly *why*—e.g., "This transaction is 500% higher than the user's median."
- **LLM Synthesis:** A local LLM translates these technical math weights into a plain-English (or Bangla) narrative for the analyst.

### 3. Customer 360 (Network Graph)
**The "Syndicate Hunter."**
- **Interactive Graph Visualization:** Fraud doesn't happen in a vacuum. This tool visualizes the money trail.
- **Star Detection:** Instantly spots "mule accounts" (one central node receiving funds from many victims) or "layering" schemes.
- **Graph Neural Features:** Calculates `PageRank` and `Centrality` scores in real-time to detect reputable vs. suspicious nodes.

### 4. The Policy Lab (Rule Sandbox)
**The "Safe Zone" for Strategy.**
- **Backtesting Engine:** Analysts can write new logic (e.g., `amount > 50000 AND hour == 3 AM`) and test it against historical data *before* deployment.
- **Impact Analysis:** Instantly see: "This rule would have caught 500 frauds but blocked 20 legitimate users (False Positives)."
- **Safe Deployment:** Move from "Guesswork" to "Data-Driven Policy."

### 5. Advanced Case Management
**The "Digital Dossier" for Investigators.**
- **Investigation Checklists:** Standardized SOPs (e.g., "Verify KYC", "Call Customer") ensure no step is missed during a review.
- **Status Tracking:** Track cases from "Open" to "Under Review" to "Closed" with assigned owners.
- **Quick Actions:** One-click Freeze/Unfreeze accounts directly from the case file.

### 6. The Analyst Copilot (AI Chatbot)
**The "24/7 Expert Assistant."**
- **Natural Language Queries:** "Show me all high-risk transfers from the last hour" or "Explain the Smurfing pattern."
- **Context-Aware Help:** The bot understands the current screen (e.g., viewing a specific user) and offers relevant insights.
- **Automated Drafting:** Asks the analyst for key details and drafts a formal investigation report in seconds.

### 7. Compliance & Governance
**The "Regulatory Shield."**
- **Immutable Audit Trail:** Every click, view, and decision is logged in Supabase. Who approved this transaction? When? Why?
- **SAR Generator:** Automatically generates a "Suspicious Activity Report" (SAR) narrative formatted for the Bangladesh Financial Intelligence Unit (BFIU), summarizing the fraud pattern and evidence.

---

## Analyst Workflow: The Investigation Loop

```mermaid
flowchart TD
    subgraph "Phase 1: Automated Detection"
        TX[Live Transaction Stream] --> MODEL[XGBoost Inference]
        MODEL --> DECISION{Risk Score}
        DECISION -->|Score < 0.3| PASS[Auto-Approve]
        DECISION -->|Score > 0.7| BLOCK[Auto-Block]
        DECISION -->|0.3 < Score < 0.7| QUEUE[Investigative Queue]
    end

    subgraph "Phase 2: Analyst Investigation"
        QUEUE --> ASSIGN[Assign to Analyst]
        ASSIGN --> DASH[Mission Control]
        DASH --> EXPLAIN[Check XAI Reasons]
        DASH --> GRAPH[Trace Network Graph]
        DASH --> COPILOT[Ask AI Assistant]
        
        GRAPH --> VERDICT{Final Verdict}
        VERDICT -->|False Alarm| RELEASE[Release Transaction]
        VERDICT -->|Confirmed Fraud| CASE[Create Case File]
    end

    subgraph "Phase 3: Action & Compliance"
        CASE --> CHECK[Complete Checklist]
        CHECK --> SAR[Generate SAR Report]
        SAR --> BAN[Ban User & Network]
        BAN --> AUDIT[Log to Audit Trail]
    end
    
    style PASS fill:#10b981,color:#fff
    style BLOCK fill:#ef4444,color:#fff
    style QUEUE fill:#f59e0b,color:#fff
    style ASSIGN fill:#3b82f6,color:#fff
    style SAR fill:#8b5cf6,color:#fff
```

### Step-by-Step Investigation

1.  **Automated Triage:** The XGBoost model acts as the first line of defense.
2.  **Assignment:** A senior analyst picks a high-priority alert from the queue.
3.  **Deep Dive:** They consult the **Analyst Copilot** ("Is this typical behavior for this user?") and trace funds on the **Network Graph**.
4.  **Case Creation:** Fraud is confirmed. A case file is opened, and the **Investigation Checklist** is followed.
5.  **Reporting:** The **SAR Generator** creates a formal report for the authorities.
6.  **Closure:** The user is banned, and the entire timeline is saved to the **Audit Trail**.

---

## Comparative Advantage: Why Sovereign?

| Feature | ☁️ Traditional Cloud SaaS | 🛡️ CloverShield (Sovereign AI) |
| :--- | :--- | :--- |
| **Data Privacy** | ❌ Sends data to foreign servers | ✅ **100% On-Premise** (Dockerized) |
| **Compliance** | ❌ Risks violating Bank Acts | ✅ **Fully Compliant** with BD Law |
| **Latency** | ⚠️ Internet-dependent (>500ms) | ✅ **LAN Speed** (<200ms) |
| **Customization**| ❌ Generic "Global" Models | ✅ **Custom-Trained** on YOUR data |
| **Cost** | 💰 High Monthly Fees (API Calls) | 💵 **Low Flat Cost** (Own Infrastructure) |

---

## Technical Architecture: The "Sovereign Box"

To ensure **Data Sovereignty**, the architecture is strictly containerized.

```mermaid
graph TB
    subgraph "Client Infrastructure (On-Premise)"
        subgraph "Docker Container: CloverShield"
            UI["Next.js Dashboard<br/>(The Workstation)"]
            API["FastAPI Inference Engine<br/>(The Brain)"]
            DB[("Supabase/Postgres)<br/>(The Vault")]
            
            UI -->|Internal Network| API
            UI -->|Internal Network| DB
            API -->|Read/Write| DB
        end
        
        DATA[Private Bank Data] -->|Secure Mount| API
    end
    
    TRAIN[Training Notebook] -.->|Generates| MODEL[Model.pkl]
    MODEL -->|Loaded into| API
    
    style UI fill:#3b82f6,color:#fff
    style API fill:#10b981,color:#fff
    style DB fill:#f97316,color:#fff
```

**Key Components:**

1.  **Frontend (Next.js):** A responsive, dark-mode optimized interface designed for operation centers (SOCs).
2.  **ML API (FastAPI):** Handles 15-feature extraction pipeline and XGBoost inference.
3.  **Local Training Pipeline:** A Jupyter Notebook included in the package allows the bank's data science team to retrain the model on their *real* data without exposing it to us.

---

**Team:** Clover Crew | **Location:** Rajshahi | **Competition:** National AI Build-a-thon 2026 (MXB2026)
