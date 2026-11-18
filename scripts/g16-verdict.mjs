// G16: preserve machine-readable proof of actual Gitleaks exit status.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const [mode, rawCode, reportPath, scope] = process.argv.slice(2);
const scannerExitCode = Number(rawCode);
if (!["green", "red"].includes(mode) || !Number.isInteger(scannerExitCode) ||
    (scope !== undefined && scope !== "history")) {
  console.error("Usage: node scripts/g16-verdict.mjs green|red <exit-code> <report> [history]");
  process.exit(2);
}

let findings = [];
if (existsSync(reportPath)) {
  const data = JSON.parse(readFileSync(reportPath, "utf8"));
  if (!Array.isArray(data)) {
    console.error("G16 report must be an array of actual Gitleaks findings");
    process.exit(2);
  }
  findings = data;
}
const validRed = mode === "red" && scannerExitCode === 1 && findings.length > 0;
const validGreen = mode === "green" && scannerExitCode === 0 && findings.length === 0;
const verdict = {
  gate: "G16",
  mode,
  scanner: "gitleaks 8.30.1",
  scope: scope ?? "working-tree",
  scannerExitCode,
  findings: findings.length,
  expectedRedConfirmed: validRed,
  expectedGreenConfirmed: validGreen
};
mkdirSync("reports", { recursive: true });
writeFileSync(`reports/g16-verdict-${mode}${scope ? `-${scope}` : ""}.json`,
  JSON.stringify(verdict, null, 2) + "\n");
console.log(JSON.stringify(verdict));
if (validRed) {
  // The actual scanner found the red fixture and returned a blocking status.
  process.exitCode = 1;
} else if (!validGreen) {
  // Never turn scanner/network/parse errors or missing findings into fake RED.
  process.exitCode = 2;
}
