## ADDED Requirements

### Requirement: ZBrush-oriented import package contract

The first production import adapter MUST define a stable package contract for
ZBrush-led sculpt workflows, including file references, subtool mapping, unit
assumptions, and normalized output references.

#### Scenario: Import a sculpt package into a working revision

- **WHEN** a user submits a ZBrush-origin package for import
- **THEN** the adapter records package metadata, source artifacts, unit
  assumptions, and subtool hierarchy mappings
- **AND** produces normalized `SourceGeometry` records and import diagnostics.

### Requirement: ZBrush subtool to assembly mapping

The adapter MUST map ZBrush subtools or equivalent sculpt partitions into
assembly/part-graph compatible structures without losing source provenance.

#### Scenario: Preserve subtool provenance

- **WHEN** a sculpt package contains multiple named subtools
- **THEN** each imported normalized geometry node retains its original subtool
  name, source path, and package membership
- **AND** the assembly-part graph can reference those imported nodes directly.
