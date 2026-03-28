import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const port = 4020;

async function request(path: string, options?: RequestInit) {
  const response = await fetch(`http://127.0.0.1:${port}${path}`, options);
  const json = await response.json();
  return { response, json };
}

async function main() {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const serverEntry = resolve(currentDir, "server.ts");
  const child = spawn("node", ["--import", "tsx", serverEntry], {
    cwd: currentDir,
    env: {
      ...process.env,
      PORT: String(port),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (chunk) => {
    process.stdout.write(chunk);
  });
  child.stderr.on("data", (chunk) => {
    process.stderr.write(chunk);
  });

  try {
    await delay(1200);

    const createdProject = await request("/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Project Aegis",
        marketSegment: "professional-desktop",
        targetDifficulty: "advanced",
        targetPartCount: 180,
      }),
    });

    const projectId = createdProject.json.projectId as string;

    const createdRevision = await request(`/api/projects/${projectId}/revisions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        revisionLabel: "R1",
        createdBy: "smoke-test",
        summary: "initial engineering slice",
      }),
    });

    const revisionId = createdRevision.json.revisionId as string;

    const createdGeometry = await request(`/api/revisions/${revisionId}/source-geometries`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sourceSystem: "zbrush",
        declaredFileFormat: "obj",
        sourceFilename: "aegis_torso.obj",
        unitSystem: "mm",
        createdBy: "smoke-test",
      }),
    });

    const sourceGeometryId = createdGeometry.json.sourceGeometryId as string;

    const createdImportJob = await request(`/api/source-geometries/${sourceGeometryId}/import`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        adapterName: "zbrush-import-adapter",
        requestedBy: "smoke-test",
      }),
    });

    const importJobId = createdImportJob.json.jobId as string;

    await request(`/api/import-jobs/${importJobId}/complete`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        status: "completed",
        progressPercent: 100,
      }),
    });

    const revisionDetail = await request(`/api/revisions/${revisionId}/status`);
    const importJobDetail = await request(`/api/import-jobs/${importJobId}`);
    const systemSnapshot = await request("/api/debug/snapshot");

    const summary = {
      projectId,
      revisionId,
      sourceGeometryId,
      importJobId,
      revisionState: revisionDetail.json.revision.state,
      geometryImportStatus: revisionDetail.json.sourceGeometries[0]?.importStatus,
      importJobStatus: importJobDetail.json.status,
      counts: {
        projects: systemSnapshot.json.projects.length,
        revisions: systemSnapshot.json.revisions.length,
        sourceGeometries: systemSnapshot.json.sourceGeometries.length,
        importJobs: systemSnapshot.json.importJobs.length,
      },
    };

    console.log(JSON.stringify(summary, null, 2));
  } finally {
    child.kill("SIGTERM");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
