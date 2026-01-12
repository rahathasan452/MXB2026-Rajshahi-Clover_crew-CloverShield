# Specification: Enhanced Network Graph Features

## Overview
This track aims to upgrade the existing "Customer 360" Network Graph into a proactive investigative tool. Analysts will benefit from automated pattern detection, visual risk gradients, deep-dive expansion capabilities, and comprehensive data export for SAR (Suspicious Activity Report) documentation.

## User Story
As a Fraud Analyst, I want the network graph to automatically point out suspicious clusters and let me explore second-degree connections easily, so I can uncover complex fraud rings that aren't obvious from single transactions.

## Functional Requirements

### 1. Automated Fraud Ring Highlighting
- **Star/Mule Detection:** Automatically identify and highlight "Hub and Spoke" patterns where a single node interacts with a disproportionately high number of unique counterparts.
- **Community Detection:** Implement a clustering algorithm (e.g., Louvain) to visually group and highlight dense sub-networks.
- **Visual Feedback:** Use distinct visual cues (e.g., colored borders or glowing backgrounds) to distinguish detected rings.

### 2. Risk-Based Node Coloring
- **Color Gradient:** Update node colors based on their XGBoost fraud probability score (e.g., Green/Emerald for low risk, Yellow for medium, Red for high risk).
- **Dynamic Legend:** Provide a small legend explaining the risk-color mapping.

### 3. "Deep Dive" Network Expansion
- **2nd-Degree Expansion:** On-click action ("Expand") for any node to fetch and render all its direct connections (1st degree) and their connections (2nd degree).
- **Comprehensive Fetch:** Ensure all transactions (Send/Receive) for the target node are retrieved and visualized.

### 4. Evidence Export
- **Multi-Format Export:** A single action that generates both a visual snapshot (Image) and a data manifest (CSV or JSON).
- **Data Scope:** The export must include metadata for all currently visible nodes and edges in the viewport.

## Non-Functional Requirements
- **Performance:** Expanding a network to the 2nd degree should maintain a responsive frame rate (>30fps) for clusters up to 500 nodes.
- **Visual Consistency:** Adhere to the "Emerald-on-Dark" Analyst Station aesthetic defined in `product.md`.

## Acceptance Criteria
- [ ] Graph successfully identifies and highlights a simulated "Mule" cluster.
- [ ] Nodes are colored correctly according to their risk probability scores.
- [ ] Clicking "Expand" on a node reveals neighbors that were previously hidden.
- [ ] The "Export" button successfully downloads both an image and a data file.

## Out of Scope
- Real-time streaming updates of the graph layout.
- Permanent persistence of custom graph layouts (reset on page reload is acceptable).
