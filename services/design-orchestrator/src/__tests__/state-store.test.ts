import { describe, it, expect, beforeEach, afterAll } from "vitest";
import type { IStateStore } from "../repository.js";
import { StateStore } from "../state.js";
import type {
  CreateProjectInput,
  CreateRevisionInput,
  RegisterSourceGeometryInput,
} from "../contracts.js";

function storeTests(createStore: () => IStateStore | Promise<IStateStore>) {
  let store: IStateStore;

  beforeEach(async () => {
    store = await createStore();
  });

  afterAll(async () => {
    if (store) await store.close();
  });

  // ── helpers ───────────────────────────────────────────────────────────────

  const projectInput: CreateProjectInput = {
    name: "TestProject",
    marketSegment: "professional-desktop",
    targetDifficulty: "advanced",
    targetPartCount: 120,
    createdBy: "test-user",
  };

  async function createProjectAndRevision() {
    const project = await store.createProject(projectInput);
    const revisionInput: CreateRevisionInput = {
      projectId: project.projectId,
      revisionLabel: "R1",
      summary: "first revision",
      createdBy: "test-user",
    };
    const revision = await store.createRevision(revisionInput);
    return { project, revision };
  }

  async function fullChain() {
    const { project, revision } = await createProjectAndRevision();
    const geometryInput: RegisterSourceGeometryInput = {
      sourceGeometryId: `geom_test_${Date.now()}`,
      revisionId: revision.revisionId,
      sourceSystem: "zbrush",
      declaredFileFormat: "obj",
      sourceFilename: "torso.obj",
      unitSystem: "mm",
      createdBy: "test-user",
    };
    const geometry = await store.registerSourceGeometry(geometryInput);
    const importJob = await store.startImportJob({
      jobId: `ijob_test_${Date.now()}`,
      projectId: project.projectId,
      revisionId: revision.revisionId,
      sourceGeometryId: geometry.sourceGeometryId,
      adapterName: "zbrush-import-adapter",
      requestedBy: "test-user",
    });
    return { project, revision, geometry, importJob: importJob! };
  }

  // ── projects ──────────────────────────────────────────────────────────────

  describe("projects", () => {
    it("creates a project with all fields", async () => {
      const p = await store.createProject(projectInput);
      expect(p.projectId).toMatch(/^proj_/);
      expect(p.name).toBe("TestProject");
      expect(p.marketSegment).toBe("professional-desktop");
      expect(p.targetDifficulty).toBe("advanced");
      expect(p.targetPartCount).toBe(120);
      expect(p.status).toBe("active");
      expect(p.createdBy).toBe("test-user");
      expect(p.createdAt).toBeTruthy();
    });

    it("creates a project with only required fields", async () => {
      const p = await store.createProject({
        name: "Minimal",
        marketSegment: "consumer",
        createdBy: "test-user",
      });
      expect(p.targetDifficulty).toBeUndefined();
      expect(p.targetPartCount).toBeUndefined();
    });

    it("lists all projects", async () => {
      const a = await store.createProject({ ...projectInput, name: "A" });
      // Ensure distinct IDs by waiting 1ms
      await new Promise((r) => setTimeout(r, 2));
      const b = await store.createProject({ ...projectInput, name: "B" });
      expect(a.projectId).not.toBe(b.projectId);
      const list = await store.listProjects();
      expect(list.length).toBeGreaterThanOrEqual(2);
      const names = list.map((p) => p.name);
      expect(names).toContain("A");
      expect(names).toContain("B");
    });
  });

  // ── revisions ─────────────────────────────────────────────────────────────

  describe("revisions", () => {
    it("creates a revision under a project", async () => {
      const { revision } = await createProjectAndRevision();
      expect(revision.revisionId).toMatch(/^rev_/);
      expect(revision.state).toBe("draft");
      expect(revision.approvalState).toBe("working");
      expect(revision.revisionLabel).toBe("R1");
    });

    it("rejects revision for non-existent project", async () => {
      await expect(
        store.createRevision({
          projectId: "proj_nonexistent",
          revisionLabel: "R1",
          createdBy: "test-user",
        }),
      ).rejects.toThrow(/not found/i);
    });

    it("rejects revision with non-existent parent", async () => {
      const p = await store.createProject(projectInput);
      await expect(
        store.createRevision({
          projectId: p.projectId,
          revisionLabel: "R1",
          parentRevisionId: "rev_nonexistent",
          createdBy: "test-user",
        }),
      ).rejects.toThrow(/not found/i);
    });

    it("lists revisions for a project", async () => {
      const { project } = await createProjectAndRevision();
      const list = await store.listRevisions(project.projectId);
      expect(list.length).toBeGreaterThanOrEqual(1);
      expect(list[0].revisionLabel).toBe("R1");
    });

    it("gets a single revision", async () => {
      const { revision } = await createProjectAndRevision();
      const fetched = await store.getRevision(revision.revisionId);
      expect(fetched).toBeDefined();
      expect(fetched!.revisionId).toBe(revision.revisionId);
    });

    it("returns undefined for non-existent revision", async () => {
      const r = await store.getRevision("rev_nonexistent");
      expect(r).toBeUndefined();
    });

    it("promotes revision state", async () => {
      const { revision } = await createProjectAndRevision();
      const promoted = await store.promoteRevision(revision.revisionId, "imported");
      expect(promoted).toBeDefined();
      expect(promoted!.state).toBe("imported");
    });

    it("returns undefined when promoting non-existent revision", async () => {
      const r = await store.promoteRevision("rev_nonexistent", "imported");
      expect(r).toBeUndefined();
    });
  });

  // ── source geometries ─────────────────────────────────────────────────────

  describe("source geometries", () => {
    it("registers source geometry under a revision", async () => {
      const { revision } = await createProjectAndRevision();
      const g = await store.registerSourceGeometry({
        sourceGeometryId: `geom_test_${Date.now()}`,
        revisionId: revision.revisionId,
        sourceSystem: "zbrush",
        declaredFileFormat: "obj",
        sourceFilename: "head.obj",
        unitSystem: "mm",
        createdBy: "test-user",
      });
      expect(g.sourceGeometryId).toMatch(/^geom_/);
      expect(g.importStatus).toBe("pending");
      expect(g.impactState).toBe("clean");
      expect(g.diagnostics).toEqual([]);
    });

    it("rejects geometry for non-existent revision", async () => {
      await expect(
        store.registerSourceGeometry({
          sourceGeometryId: `geom_test_${Date.now()}`,
          revisionId: "rev_nonexistent",
          sourceSystem: "zbrush",
          declaredFileFormat: "obj",
          sourceFilename: "test.obj",
          unitSystem: "mm",
          createdBy: "test-user",
        }),
      ).rejects.toThrow(/not found/i);
    });

    it("lists geometries for a revision", async () => {
      const { revision } = await createProjectAndRevision();
      await store.registerSourceGeometry({
        sourceGeometryId: `geom_a_${Date.now()}`,
        revisionId: revision.revisionId,
        sourceSystem: "zbrush",
        declaredFileFormat: "obj",
        sourceFilename: "a.obj",
        unitSystem: "mm",
        createdBy: "test-user",
      });
      const list = await store.listRevisionSourceGeometries(revision.revisionId);
      expect(list.length).toBeGreaterThanOrEqual(1);
    });

    it("gets a single geometry", async () => {
      const { revision } = await createProjectAndRevision();
      const geomId = `geom_single_${Date.now()}`;
      await store.registerSourceGeometry({
        sourceGeometryId: geomId,
        revisionId: revision.revisionId,
        sourceSystem: "blender",
        declaredFileFormat: "fbx",
        sourceFilename: "model.fbx",
        unitSystem: "cm",
        createdBy: "test-user",
      });
      const g = await store.getSourceGeometry(geomId);
      expect(g).toBeDefined();
      expect(g!.sourceSystem).toBe("blender");
    });

    it("returns undefined for non-existent geometry", async () => {
      const g = await store.getSourceGeometry("geom_nonexistent");
      expect(g).toBeUndefined();
    });
  });

  // ── import jobs ───────────────────────────────────────────────────────────

  describe("import jobs", () => {
    it("starts an import job and sets geometry to running", async () => {
      const { geometry, importJob } = await fullChain();
      expect(importJob.jobId).toMatch(/^ijob_/);
      expect(importJob.status).toBe("pending");
      expect(importJob.sourceGeometryId).toBe(geometry.sourceGeometryId);

      const updatedGeom = await store.getSourceGeometry(geometry.sourceGeometryId);
      expect(updatedGeom!.importStatus).toBe("running");
    });

    it("returns undefined when starting job for non-existent geometry", async () => {
      const { project, revision } = await createProjectAndRevision();
      const result = await store.startImportJob({
        jobId: `ijob_test_${Date.now()}`,
        projectId: project.projectId,
        revisionId: revision.revisionId,
        sourceGeometryId: "geom_nonexistent",
        adapterName: "test",
        requestedBy: "test-user",
      });
      expect(result).toBeUndefined();
    });

    it("completes a job successfully and derives revision state", async () => {
      const { revision, importJob } = await fullChain();
      const result = await store.completeImportJob(importJob.jobId, {
        status: "completed",
        progressPercent: 100,
      });
      expect(result).toBeDefined();
      expect(result!.status).toBe("completed");
      expect(result!.importStatus).toBe("completed_with_warnings");
      expect(result!.diagnostics.length).toBeGreaterThan(0);

      const updatedRevision = await store.getRevision(revision.revisionId);
      expect(updatedRevision!.state).toBe("imported");
    });

    it("completes a job with failure and sets revision to invalid", async () => {
      const { revision, importJob } = await fullChain();
      const result = await store.completeImportJob(importJob.jobId, {
        status: "failed",
        progressPercent: 50,
      });
      expect(result).toBeDefined();
      expect(result!.status).toBe("failed");
      expect(result!.errorCode).toBe("IMPORT_FAILED");

      const updatedRevision = await store.getRevision(revision.revisionId);
      expect(updatedRevision!.state).toBe("invalid");
    });

    it("returns undefined when completing non-existent job", async () => {
      const result = await store.completeImportJob("ijob_nonexistent", {
        status: "completed",
        progressPercent: 100,
      });
      expect(result).toBeUndefined();
    });

    it("gets a single import job", async () => {
      const { importJob } = await fullChain();
      const fetched = await store.getImportJob(importJob.jobId);
      expect(fetched).toBeDefined();
      expect(fetched!.jobId).toBe(importJob.jobId);
    });

    it("returns undefined for non-existent import job", async () => {
      const j = await store.getImportJob("ijob_nonexistent");
      expect(j).toBeUndefined();
    });

    it("lists import jobs for a revision", async () => {
      const { revision, importJob } = await fullChain();
      const list = await store.listRevisionImportJobs(revision.revisionId);
      expect(list.length).toBeGreaterThanOrEqual(1);
      expect(list.some((j) => j.jobId === importJob.jobId)).toBe(true);
    });
  });

  // ── composite queries ─────────────────────────────────────────────────────

  describe("composite queries", () => {
    it("returns full revision detail", async () => {
      const { project, revision, geometry, importJob } = await fullChain();
      const detail = await store.getRevisionDetail(revision.revisionId);
      expect(detail).toBeDefined();
      expect(detail!.revision.revisionId).toBe(revision.revisionId);
      expect(detail!.project.projectId).toBe(project.projectId);
      expect(detail!.sourceGeometries.length).toBeGreaterThanOrEqual(1);
      expect(detail!.importJobs.length).toBeGreaterThanOrEqual(1);
    });

    it("returns undefined for non-existent revision detail", async () => {
      const d = await store.getRevisionDetail("rev_nonexistent");
      expect(d).toBeUndefined();
    });

    it("returns a system snapshot", async () => {
      await fullChain();
      const snapshot = await store.getSystemSnapshot();
      expect(snapshot.projects.length).toBeGreaterThanOrEqual(1);
      expect(snapshot.revisions.length).toBeGreaterThanOrEqual(1);
      expect(snapshot.sourceGeometries.length).toBeGreaterThanOrEqual(1);
      expect(snapshot.importJobs.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── ZBrush-specific diagnostics ──────────────────────────────────────────

  describe("diagnostics", () => {
    it("includes ZBrush-specific diagnostics after import completion", async () => {
      const { importJob } = await fullChain();
      const result = await store.completeImportJob(importJob.jobId, {
        status: "completed",
        progressPercent: 100,
      });
      expect(result!.diagnostics).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: "ZB_IMPORT_COMPLETED", severity: "info" }),
          expect.objectContaining({ code: "ZB_UNIT_ASSUMED_MM", severity: "warning" }),
        ]),
      );
    });

    it("includes generic diagnostics for non-ZBrush source", async () => {
      const { project, revision } = await createProjectAndRevision();
      const geomId = `geom_blender_${Date.now()}`;
      await store.registerSourceGeometry({
        sourceGeometryId: geomId,
        revisionId: revision.revisionId,
        sourceSystem: "blender",
        declaredFileFormat: "fbx",
        sourceFilename: "model.fbx",
        unitSystem: "cm",
        createdBy: "test-user",
      });
      const job = await store.startImportJob({
        jobId: `ijob_blender_${Date.now()}`,
        projectId: project.projectId,
        revisionId: revision.revisionId,
        sourceGeometryId: geomId,
        adapterName: "generic-adapter",
        requestedBy: "test-user",
      });
      const result = await store.completeImportJob(job!.jobId, {
        status: "completed",
        progressPercent: 100,
      });
      expect(result!.diagnostics).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: "IMPORT_COMPLETED", severity: "info" }),
        ]),
      );
      expect(result!.importStatus).toBe("completed");
    });
  });
}

