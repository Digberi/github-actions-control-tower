# G01–G32 — reality check

This matrix distinguishes **local implementation** from **verified remote execution**.
Three major pull requests have been merged on 2026-11-16. Real runner
evidence includes [PR #3](https://github.com/Digberi/github-actions-control-tower/actions/runs/43898394030),
[Sigstore + kind release](https://github.com/Digberi/github-actions-control-tower/actions/runs/43897091325),
[real linter](https://github.com/Digberi/github-actions-control-tower/actions/runs/43898394391)
and [blocking Trivy CVEs](https://github.com/Digberi/github-actions-control-tower/actions/runs/43898137840).
See [VERIFICATION.md](VERIFICATION.md) for the run-by-run ledger.

Legend: `LOCAL` = implemented and manually runnable, `PARTIAL` = some narrower
behavior implemented, `PLANNED` = not yet implemented, `CONFIG` = dependent on
GitHub settings, `OPTIONAL` = only needed when representative events exist.

| ID | Target gate | First-cut status | Actual implementation / gap |
|---|---|---|---|
| G01 | actionlint | READY + REMOTE | official actionlint container, failed first PR then corrected, green rerun |
| G02 | yamllint/ShellCheck/Hadolint | READY + REMOTE | [yamllint and Hadolint green](https://github.com/Digberi/github-actions-control-tower/actions/runs/43898394391), actual two prior lint failures; ShellCheck embedded in actionlint |
| G03 | ESLint/Prettier | PARTIAL | JS syntax + whitespace hygiene |
| G04 | TypeScript typecheck | PLANNED | demo API currently plain JS |
| G05 | Unit tests | LOCAL + REMOTE | node:test on pricing/storage; happy release verified |
| G06 | Coverage threshold | READY + REMOTE | node:test lines ≥80%, locally measured 82.61%, green PR job |
| G07 | Node/platform matrix | PARTIAL | Node 22 and 24 PR unit matrix; no OS matrix |
| G08 | Postgres integration | READY + REMOTE | PostgreSQL 16 service + concurrent transactional idempotency test green; skipped locally without DB |
| G09 | API E2E | READY + REMOTE | real HTTP order lifecycle in PR E2E job |
| G10 | API backward compatibility | READY + REMOTE RED/GREEN | Real OpenAPI 3.0 oasdiff; explicit `--fail-on ERR` fixed [false-green](https://github.com/Digberi/github-actions-control-tower/actions/runs/43898787400). [RED](https://github.com/Digberi/github-actions-control-tower/actions/runs/43899543939) / [GREEN](https://github.com/Digberi/github-actions-control-tower/actions/runs/43899598220) |
| G11 | Pact consumer contract | READY CONSUMER + REMOTE | independent HTTP consumer old response contract, verified GH PR job; not Pact yet |
| G12 | Event/schema compatibility | OPTIONAL | no event bus in demo |
| G13 | DB migration safety | READY NARROW + REMOTE | actual applied 001_orders.sql with additive-only validator vs red drop-column fixture |
| G14 | Architecture boundaries | READY NARROW + REMOTE | domain-to-transport import forbidden, real source graph + red fixture |
| G15 | Dependency cycles | LOCAL | source import graph DFS + red fixture |
| G16 | Gitleaks/secret scanning | PARTIAL | basic patterns + generated synthetic red case |
| G17 | SAST | READY CODEQL + REMOTE | [CodeQL security-extended JS workflow success](https://github.com/Digberi/github-actions-control-tower/actions/runs/43896867239) |
| G18 | SCA | READY NPM + REMOTE | real npm audit high+ found no vulnerabilities; PR gate green; full Trivy SCA remains |
| G19 | License policy | LOCAL FIXTURE | explicit allowlist on synthetic component licenses; no actual dependency classifier |
| G20 | IaC/K8s policy | READY NARROW + REMOTE | JSON fixtures + real K8s Deployment security check green in PR, no OPA/Trivy yet |
| G21 | Image CVE scan | READY + REAL RED | [Trivy exit 1](https://github.com/Digberi/github-actions-control-tower/actions/runs/43898137840) on immutable GHCR digest due HIGH/CRITICAL findings, real JSON evidence uploaded; needs CVE remediation to be green |
| G22 | SBOM completeness | READY NPM + REMOTE | real npm CycloneDX SBOM (14 components) + PURL and pg requirement + PR artifact |
| G23 | Attestation/provenance | READY REAL + REMOTE | trusted release GitHub Sigstore provenance and independent gh attestation verify both passed in [release 43897091325](https://github.com/Digberi/github-actions-control-tower/actions/runs/43897091325) |
| G24 | Immutable promotion | READY KIND + REMOTE | verified real GHCR digest identical in Docker and kind deployment; no production |
| G25 | Performance smoke | READY K6 + REMOTE | [k6 PR run 43896867157](https://github.com/Digberi/github-actions-control-tower/actions/runs/43896867157) passed real p95 + error rate thresholds with report |
| G26 | Cost budget preview | LOCAL FIXTURE | explicitly labeled synthetic Pulumi JSON and budget policy, no live cloud |
| G27 | OIDC claims and STS | READY SYNTHETIC + REMOTE | signed local RSA JWT + reject tests; real [red](https://github.com/Digberi/github-actions-control-tower/actions/runs/43894863175) and [green](https://github.com/Digberi/github-actions-control-tower/actions/runs/43894983037) workflow, no real STS |
| G28 | Production approval | CONFIG | no production deploy; requires environment setup |
| G29 | Post-deploy smoke | READY KIND + REMOTE | kind real 2-pod deployment/readiness/Service HTTP smoke green |
| G30 | Rolling/canary availability | READY KIND + REMOTE | kind maxUnavailable=0 + 25 HTTP checks during bad digest rollout, green |
| G31 | Rollback | READY KIND + REMOTE | real failed rollout → kubectl rollout undo → original digest + smoke, green with artifact; no production |
| G32 | Aggregate required checks | PARTIAL | aggregate job exists; branch ruleset not configured |

The diagram in [docs/index.html](docs/index.html) intentionally shows the
complete **target** from the implementation brief. A green visualization
does not prove any job ran on GitHub.
