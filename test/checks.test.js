// unit tests for checks
import { strictEqual } from "assert";
import { buildSummary } from "../src/core/severity.js";

(function testSummary() {
  const findings = [
    { severity: "HIGH" },
    { severity: "LOW" },
    { severity: "LOW" },
    { severity: "INFO" },
  ];
  const s = buildSummary(findings);
  strictEqual(s.HIGH, 1);
  strictEqual(s.LOW, 2);
  strictEqual(s.INFO, 1);
  console.log("Tests passed ! ");
})();
