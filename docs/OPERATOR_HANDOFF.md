# Operator handoff — what still requires an explicit external decision

This repository is a functioning, observable CI/CD lecture stand. PR,
release, kind rollback, GHCR Sigstore, Gitleaks, dependency license checks,
Kubernetes IaC and nightly soak/mutation have **real GitHub Actions runs**.
The HTML diagram depicts the *target topology*; do not present it as live
telemetry or claim all 32 gates are production-complete.

Last audited 2026-11-16. The following work cannot honestly be called
finished without additional infrastructure, privileges or scope decisions.

## A. Make G32 physically prevent merging (repository admin)

**Currently:** `Required · PR Gate` is implemented and checked on PRs,
including required G16/G19/G20 reusable security jobs, property fuzz,
PostgreSQL, E2E, coverage, image build and more. However `main` was
reported **unprotected**, and the repository rulesets collection was empty.
Without a GitHub branch ruleset, a maintainer can merge despite a failing
status check.

An owner/admin can visit:
`https://github.com/Digberi/github-actions-control-tower/settings/rules`

Recommended new branch ruleset:
- Target `main` branch and activate rule.
- Require a pull request before merging; require conversations resolved.
- Require status checks to pass, select **`Required · PR Gate`**;
  optionally require the separately scheduled PR CodeQL check.
- Require the branch up to date before merge if the extra CI latency is
  acceptable; disallow force pushes and deletion.
- Carefully test on a disposable branch/PR before enforcing reviewers.
- Choose reviewers/bypass actors explicitly; do not assume an AI agent has
  permission to edit repository security controls.

Authoritative GitHub ruleset docs:
https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets

## B. G28 production approval and real promotion

The release currently builds once, pushes an immutable `@sha256`, verifies
provenance and deploys to a **temporary kind cluster**. There is no paid
production Kubernetes/ECS target, nor an approved owner/reviewer.

To demonstrate *real* environment approval rather than a fake simulated
`approval=green`, choose the GitHub environment name, select a human
reviewer, and configure required reviewers / prevent self-review under
`Settings → Environments` (if the repository plan supports the feature).
A deployment job must refer to that exact environment, and must not execute
production changes without authorizing a target, access policy and rollback.

Reference:
https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments

## C. G27 AWS STS/OIDC and G26 real infrastructure-cost preview

G27 currently verifies signed **synthetic RS256 OIDC JWTs** and allowed
claims. It does *not* call AWS STS. A real demonstration requires:
- an AWS account and explicit account/region selection;
- a narrowly scoped, trust-policy-restricted `AssumeRoleWithWebIdentity`
  role for the GitHub OIDC provider;
- a read-only or short-lived sandbox target and permissions approval;
- verification that claims such as repository/ref/environment are bound
  to the intended trust policy.

G26 evaluates a synthetic Pulumi preview change/cost fixture; it does not
query actual AWS prices. Real estimates require an agreed IaC program and
cost source/provider credentials. **Do not create cloud resources or change
IAM trust policies automatically**.

## D. Narrow/optional gates — honest limitation ledger

- G03: real ESLint+Prettier scoped to source/fixture, not whole repository.
- G04: real strict TypeScript for DTO; backend is JavaScript.
- G11: real independent HTTP consumer contract, **not Pact**.
- G12: optional — this sample API does not emit messages to Kafka/RabbitMQ.
- G13–G15: working migration/import/cycle checks, but not all
  dependency-cruiser/DB migration tools in the target design.
- G16: actual Gitleaks scans checked-out files; full git-history scanning
  remains optional.
- G19: actual installed npm dependency license metadata, strict allowlist;
  no complete SPDX license text verification.
- G20: real Trivy Kubernetes config scan; no custom OPA/Rego policy pack.
- G21: [Trivy HIGH/CRITICAL RED report](https://github.com/Digberi/github-actions-control-tower/actions/runs/43898137840)
  on a known immutable image; don't call it a remediated green image scan.
- G25: actual k6, plus PR short soak and 20s scheduled soak. These are not
  production load or chaos testing.
- G26/G27: see cloud limitations above.
- G28/G32: see manual repository/environment decisions above.
- Nightly mutation: one intentionally toggled cent bug, **not** Stryker.
  DAST and chaos experiments remain separate future enhancements.

## Safe teaching checklist

1. Open [interactive pipeline](https://digberi.github.io/github-actions-control-tower/).
2. Show [real run evidence](../VERIFICATION.md) and
   [G01–G32 status matrix](../CHECKS_MATRIX.md).
3. Run **14 · Real Secret and License Security Gates** with G16 or G19
   and red/green input; note red uses fake ephemeral inputs.
4. Run **15 · Trivy Kubernetes IaC Policy** red/green; compare reports.
5. Compare property fuzz RED before the safe-integer fix against GREEN.
6. Show [nightly 20-second soak and mutation evidence](https://github.com/Digberi/github-actions-control-tower/actions/runs/43968370280).
7. Show signed GHCR immutable digest and *kind* rollback; do not claim
   production approvals/cloud IAM features are configured.

No Codespace or paid AWS resources were provisioned as part of these changes.
