import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const image = process.argv[2];
if (!/^ghcr\.io\/[a-z0-9/-]+@sha256:[a-f0-9]{64}$/.test(image ?? "")) {
  process.stderr.write("Refusing non-immutable or non-GHCR image\n");
  process.exit(1);
}
const path = fileURLToPath(new URL("../infra/k8s/deployment.json", import.meta.url));
const deployment = JSON.parse(readFileSync(path, "utf8"));
deployment.spec.template.spec.containers[0].image = image;
process.stdout.write(JSON.stringify(deployment) + "\n");
