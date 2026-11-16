import { spawnSync } from "node:child_process";

const scenario = process.argv[2] ?? "happy";
const actions = {
  happy: ["check"],
  unit: ["test:unit"],
  integration: ["test:integration"],
  contract: ["check:contract"],
  architecture: ["check:architecture"],
  security: ["check:secrets"],
  performance: ["check:performance"]
};

if (!Object.hasOwn(actions, scenario)) {
  process.stderr.write("Unknown scenario: " + scenario + "\n");
  process.exit(2);
}

const action = actions[scenario][0];
process.stdout.write("Scenario: " + scenario + " / running npm run " + action + "\n");
const command = process.platform === "win32" ? "npm.cmd" : "npm";
const result = spawnSync(command, ["run", action], {
  env: { ...process.env, CI_DEMO_SCENARIO: scenario },
  stdio: "inherit"
});
if (result.error) throw result.error;
const passed = result.status === 0;
const expected = scenario === "happy";
if (passed !== expected) {
  process.stderr.write("Unexpected outcome: " + (passed ? "GREEN" : "RED") + "\n");
  process.exit(1);
}
process.stdout.write("EXPECTED " + (passed ? "GREEN" : "RED") + " confirmed; demonstration complete.\n");
