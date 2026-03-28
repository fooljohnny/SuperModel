## design-orchestrator

Minimal orchestration service for the first executable SuperModel MVP slice.

Current implemented vertical slice:

- create project
- create revision
- register source geometry
- create import job
- complete import job
- query revision/import status

Current implementation notes:

- uses a lightweight Node + TypeScript HTTP server
- uses in-memory state for now so contracts and API flow can be validated quickly
- is intended to be replaced by persistent repositories backed by PostgreSQL in the
  next step
