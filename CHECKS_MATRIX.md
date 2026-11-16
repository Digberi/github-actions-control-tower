# G01–G32 — reality check

This matrix distinguishes **local implementation** from **verified remote execution**.
The initial push is published and three remote runs were verified on
2026-11-16; see [VERIFICATION.md](VERIFICATION.md). The feature branch adds
additional real runner jobs. They are now evidenced by successful
[PR run 43894228150](https://github.com/Digberi/github-actions-control-tower/actions/runs/43894228150)
and [kind release 43894401938](https://github.com/Digberi/github-actions-control-tower/actions/runs/43894401938).

Legend: `LOCAL` = implemented and manually runnable, `PARTIAL` = some narrower
behavior implemented, `PLANNED` = not yet implemented, `CONFIG` = dependent on
GitHub settings, `OPTIONAL` = only needed when representative events exist.

| ID | Target gate | First-cut status | Actual implementation / gap |
|---|---|---|---|
| G01 | actionlint | READY + REMOTE | official actionlint container, failed first PR then corrected, green rerun |
| G02 | yamllint/ShellCheck/Hadolint | PLANNED | not installed |
| G03 | ESLint/Prettier | PARTIAL | JS syntax + whitespace hygiene |
| G04 | TypeScript typecheck | PLANNED | demo API currently plain JS |
| G05 | Unit tests | LOCAL + REMOTE | node:test on pricing/storage; happy release verified |
| G06 | Coverage threshold | READY + REMOTE | node:test lines ≥80%, locally measured 82.61%, green PR job |
| G07 | Node/platform matrix | PARTIAL | Node 22 and 24 PR unit matrix; no OS matrix |
| G08 | Postgres integration | READY + REMOTE | PostgreSQL 16 service + concurrent transactional idempotency test green; skipped locally without DB |
| G09 | API E2E | LOCAL | real HTTP order lifecycle |
| G10 | API backward compatibility | PARTIAL + REMOTE | JSON response contract; verified failed `orderId` fixture; no oasdiff |
| G11 | Pact consumer contract | LOCAL CONSUMER, REMOTE PENDING | independent HTTP consumer uses old response contract; deliberately missing orderId gives red; not Pact yet |
| G12 | Event/schema compatibility | OPTIONAL | no event bus in demo |
| G13 | DB migration safety | LOCAL, REMOTE PENDING | actual applied 001_orders.sql with additive-only validator vs red drop-column fixture; static policy is narrow |
| G14 | Architecture boundaries | LOCAL, REMOTE PENDING | domain-to-transport import forbidden, real source graph + red fixture |
| G15 | Dependency cycles | LOCAL | source import graph DFS + red fixture |
| G16 | Gitleaks/secret scanning | PARTIAL | basic patterns + generated synthetic red case |
| G17 | SAST | IMPLEMENTED, REMOTE PENDING | separate CodeQL security-extended JS workflow, uploaded GitHub code-scanning alerts |
| G18 | SCA | READY NPM + REMOTE | real npm audit high+ found no vulnerabilities; PR gate green; full Trivy SCA remains |
| G19 | License policy | LOCAL FIXTURE | explicit allowlist on synthetic component licenses; no actual dependency classifier |
| G20 | IaC/K8s policy | READY NARROW + REMOTE | JSON fixtures + real K8s Deployment security check green in PR, no OPA/Trivy yet |
| G21 | Image CVE scan | CONFIG, REMOTE PENDING | Trivy manual/scheduled workflow scans immutable GHCR digest, blocking HIGH/CRITICAL threshold, JSON artifact |
| G22 | SBOM completeness | READY NPM + REMOTE | real npm CycloneDX SBOM (14 components) + PURL and pg requirement + PR artifact |
| G23 | Attestation/provenance | IMPLEMENTED, REMOTE PENDING | trusted release GitHub Sigstore provenance, pushes registry attestation, gh attestation verify |
| G24 | Immutable promotion | READY KIND + REMOTE | verified real GHCR digest identical in Docker and kind deployment; no production |
| G25 | Performance smoke | LOCAL + REAL K6 REMOTE PENDING | local HTTP p95 and independent real k6 workflow (PR/dispatch, thresholds, summary artifact) |
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
