## design-orchestrator

Minimal orchestration service for the first executable SuperModel MVP slice.

### Implemented vertical slice

- create project
- create revision
- register source geometry
- create import job
- complete import job
- query revision/import status

### Persistence modes

The service supports two persistence backends, selected automatically at startup:

| Mode | Trigger | Notes |
|------|---------|-------|
| **In-memory** | `DATABASE_URL` not set | Fast iteration, data lost on restart |
| **PostgreSQL** | `DATABASE_URL` set | Runs migrations on boot, data survives restarts |

#### Running with PostgreSQL

```bash
# start the server with PostgreSQL
DATABASE_URL="postgresql://user:pass@localhost:5432/supermodel_dev" pnpm dev

# or run migrations only
DATABASE_URL="postgresql://user:pass@localhost:5432/supermodel_dev" pnpm migrate
```

### Architecture

- `repository.ts` — `IStateStore` interface (async contract for all persistence)
- `state.ts` — In-memory implementation of `IStateStore`
- `pg-repository.ts` — PostgreSQL implementation of `IStateStore`
- `db.ts` — Connection pool management
- `migrate.ts` — Forward-only migration runner (`db/migrations/*.sql`)
- `server.ts` — HTTP server, routes, auto-selects backend on startup
- `contracts.ts` — Re-exports from `@supermodel/contracts` + orchestrator-specific types
