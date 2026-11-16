// G20: validate the output of the actual Trivy config scanner, not a fake gate.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const [mode, outcome, reportPath] = process.argv.slice(2);
if (!["green", "red"].includes(mode) || !["success", "failure"].includes(outcome)) {
  console.error("Usage: node scripts/trivy-config-verdict.mjs green|red success|failure <trivy-report>");
  process.exit(2);
}
if (!existsSync(reportPath)) {
  console.error("Trivy JSON report missing; refusing to declare GREEN");
  process.exit(2);
}
let findings = [];
try {
    const report = JSON.parse(readFileSync(reportPath, "utf8"));
    findings = (report.Results ?? []).flatMap(result =>
      (result.Misconfigurations ?? []).map(item => ({
        id: item.ID,
        severity: item.Severity,
        title: item.Title,
        resource: result.Target
      }))
    );
} catch (error) {
  console.error("Invalid Trivy report:", error.message);
  process.exit(2);
}
const blocking = findings.filter(item => ["HIGH", "CRITICAL"].includes(item.severity));
const validRed = mode === "red" && outcome === "failure" && blocking.length > 0;
const validGreen = mode === "green" && outcome === "success" && blocking.length === 0;
const result = {
  gate: "G20", scanner: "Trivy config", mode, scannerOutcome: outcome,
  blockingFindings: blocking.length, findings: blocking,
  expectedRedConfirmed: validRed, expectedGreenConfirmed: validGreen
};
mkdirSync("reports", { recursive: true });
writeFileSync(`reports/g20-verdict-${mode}.json`, JSON.stringify(result, null, 2) + "\n");
console.log(`G20 ${mode}: Trivy outcome ${outcome}, HIGH/CRITICAL findings ${blocking.length}`);
if (validRed) process.exitCode = 1; // real blocking proof
else if (!validGreen) process.exitCode = 2;
