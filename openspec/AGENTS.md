## Repository working agreement

- Treat `openspec/specs/` as the current source of truth.
- Record non-trivial architectural changes under `openspec/changes/`.
- Keep manufacturing-domain terminology precise and consistent across docs and code.
- Prefer thin app shells and reusable domain services.
- Protect desktop-grade performance for geometry-heavy workflows.

## Documentation baseline

- `openspec/project.md` defines global constraints and engineering principles.
- `docs/architecture/` stores architecture overviews and ADRs.
- `docs/requirements/` stores roadmap and requirement decomposition.

## Change management

For new capabilities or meaningful scope changes:

1. Create a folder in `openspec/changes/<change-name>/`
2. Add `proposal.md`, `design.md`, and `tasks.md`
3. Add or update spec deltas under `openspec/changes/<change-name>/specs/`
4. Implement only after the intended change is explicit
