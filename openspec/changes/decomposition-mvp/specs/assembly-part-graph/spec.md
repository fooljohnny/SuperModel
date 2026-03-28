## ADDED Requirements

### Requirement: Revisioned assembly and part graph

The system MUST persist a revisioned assembly graph that binds imported source
geometry, assembly nodes, and manufacturable part definitions under stable IDs.

#### Scenario: Create a part graph after import

- **WHEN** imported source geometry is promoted into a design revision
- **THEN** the system creates assembly nodes and part placeholders under stable
  revision-scoped identifiers
- **AND** downstream decomposition, connector, verification, and runner modules
  can reference those identifiers without copying geometry state.

### Requirement: Associative upstream-downstream references

The assembly and part graph MUST preserve traceable references from derived parts
back to source geometry and split definitions.

#### Scenario: Mark downstream artifacts stale after upstream change

- **WHEN** a source geometry region or assembly node changes
- **THEN** the system marks affected part definitions and dependent artifacts as
  recomputable, stale, or invalid
- **AND** the affected status is queryable by other modules before release.
