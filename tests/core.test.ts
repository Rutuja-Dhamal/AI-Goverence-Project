import assert from "node:assert/strict";
import test from "node:test";
import { calculateMetrics, cleanText, enumValue, hasValidFileSignature, isSameOrigin, safeFileName } from "../worker/core";

test("calculateMetrics summarizes governance posture", () => {
  const result = calculateMetrics([
    { risk: "Critical", score: 70, controls: 10, controlsComplete: 7 },
    { risk: "Low", score: 90, controls: 8, controlsComplete: 8 },
  ], 3, 1);
  assert.deepEqual(result, {
    totalSystems: 2,
    highRiskSystems: 1,
    openTasks: 3,
    openIncidents: 1,
    averageCompliance: 80,
    completedControls: 15,
    totalControls: 18,
  });
});

test("cleanText validates length and removes control characters", () => {
  assert.equal(cleanText("  Safe\u0000name  ", "name"), "Safe name");
  assert.throws(() => cleanText("   ", "name"), /required/);
  assert.throws(() => cleanText("abcdef", "name", 5), /5 characters/);
});

test("enumValue accepts only explicit allowlisted values", () => {
  assert.equal(enumValue("High", ["High", "Low"] as const, "risk"), "High");
  assert.throws(() => enumValue("Admin", ["High", "Low"] as const, "risk"), /unsupported/);
});

test("same-origin protection rejects foreign origins", () => {
  assert.equal(isSameOrigin(new Request("https://aegis.example/api", { headers: { Origin: "https://aegis.example" } })), true);
  assert.equal(isSameOrigin(new Request("https://aegis.example/api", { headers: { Origin: "https://evil.example" } })), false);
});

test("evidence validation checks signatures and safe display names", () => {
  assert.equal(hasValidFileSignature("application/pdf", new Uint8Array([0x25, 0x50, 0x44, 0x46])), true);
  assert.equal(hasValidFileSignature("image/png", new Uint8Array([0x25, 0x50, 0x44, 0x46])), false);
  assert.equal(safeFileName("../audit<script>.pdf"), ".._audit_script_.pdf");
});
