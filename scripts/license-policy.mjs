// G19: fail-closed license policy for the actual npm installation.
// This deliberately reads installed package metadata, not a synthetic SBOM.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const mode = process.argv[2] ?? "green";
if (!["green", "red"].includes(mode)) {
  console.error("Usage: node scripts/license-policy.mjs green|red");
  process.exit(2);
}

const modulesDir = resolve("node_modules");
if (!existsSync(modulesDir)) {
  console.error("G19 requires npm ci --ignore-scripts first");
  process.exit(2);
}

const allowed = new Set([
  "MIT", "Apache-2.0", "BSD-2-Clause", "BSD-3-Clause", "ISC", "0BSD", "CC0-1.0"
]);

function packageDirectories(directory) {
  return readdirSync(directory, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && !entry.name.startsWith("."))
    .flatMap(entry => {
      const fullPath = join(directory, entry.name);
      if (entry.name.startsWith("@")) {
        return readdirSync(fullPath, { withFileTypes: true })
          .filter(scoped => scoped.isDirectory())
          .map(scoped => join(fullPath, scoped.name));
      }
      return [fullPath];
    });
}

function licenseIsAllowed(expression) {
  if (typeof expression !== "string" || !expression.trim()) return false;
  // Accept OR/AND only when every constituent is on the approved list.
  // Any unknown SPDX token, "WITH" exception, LicenseRef, or missing metadata
  // fails closed. This is intentionally stricter than an SPDX solver.
  const tokens = expression.match(/[A-Za-z0-9.+-]+/g) ?? [];
  if (tokens.length === 0) return false;
  return tokens.filter(token => token !== "AND" && token !== "OR").every(token => allowed.has(token));
}

const inspected = [];
for (const directory of packageDirectories(modulesDir)) {
  const manifestPath = join(directory, "package.json");
  if (!existsSync(manifestPath)) continue;
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  inspected.push({
    name: manifest.name ?? directory,
    version: manifest.version ?? null,
    license: manifest.license ?? null,
    allowed: licenseIsAllowed(manifest.license)
  });
}

if (inspected.length === 0) {
  console.error("G19 found no actual npm dependency packages; fail closed");
  process.exit(2);
}

if (mode === "red") {
  // Generated policy input only; no forbidden package is installed or committed.
  inspected.push({
    name: "@lecture/synthetic-gpl-only",
    version: "0.0.0-demo",
    license: "GPL-3.0-only",
    allowed: false,
    synthetic: true
  });
}

inspected.sort((a, b) => a.name.localeCompare(b.name));
const denied = inspected.filter(pkg => !pkg.allowed);
const result = {
  gate: "G19",
  mode,
  source: "ACTUAL_INSTALLED_NPM_PACKAGE_JSON",
  checked: inspected.length,
  allowedLicenses: [...allowed].sort(),
  denied,
  packages: inspected
};
mkdirSync("reports", { recursive: true });
const report = `reports/g19-installed-licenses-${mode}.json`;
writeFileSync(report, JSON.stringify(result, null, 2) + "\n");
console.log(`G19: ${inspected.length} actual/synthetic packages checked, ${denied.length} rejected. Report: ${report}`);
if (denied.length !== 0) process.exitCode = 1;
