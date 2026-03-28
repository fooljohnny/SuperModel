# API Surface Draft

## 1. Goal

Define the first API surface needed to support the decomposition-first MVP. The
API is revision-centric and job-aware.

## 2. API style

- External application API: JSON over HTTPS
- Async jobs: job resource + polling or event subscription
- Internal service contracts: may later use gRPC or queue messages, but the MVP
  should first standardize resource semantics

## 3. Core resources

- `projects`
- `revisions`
- `source-geometries`
- `import-jobs`
- `assembly-nodes`
- `part-definitions`
- `split-definitions`
- `connector-templates`
- `connector-instances`
- `verification-jobs`
- `verification-results`
- `runner-sheets`
- `tooling-export-jobs`
- `tooling-export-packages`

## 4. Recommended first endpoints

## 4.1 Project and revision lifecycle

### `POST /api/projects`

Creates a product project.

Request:

```json
{
  "name": "Project Aegis",
  "marketSegment": "professional-desktop",
  "targetDifficulty": "advanced",
  "targetPartCount": 180
}
```

Response:

```json
{
  "projectId": "proj_01",
  "name": "Project Aegis",
  "status": "active"
}
```

### `POST /api/projects/{projectId}/revisions`

Creates a child revision.

### `GET /api/revisions/{revisionId}`

Returns revision metadata, checkpoints, and release gating state.

### `POST /api/revisions/{revisionId}/promote`

Attempts to move a revision to the next lifecycle state.

## 4.2 Source geometry import

### `POST /api/revisions/{revisionId}/source-geometries`

Registers a new import candidate and upload session.

Request:

```json
{
  "sourceSystem": "zbrush",
  "declaredFileFormat": "obj",
  "sourceFilename": "aegis_torso.obj",
  "unitSystem": "mm"
}
```

Response:

```json
{
  "sourceGeometryId": "geom_01",
  "uploadUrl": "https://example.invalid/upload",
  "importStatus": "pending"
}
```

### `POST /api/source-geometries/{sourceGeometryId}/import`

Starts the normalization/import job.

### `GET /api/import-jobs/{jobId}`

Returns job state, diagnostics, and output artifact references.

## 4.3 Assembly and part graph

### `POST /api/revisions/{revisionId}/assembly-nodes`

Creates or imports assembly nodes.

### `GET /api/revisions/{revisionId}/assembly-graph`

Returns the graph snapshot for authoring and review.

### `POST /api/revisions/{revisionId}/part-definitions`

Creates a part definition directly or from a split operation.

## 4.4 Part decomposition

### `POST /api/revisions/{revisionId}/split-definitions`

Creates a split definition and derived parts.

Request:

```json
{
  "sourceGeometryId": "geom_01",
  "splitMethod": "manual-surface-boundary",
  "boundaries": [
    {
      "boundaryId": "bnd_01",
      "boundaryType": "surface-curve"
    }
  ],
  "resultingParts": [
    {
      "partCode": "A1",
      "displayName": "Torso Outer Armor"
    }
  ]
}
```

### `GET /api/part-definitions/{partId}`

Returns the revision-bound part definition with associativity and impact state.

## 4.5 Connector engineering

### `GET /api/connector-templates`

Lists standard and company-specific templates.

### `POST /api/revisions/{revisionId}/connector-instances`

Creates a connector placement.

### `POST /api/revisions/{revisionId}/connector-suggestions`

Requests semi-automatic connector suggestions.

## 4.6 Verification

### `POST /api/revisions/{revisionId}/verification-jobs`

Starts a deterministic or asynchronous verification job.

Request:

```json
{
  "verificationKinds": ["interference", "tolerance", "kinematic"],
  "targetEntityIds": ["part_A1", "conn_07"]
}
```

### `GET /api/verification-jobs/{jobId}`

Returns verification progress and summary.

### `GET /api/revisions/{revisionId}/verification-results`

Lists verification artifacts for the revision.

## 4.7 Runner and tooling export

### `POST /api/revisions/{revisionId}/runner-sheets`

Creates a runner sheet candidate from approved parts.

### `POST /api/revisions/{revisionId}/tooling-export-jobs`

Starts generation of a tooling export package.

Request:

```json
{
  "packageType": "cnc",
  "exportFormat": "tooling-manifest-v1",
  "includedRunnerSheetIds": ["runner_01"]
}
```

### `GET /api/tooling-export-jobs/{jobId}`

Returns export job status and output references.

### `GET /api/tooling-export-packages/{toolingExportId}`

Returns package metadata and artifact URIs.

## 5. Error model

Responses should use stable machine-readable codes:

- `REVISION_STATE_BLOCKED`
- `IMPORT_NORMALIZATION_FAILED`
- `GEOMETRY_DIAGNOSTIC_BLOCKING`
- `PART_REFERENCE_INVALID`
- `VERIFICATION_REQUIRED`
- `EXPORT_BLOCKED_BY_STALE_ENTITY`
- `ADAPTER_UNSUPPORTED_FORMAT`

Example:

```json
{
  "error": {
    "code": "EXPORT_BLOCKED_BY_STALE_ENTITY",
    "message": "Runner export blocked by stale part definitions.",
    "details": {
      "staleEntityIds": ["part_A1", "part_A3"]
    }
  }
}
```

## 6. Event hooks

The platform should also emit events for:

- `revision.created`
- `source-geometry.imported`
- `source-geometry.import-failed`
- `part-definition.created`
- `connector-instance.locked`
- `verification.completed`
- `runner-sheet.created`
- `tooling-export.completed`
- `entity.marked-stale`

## 7. MVP recommendation

The first implementation pass should support:

1. project + revision creation
2. source geometry registration and import jobs
3. assembly graph retrieval
4. split definition creation
5. connector placement
6. verification job execution
7. tooling export job execution
