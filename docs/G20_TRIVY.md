# G20 — Real Kubernetes IaC policy

The actual Trivy scanner (GitHub action pinned to
`ed142fd0673e97e23eac54620cfb913e5ce36c25`) checks Kubernetes
**JSON manifests** in `infra/k8s`. These are real deployment and service
definitions, not policy fixtures. Misconfigurations at HIGH/CRITICAL severity
block the PR aggregate `Required · PR Gate`.

## Verified evidence

- RED: [GitHub run 43966679118](https://github.com/Digberi/github-actions-control-tower/actions/runs/43966679118)
  (5 HIGH/CRITICAL findings, scanner returned exit 1, JSON artifacts retained).
- GREEN: [GitHub run 43966807059](https://github.com/Digberi/github-actions-control-tower/actions/runs/43966807059)
  (actual `infra/k8s` checked, zero blocking HIGH/CRITICAL, JSON evidence).

## Reproduce during lecture

Open Actions → **15 · Trivy Kubernetes IaC Policy** → Run workflow,
choose `mode=red` to generate an ephemeral Kubernetes Deployment with
`hostPID`, `hostNetwork`, `privileged=true`, `latest` image and no
resource restrictions; this must return a true blocking RED. No production
clusters, cloud accounts or real credentials are touched.

Then run `mode=green`: scan the checked-out Kubernetes manifests.
The workflow uploads both `g20-trivy-<mode>.json` and
`g20-verdict-<mode>.json` on failure or success.
The verdict script rejects missing or malformed Trivy reports and will never
treat a scanner malfunction as a valid policy RED.

The workflow is reusable and is called as an obligatory PR job by
`.github/workflows/pr.yml`, so a HIGH/CRITICAL finding blocks the aggregate.
The old local `scripts/heavy-gates.mjs G20 ...` remains as a separate
narrow, purely illustrative policy fixture.

Limit: this is genuine Trivy config scanning, not an OPA/Rego policy nor
a scan of live Kubernetes cluster admission decisions.
