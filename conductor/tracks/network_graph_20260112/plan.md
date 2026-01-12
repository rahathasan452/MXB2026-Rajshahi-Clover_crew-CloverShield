# Plan: Enhanced Network Graph Features

## Phase 1: Risk-Based Visualization & UI Polish
- [x] Task: Update `GraphNode` component to support dynamic color mapping based on `fraud_probability` [686eeed]
- [x] Task: Implement a `RiskLegend` component and integrate it into the Network Graph view [15a12a9]
- [ ] Task: Refactor graph layout to improve spacing and readability for dense clusters
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Risk-Based Visualization & UI Polish' (Protocol in workflow.md)

## Phase 2: Automated Ring & Cluster Detection
- [ ] Task: Implement a "Star/Mule" detection utility in the frontend to identify nodes with high degree centrality
- [ ] Task: Integrate `graphology` or similar lightweight library for Community Detection (Louvain)
- [ ] Task: Add visual "highlighting" effects (glow/borders) for detected fraud rings
- [ ] Task: Create a toggle switch in the UI to enable/disable automated pattern overlays
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Automated Ring & Cluster Detection' (Protocol in workflow.md)

## Phase 3: Interactive Network Expansion
- [ ] Task: Add "Expand" context menu option or button to graph nodes
- [ ] Task: Update the data fetching logic to retrieve 1st and 2nd degree connections on-demand
- [ ] Task: Implement incremental rendering to ensure the graph remains responsive during expansion
- [ ] Task: Add a "Collapse" or "Reset" button to clear expanded views
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Interactive Network Expansion' (Protocol in workflow.md)

## Phase 4: Data & Evidence Export
- [ ] Task: Implement a "Snapshot" utility to capture the current graph viewport as PNG
- [ ] Task: Create a "Data Manifest" generator that exports visible nodes/edges as JSON/CSV
- [ ] Task: Combine both exports into a single "Download Evidence" action (ZIP or dual-file download)
- [ ] Task: Add "Analyst Metadata" (Timestamp, Analyst ID) to the exported files
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Data & Evidence Export' (Protocol in workflow.md)
