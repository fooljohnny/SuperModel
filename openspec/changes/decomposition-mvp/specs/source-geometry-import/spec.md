## ADDED Requirements

### Requirement: MVP geometry import adapters

The MVP MUST establish source-geometry import flows beginning with ZBrush-led
mesh ingestion and then extending to CAD-origin workflows needed by structural
engineering.

#### Scenario: Import a ZBrush-led concept file

- **WHEN** a user imports sculpt-origin geometry selected for structural
  decomposition
- **THEN** the system stores the imported artifact as `SourceGeometry`
- **AND** records file provenance, units, hierarchy, and topology fingerprints
- **AND** makes the imported geometry available to the assembly/part graph.

### Requirement: Import normalization contract

The import layer MUST normalize imported geometry into a canonical internal
representation that downstream decomposition, connector, and verification
modules can consume without depending on the source adapter.
