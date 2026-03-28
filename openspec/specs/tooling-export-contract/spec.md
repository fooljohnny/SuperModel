# Capability Spec: Tooling Export Contract

## Purpose

Define the contract for release-ready CNC, mold-review, and runner-oriented
manufacturing export packages.

## Why this capability exists

The first commercial release must produce manufacturing outputs that are
trustworthy, revision-bound, and consumable by tooling workflows. The export
contract must therefore define package structure, release gating, and manifest
semantics before implementation begins.

## Functional requirements

### Requirement: Export package manifest

The system MUST emit a structured manifest for every tooling export package.

#### Scenario: Generate a CNC tooling export package

- **WHEN** a user exports a release-approved tooling package
- **THEN** the system generates a manifest containing package identity, revision
  identity, included parts, runner references, verification summary, and
  artifact references
- **AND** the manifest becomes the source of truth for downstream package
  inspection and audit.

### Requirement: Revision and verification traceability

Tooling export packages MUST include enough metadata to trace every included
entity back to the originating revision and validation state.

#### Scenario: Review a mold package before handoff

- **WHEN** a manufacturing engineer opens an export package
- **THEN** the package identifies the revision, release state, part IDs, runner
  sheet IDs, material assumptions, and blocking verification waivers if any
- **AND** the package exposes whether the export was generated from a fully
  verified or exception-approved state.

### Requirement: Export gating

The system MUST refuse release-state export if required upstream conditions are
not met.

#### Scenario: Block package generation for stale parts

- **WHEN** a tooling export request includes stale parts, stale runner sheets, or
  unresolved blocking verification failures
- **THEN** the system rejects the release export
- **AND** reports the exact entities and reasons that prevented export.

### Requirement: Export profile support

The system SHOULD support named export profiles for different downstream
manufacturing workflows.

#### Scenario: Choose between mold review and CNC package profiles

- **WHEN** a user selects an export profile
- **THEN** the system applies profile-specific artifact requirements and manifest
  fields
- **AND** records the selected profile in the generated package metadata.

## Manifest expectations

The export package manifest SHOULD include:

- `tooling_export_id`
- `package_type`
- `profile_name`
- `revision_id`
- `release_state`
- `generated_at`
- `generated_by`
- `included_parts[]`
- `included_runner_sheets[]`
- `verification_summary`
- `artifact_entries[]`
- `material_context[]`
- `waivers[]`

## Dependencies

- `revision-project-platform`
- `runner-tooling-export`
- `verification-workbench`
- `data-contracts`

## Non-functional requirements

- Export manifests MUST be deterministic for a given revision snapshot and
  export profile.
- Package artifacts MUST use stable references that can be audited later.
- Export failure messages MUST be actionable for engineering and manufacturing
  users.
