let source = "";
for await (const chunk of process.stdin) {
  source += chunk;
  if (source.length > 8_000_000) throw new Error("SBOM unexpectedly large");
}
const bom = JSON.parse(source);
if (bom.bomFormat !== "CycloneDX" || !bom.specVersion) {
  throw new Error("G22: not a CycloneDX SBOM");
}
const components = bom.components ?? [];
const names = new Set(components.map(x => x.name));
if (!names.has("pg")) throw new Error("G22: runtime pg dependency missing from SBOM");
if (components.some(x => !x.name || !x.version || !x.purl)) {
  throw new Error("G22: one or more components missing name/version/PURL");
}
process.stdout.write(JSON.stringify({
  gate: "G22", source: "NPM_CYCLONEDX_REAL",
  components: components.length, postgresDependency: names.has("pg")
}) + "\n");
