import { describe, it, expect } from "vitest";
import {
  validateStateTransition,
  getAllowedTransitions,
} from "../contracts.js";
import type { RevisionState } from "../contracts.js";

describe("validateStateTransition", () => {
  const happyPath: [RevisionState, RevisionState][] = [
    ["draft", "imported"],
    ["imported", "structured"],
    ["structured", "engineered"],
    ["engineered", "verified"],
    ["verified", "released"],
  ];

  for (const [from, to] of happyPath) {
    it(`allows ${from} → ${to}`, () => {
      const result = validateStateTransition(from, to);
      expect(result.valid).toBe(true);
      expect(result.from).toBe(from);
      expect(result.to).toBe(to);
    });
  }

  const regressionPaths: [RevisionState, RevisionState][] = [
    ["imported", "invalid"],
    ["structured", "stale"],
    ["engineered", "stale"],
    ["engineered", "invalid"],
    ["verified", "stale"],
    ["verified", "invalid"],
    ["released", "stale"],
    ["released", "invalid"],
  ];

  for (const [from, to] of regressionPaths) {
    it(`allows regression ${from} → ${to}`, () => {
      expect(validateStateTransition(from, to).valid).toBe(true);
    });
  }

  const recoveryPaths: [RevisionState, RevisionState][] = [
    ["stale", "structured"],
    ["stale", "engineered"],
    ["stale", "verified"],
    ["invalid", "draft"],
    ["invalid", "imported"],
    ["invalid", "structured"],
    ["invalid", "engineered"],
  ];

  for (const [from, to] of recoveryPaths) {
    it(`allows recovery ${from} → ${to}`, () => {
      expect(validateStateTransition(from, to).valid).toBe(true);
    });
  }

  const invalidPaths: [RevisionState, RevisionState][] = [
    ["draft", "structured"],
    ["draft", "engineered"],
    ["draft", "verified"],
    ["draft", "released"],
    ["draft", "stale"],
    ["draft", "invalid"],
    ["draft", "draft"],
    ["imported", "engineered"],
    ["imported", "released"],
    ["imported", "draft"],
    ["archived", "draft"],
    ["archived", "imported"],
    ["released", "draft"],
    ["released", "verified"],
  ];

  for (const [from, to] of invalidPaths) {
    it(`rejects ${from} → ${to}`, () => {
      const result = validateStateTransition(from, to);
      expect(result.valid).toBe(false);
    });
  }
});

describe("getAllowedTransitions", () => {
  it("returns correct transitions for draft", () => {
    expect(getAllowedTransitions("draft")).toEqual(["imported"]);
  });

  it("returns empty for archived", () => {
    expect(getAllowedTransitions("archived")).toEqual([]);
  });

  it("returns multiple recovery paths for invalid", () => {
    const allowed = getAllowedTransitions("invalid");
    expect(allowed).toContain("draft");
    expect(allowed).toContain("imported");
    expect(allowed).toContain("structured");
    expect(allowed).toContain("engineered");
  });
});
