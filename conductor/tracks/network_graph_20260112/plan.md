# Plan: Enhanced Network Graph Features

## Phase 2: Automated Ring & Cluster Detection
- [x] Task: Implement a "Star/Mule" detection utility in the frontend to identify nodes with high degree centrality [4320de9]
- [x] Task: Integrate `graphology` or similar lightweight library for Community Detection (Louvain) [3090a29]
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
