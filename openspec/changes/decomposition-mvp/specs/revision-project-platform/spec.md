## ADDED Requirements

### Requirement: Revision-safe project backbone

The platform MUST provide revision and project services that persist project
identity, asset references, and design revision lifecycle state for every
downstream engineering module.

#### Scenario: Start a new engineering revision

- **WHEN** a user branches or creates a new design revision
- **THEN** the system creates a revision record with parent linkage, approval
  state, author metadata, and asset reference scope
- **AND** downstream import, graph, and export operations bind to that revision.
