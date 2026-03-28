## ADDED Requirements

### Requirement: Connector template library for structural kits

The system MUST provide a reusable connector template library for kit-oriented
structural features, including pegs, sockets, snap-fits, ribs, and
reinforcement patterns.

#### Scenario: Select a standard connector template

- **WHEN** a structural engineer chooses a connector family for two parts
- **THEN** the system presents compatible templates filtered by material class,
  motion expectations, and wall-thickness constraints
- **AND** records the selected template identity in the design revision.

### Requirement: Semi-automatic connector placement

The system MUST support semi-automatic connector placement proposals derived
from part adjacency, assembly direction, and fit rules, while preserving manual
override.

#### Scenario: Propose peg-and-socket placement

- **WHEN** two split parts expose a candidate join boundary
- **THEN** the system can propose one or more connector placements
- **AND** each proposal records placement frames, estimated assembly direction,
  and fit assumptions
- **AND** the engineer can accept, reject, or lock individual placements.
