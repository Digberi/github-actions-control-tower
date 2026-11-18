# G24 — a real two-cluster digest promotion rehearsal

The trusted `ci-release.yml` workflow uses a **single GHCR image build** and
records the immutable registry digest. Only after G21 Trivy and the
independent Sigstore verification pass does the workflow deploy that image:

1. `staging-smoke` pulls that exact digest and checks HTTP health.
2. `staging-kind` deploys that digest into a **real temporary kind cluster**,
   runs readiness/smoke and demonstrates an unavailable rollout + `rollout undo`.
3. On success, the reusable workflow exports `deployed_image`. The parent
   `promotion-kind` job consumes **the successful staging job's output**, not
   a newly calculated tag or a rebuilt image. It deploys that digest to a
   **second, fresh kind cluster** and runs the same checks.
4. `promotion-evidence` checks three values: the originally published digest,
   the staging digest and the promoted digest. They must be identical. A
   mismatch exits non-zero and blocks the release. It uploads
   `g24-two-kind-promotion-evidence/promotion.json` with SHA, run ID and digest.

This is an observable *integration rehearsal* on GitHub runners. It has
real container pulls, two independent real Kubernetes clusters, immutable
identity and smoke tests. It **does not** use real production infrastructure,
AWS credentials, or GitHub Environment required reviewers. The environment
`demo-promotion-kind` is an **unprotected teaching environment** by default;
it is NOT the native G28 approval gate.

## How to teach it

1. Open **02 · Trusted Build and Publish** for a recent `main` commit.
2. Find `Validate · Build once · Push GHCR` and confirm the digest.
3. Open `G21 · Scan published immutable digest before promotion`: this job
   blocks both kind environments if HIGH/CRITICAL fixable CVEs are found.
4. Open `G29 · Actual kind staging deployment` and then `G24 · Promote
   staging digest to isolated kind`. Each starts its own kind cluster; the
   image in both manifests must have the same `@sha256` reference.
5. Open `G24 · Verify both kind environments received identical digest` and
   download `promotion.json` from the artifact list.
6. Explain that production approval is a separate GitHub repository setting.

The two clusters are ephemeral and should not be compared with a lasting
production deployment. Postgres DB migrations are also a separate mechanism:
see [G13 PostgreSQL compatibility](G13_POSTGRES_MIGRATION.md).
