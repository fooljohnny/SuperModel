## ADDED Requirements

### Requirement: Structural decomposition first-release workflow

The first commercial release MUST prioritize structural decomposition and
engineering refinement over downstream instruction-authoring breadth.

#### Scenario: Decompose a sculpt-led source model

- **WHEN** a user imports concept geometry originating from ZBrush or an
  equivalent sculpting workflow
- **THEN** the system supports conversion into a revisioned assembly graph and
  manufacturable part definitions
- **AND** connector, tolerance, and runner downstream workflows operate on those
  derived parts without losing upstream traceability.

### Requirement: Priority CAD and DCC interoperability order

The platform MUST implement import and interoperability work in this priority
order unless a documented business need overrides it:
ZBrush, SolidWorks, Siemens NX, Blender, Maya, STEP, Parasolid, IGES, FBX,
glTF.

#### Scenario: Plan adapter implementation order

- **WHEN** the team selects the next interoperability adapter to build
- **THEN** the default decision follows the approved priority list
- **AND** deviations require explicit documentation in architecture or change
  records.
