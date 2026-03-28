## ADDED Requirements

### Requirement: Revision-safe part decomposition

The platform MUST support decomposition of imported source geometry into
manufacturable part definitions while preserving association to the upstream
geometry and revision graph.

#### Scenario: Split a torso into manufacturable parts

- **WHEN** a structural engineer defines split boundaries across an imported
  torso source model
- **THEN** the system creates separate part definitions with recorded split
  intent
- **AND** each part remains linked to the source geometry regions from which it
  was derived.

### Requirement: Manufacturability-aware decomposition controls

The platform MUST support decomposition controls for shelling, wall-thickness
targets, color separation, and pre-paint segmentation markers.

#### Scenario: Mark a color-separated armor shell

- **WHEN** the user decomposes a part that will use multiple material or paint
  treatments
- **THEN** the system allows the user to mark color or pre-paint segmentation
  intent
- **AND** downstream connector, runner, and tooling modules can consume those
  markings.
