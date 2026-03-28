## ADDED Requirements

### Requirement: Manufacturing-first release outputs

The first release MUST prioritize output packages for structural engineering,
runner preparation, and CNC or mold-processing handoff ahead of consumer-facing
documentation deliverables.

#### Scenario: Publish manufacturing package for release candidate

- **WHEN** a design revision reaches release-candidate status
- **THEN** the system produces part-structure data, runner-sheet data, and CNC or
  mold-processing data as the required deliverables
- **AND** instruction assets remain optional in the first release gate.
