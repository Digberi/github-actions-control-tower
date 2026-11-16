import assert from "node:assert/strict";
import path from "node:path";

// Deliberate, explicit cross-platform contract: Windows paths must be parsed
// with the win32 API even when the runner itself uses POSIX paths.
assert.equal(path.win32.basename("C:\\orders\\2026\\receipt.json"), "receipt.json");
assert.equal(path.posix.basename("/orders/2026/receipt.json"), "receipt.json");
assert.equal(path.join("orders", "2026"), ["orders", "2026"].join(path.sep));
assert.ok(Number(process.versions.node.split(".")[0]) >= 22, "Node.js 22+ required");

if (process.env.CI_DEMO_SCENARIO === "matrix") {
  // On GitHub's real OS matrix only windows-latest fails. On local Unix/macOS
  // the controller uses an explicitly labeled win32 emulation so local RED
  // remains deterministic without pretending to run the Windows kernel.
  const separator = process.env.GITHUB_ACTIONS === "true" ? path.sep : path.win32.sep;
  assert.equal(separator, "/", "G07 intentional RED: POSIX-only separator assumption fails on Windows");
}

process.stdout.write(
  "PASS G07 platform=" + process.platform + " node=" + process.versions.node +
  " (portable win32/posix handling)\n"
);