// ─── in-memory suite ────────────────────────────────────────────────────────

describe("StateStore (in-memory)", () => {
  storeTests(() => new StateStore());
});

// ─── PostgreSQL suite ───────────────────────────────────────────────────────

const pgUrl = process.env.DATABASE_URL;

if (pgUrl) {
  describe("PgStateStore (PostgreSQL)", () => {
    let pgStore: IStateStore | undefined;

    storeTests(async () => {
      const { default: pg } = await import("pg");
      const { PgStateStore } = await import("../pg-repository.js");
      const { runMigrations } = await import("../migrate.js");
      const pool = new pg.Pool({ connectionString: pgUrl });

      await runMigrations(pool);

      // Clean tables before each run for test isolation
      const client = await pool.connect();
      try {
        await client.query("DELETE FROM import_diagnostics");
        await client.query("DELETE FROM import_jobs");
        await client.query("DELETE FROM source_geometries");
        await client.query("DELETE FROM design_revisions");
        await client.query("DELETE FROM projects");
      } finally {
        client.release();
      }

      pgStore = new PgStateStore(pool);
      return pgStore;
    });

    afterAll(async () => {
      if (pgStore) await pgStore.close();
    });
  });
} else {
  describe.skip("PgStateStore (PostgreSQL) — skipped: DATABASE_URL not set", () => {
    it("placeholder", () => {});
  });
}
