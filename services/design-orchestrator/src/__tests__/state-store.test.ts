import { describe, it, expect, beforeEach, afterAll } from "vitest";
import type { IStateStore } from "../repository.js";
import { InvalidTransitionError } from "../repository.js";
import { StateStore } from "../state.js";
import type {
  CreateProjectInput,
  CreateRevisionInput,
  RegisterSourceGeometryInput,
  RevisionState,
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

    it("promotes revision via valid transition (draft → imported)", async () => {
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

  // ── revision state machine ────────────────────────────────────────────────

  describe("revision state machine", () => {
    it("allows the full happy path: draft → imported → structured → engineered → verified → released", async () => {
      const { revision } = await createProjectAndRevision();
      const transitions: RevisionState[] = ["imported", "structured", "engineered", "verified", "released"];
      let current = revision;
      for (const next of transitions) {
        const promoted = await store.promoteRevision(current.revisionId, next);
        expect(promoted).toBeDefined();
        expect(promoted!.state).toBe(next);
        current = promoted!;
      }
    });

    it("rejects invalid transition draft → released", async () => {
      const { revision } = await createProjectAndRevision();
      await expect(
        store.promoteRevision(revision.revisionId, "released"),
      ).rejects.toThrow(InvalidTransitionError);
    });

    it("rejects invalid transition draft → structured (must go through imported)", async () => {
      const { revision } = await createProjectAndRevision();
      await expect(
        store.promoteRevision(revision.revisionId, "structured"),
      ).rejects.toThrow(InvalidTransitionError);
    });

    it("rejects invalid transition draft → verified", async () => {
      const { revision } = await createProjectAndRevision();
      await expect(
        store.promoteRevision(revision.revisionId, "verified"),
      ).rejects.toThrow(InvalidTransitionError);
    });

    it("allows recovery: imported → invalid", async () => {
      const { revision } = await createProjectAndRevision();
      await store.promoteRevision(revision.revisionId, "imported");
      const invalidated = await store.promoteRevision(revision.revisionId, "invalid");
      expect(invalidated!.state).toBe("invalid");
    });

    it("allows recovery: invalid → draft", async () => {
      const { revision } = await createProjectAndRevision();
      await store.promoteRevision(revision.revisionId, "imported");
      await store.promoteRevision(revision.revisionId, "invalid");
      const recovered = await store.promoteRevision(revision.revisionId, "draft");
      expect(recovered!.state).toBe("draft");
    });

    it("allows recovery: invalid → imported", async () => {
      const { revision } = await createProjectAndRevision();
      await store.promoteRevision(revision.revisionId, "imported");
      await store.promoteRevision(revision.revisionId, "invalid");
      const recovered = await store.promoteRevision(revision.revisionId, "imported");
      expect(recovered!.state).toBe("imported");
    });

    it("allows stale path: engineered → stale → engineered", async () => {
      const { revision } = await createProjectAndRevision();
      await store.promoteRevision(revision.revisionId, "imported");
      await store.promoteRevision(revision.revisionId, "structured");
      await store.promoteRevision(revision.revisionId, "engineered");
      await store.promoteRevision(revision.revisionId, "stale");
      const recovered = await store.promoteRevision(revision.revisionId, "engineered");
      expect(recovered!.state).toBe("engineered");
    });

    it("provides detailed error info on InvalidTransitionError", async () => {
      const { revision } = await createProjectAndRevision();
      try {
        await store.promoteRevision(revision.revisionId, "released");
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(InvalidTransitionError);
        const ite = err as InvalidTransitionError;
        expect(ite.result.from).toBe("draft");
        expect(ite.result.to).toBe("released");
        expect(ite.result.valid).toBe(false);
        expect(ite.result.allowed).toEqual(["imported"]);
      }
    });

    it("rejects self-transition (draft → draft)", async () => {
      const { revision } = await createProjectAndRevision();
      await expect(
        store.promoteRevision(revision.revisionId, "draft"),
      ).rejects.toThrow(InvalidTransitionError);
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

  // ── assembly nodes ────────────────────────────────────────────────────────

  describe("assembly nodes", () => {
    it("creates an assembly node under a revision", async () => {
      const { project, revision } = await createProjectAndRevision();
      const node = await store.createAssemblyNode({
        assemblyNodeId: `anode_test_${Date.now()}`,
        projectId: project.projectId,
        revisionId: revision.revisionId,
        name: "Root Assembly",
        nodeType: "assembly",
        createdBy: "test-user",
      });
      expect(node.assemblyNodeId).toMatch(/^anode_/);
      expect(node.name).toBe("Root Assembly");
      expect(node.nodeType).toBe("assembly");
      expect(node.parentNodeId).toBeNull();
      expect(node.impactState).toBe("clean");
      expect(node.suppressed).toBe(false);
      expect(node.transform.translation).toEqual([0, 0, 0]);
    });

    it("creates a child node with parent reference", async () => {
      const { project, revision } = await createProjectAndRevision();
      const root = await store.createAssemblyNode({
        assemblyNodeId: `anode_root_${Date.now()}`,
        projectId: project.projectId,
        revisionId: revision.revisionId,
        name: "Root",
        nodeType: "assembly",
        createdBy: "test-user",
      });
      const child = await store.createAssemblyNode({
        assemblyNodeId: `anode_child_${Date.now()}`,
        projectId: project.projectId,
        revisionId: revision.revisionId,
        name: "Torso Subassembly",
        nodeType: "subassembly",
        parentNodeId: root.assemblyNodeId,
        createdBy: "test-user",
      });
      expect(child.parentNodeId).toBe(root.assemblyNodeId);
      expect(child.nodeType).toBe("subassembly");
    });

    it("rejects node for non-existent revision", async () => {
      await expect(
        store.createAssemblyNode({
          assemblyNodeId: `anode_test_${Date.now()}`,
          projectId: "proj_x",
          revisionId: "rev_nonexistent",
          name: "Test",
          nodeType: "assembly",
          createdBy: "test-user",
        }),
      ).rejects.toThrow(/not found/i);
    });

    it("rejects node with non-existent parent", async () => {
      const { project, revision } = await createProjectAndRevision();
      await expect(
        store.createAssemblyNode({
          assemblyNodeId: `anode_test_${Date.now()}`,
          projectId: project.projectId,
          revisionId: revision.revisionId,
          name: "Orphan",
          nodeType: "subassembly",
          parentNodeId: "anode_nonexistent",
          createdBy: "test-user",
        }),
      ).rejects.toThrow(/not found/i);
    });

    it("lists assembly nodes for a revision", async () => {
      const { project, revision } = await createProjectAndRevision();
      await store.createAssemblyNode({
        assemblyNodeId: `anode_list_${Date.now()}`,
        projectId: project.projectId,
        revisionId: revision.revisionId,
        name: "Node A",
        nodeType: "assembly",
        createdBy: "test-user",
      });
      const list = await store.listAssemblyNodes(revision.revisionId);
      expect(list.length).toBeGreaterThanOrEqual(1);
      expect(list.some((n) => n.name === "Node A")).toBe(true);
    });

    it("gets a single assembly node", async () => {
      const { project, revision } = await createProjectAndRevision();
      const nodeId = `anode_get_${Date.now()}`;
      await store.createAssemblyNode({
        assemblyNodeId: nodeId,
        projectId: project.projectId,
        revisionId: revision.revisionId,
        name: "Fetchable Node",
        nodeType: "part_instance",
        createdBy: "test-user",
      });
      const fetched = await store.getAssemblyNode(revision.revisionId, nodeId);
      expect(fetched).toBeDefined();
      expect(fetched!.name).toBe("Fetchable Node");
    });

    it("returns undefined for non-existent assembly node", async () => {
      const { revision } = await createProjectAndRevision();
      const n = await store.getAssemblyNode(revision.revisionId, "anode_nonexistent");
      expect(n).toBeUndefined();
    });

    it("preserves custom transform values", async () => {
      const { project, revision } = await createProjectAndRevision();
      const node = await store.createAssemblyNode({
        assemblyNodeId: `anode_xf_${Date.now()}`,
        projectId: project.projectId,
        revisionId: revision.revisionId,
        name: "Transformed",
        nodeType: "assembly",
        transform: {
          translation: [10, 20, 30],
          rotation: [0.5, 0.5, 0.5, 0.5],
          scale: [2, 2, 2],
        },
        createdBy: "test-user",
      });
      expect(node.transform.translation).toEqual([10, 20, 30]);
      expect(node.transform.rotation).toEqual([0.5, 0.5, 0.5, 0.5]);
      expect(node.transform.scale).toEqual([2, 2, 2]);
    });
  });

  // ── part definitions ──────────────────────────────────────────────────────

  describe("part definitions", () => {
    it("creates a part definition under a revision", async () => {
      const { project, revision } = await createProjectAndRevision();
      const part = await store.createPartDefinition({
        partId: `part_test_${Date.now()}`,
        projectId: project.projectId,
        revisionId: revision.revisionId,
        partCode: "A1",
        displayName: "Torso Outer Armor",
        partFamily: "armor",
        splitStrategy: "manual",
        createdBy: "test-user",
      });
      expect(part.partId).toMatch(/^part_/);
      expect(part.partCode).toBe("A1");
      expect(part.displayName).toBe("Torso Outer Armor");
      expect(part.splitStrategy).toBe("manual");
      expect(part.isStructural).toBe(true);
      expect(part.approvalState).toBe("working");
      expect(part.impactState).toBe("clean");
    });

    it("creates a part with all optional fields", async () => {
      const { project, revision } = await createProjectAndRevision();
      const part = await store.createPartDefinition({
        partId: `part_full_${Date.now()}`,
        projectId: project.projectId,
        revisionId: revision.revisionId,
        partCode: "B2",
        displayName: "Inner Frame",
        partFamily: "structural",
        colorZone: "zone-1",
        surfaceFinish: "matte",
        shellThicknessMm: 2.5,
        draftRequirementDeg: 3.0,
        splitStrategy: "assisted",
        isStructural: false,
        createdBy: "test-user",
      });
      expect(part.colorZone).toBe("zone-1");
      expect(part.surfaceFinish).toBe("matte");
      expect(part.shellThicknessMm).toBe(2.5);
      expect(part.draftRequirementDeg).toBe(3.0);
      expect(part.isStructural).toBe(false);
    });

    it("rejects part for non-existent revision", async () => {
      await expect(
        store.createPartDefinition({
          partId: `part_test_${Date.now()}`,
          projectId: "proj_x",
          revisionId: "rev_nonexistent",
          partCode: "X1",
          displayName: "Orphan",
          partFamily: "test",
          splitStrategy: "manual",
          createdBy: "test-user",
        }),
      ).rejects.toThrow(/not found/i);
    });

    it("lists part definitions for a revision", async () => {
      const { project, revision } = await createProjectAndRevision();
      await store.createPartDefinition({
        partId: `part_list_${Date.now()}`,
        projectId: project.projectId,
        revisionId: revision.revisionId,
        partCode: "C1",
        displayName: "Listed Part",
        partFamily: "armor",
        splitStrategy: "manual",
        createdBy: "test-user",
      });
      const list = await store.listPartDefinitions(revision.revisionId);
      expect(list.length).toBeGreaterThanOrEqual(1);
      expect(list.some((p) => p.partCode === "C1")).toBe(true);
    });

    it("gets a single part definition", async () => {
      const { project, revision } = await createProjectAndRevision();
      const partId = `part_get_${Date.now()}`;
      await store.createPartDefinition({
        partId,
        projectId: project.projectId,
        revisionId: revision.revisionId,
        partCode: "D1",
        displayName: "Fetchable Part",
        partFamily: "frame",
        splitStrategy: "rule",
        createdBy: "test-user",
      });
      const fetched = await store.getPartDefinition(revision.revisionId, partId);
      expect(fetched).toBeDefined();
      expect(fetched!.displayName).toBe("Fetchable Part");
    });

    it("returns undefined for non-existent part", async () => {
      const { revision } = await createProjectAndRevision();
      const p = await store.getPartDefinition(revision.revisionId, "part_nonexistent");
      expect(p).toBeUndefined();
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

      const client = await pool.connect();
      try {
        await client.query("DELETE FROM part_definitions");
        await client.query("DELETE FROM assembly_nodes");
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
