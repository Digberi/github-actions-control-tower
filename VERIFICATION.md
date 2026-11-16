# Real GitHub Actions evidence

Verified on 2026-11-16 (Europe/Kyiv). These links are actual public GitHub
workflow runs, not screenshots or mocked JSON.

| Flow | Outcome | URL |
|---|---|---|
| Trusted build → GHCR → immutable staging smoke | **SUCCESS** | [run 43889385092](https://github.com/Digberi/github-actions-control-tower/actions/runs/43889385092) |
| Controlled fixture: `contract` | **EXPECTED FAILURE** | [run 43889707611](https://github.com/Digberi/github-actions-control-tower/actions/runs/43889707611) |
| Controlled fixture: `happy` | **SUCCESS** | [run 43889811097](https://github.com/Digberi/github-actions-control-tower/actions/runs/43889811097) |
| GitHub Pages | **SUCCESS (rerun #2)** | [run 43889385204](https://github.com/Digberi/github-actions-control-tower/actions/runs/43889385204) |

## Confirmed evidence

- The container release was published to:
  `ghcr.io/digberi/github-actions-control-tower@sha256:4db00595a95a405bc6f306f99c780e7a972dfe27b340150007551c3b876701b9`.
- The staging-simulation job reports **the identical digest**, showing no
  rebuild between publish and pull+smoke on an ephemeral runner.
- The contract job failed with exit code 1 and the message:
  `FAIL contract: Breaking response change: post /orders missing orderId:string`.
- The happy job completed successfully using the same workflow and
  the `happy` input.
- The initial Pages attempt reported `Get Pages site failed`. After enabling
  Pages via Settings with GitHub Actions as source, rerun #2 successfully
  deployed [the live HTML site](https://digberi.github.io/github-actions-control-tower/).
- The live page was opened in a browser and tested: selecting `contract`
  and clicking `Tests & contracts` updated the downstream red state
  and the list of G08–G15 checks.

## Limits and follow-ups

1. GitHub Pages is enabled and operational. Future changes under `docs/`
   auto-trigger the Pages deployment workflow.
2. Configure branch protection/ruleset for `Required · PR Gate` before
   claiming it physically blocks merge.
3. Pin all remaining GitHub Pages actions to supported full SHAs. The current
   checkout/setup-node pins work but GitHub warns about their Node 20
   runtime being forced to Node 24.
4. These results do not assert production deployments, Kubernetes rollout,
   OIDC role assumption, SBOM generation, attestations, vulnerability scans
   or automatic rollback. See `IMPLEMENTATION_BRIEF.md`.
