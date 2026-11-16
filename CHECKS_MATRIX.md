# G01–G32 — reality check

This matrix distinguishes **local implementation** from **verified remote execution**.
The initial push is published and three remote runs were verified on
2026-11-16; see [VERIFICATION.md](VERIFICATION.md). The feature branch adds
additional real runner jobs but those are **REMOTE PENDING** until verified.

Legend: `LOCAL` = implemented and manually runnable, `PARTIAL` = some narrower
behavior implemented, `PLANNED` = not yet implemented, `CONFIG` = dependent on
GitHub settings, `OPTIONAL` = only needed when representative events exist.

| ID | Target gate | First-cut status | Actual implementation / gap |
|---|---|---|---|
| G01 | actionlint | IMPLEMENTED, REMOTE PENDING | PR job uses official actionlint container; GitHub run pending |
| G02 | yamllint/ShellCheck/Hadolint | PLANNED | not installed |
| G03 | ESLint/Prettier | PARTIAL | JS syntax + whitespace hygiene |
| G04 | TypeScript typecheck | PLANNED | demo API currently plain JS |
| G05 | Unit tests | LOCAL + REMOTE | node:test on pricing/storage; happy release verified |
| G06 | Coverage threshold | LOCAL, REMOTE PENDING | node:test lines ≥80%, locally measured 82.61% |
| G07 | Node/platform matrix | PARTIAL | Node 22 and 24 PR unit matrix; no OS matrix |
| G08 | Postgres integration | IMPLEMENTED, REMOTE PENDING | real pg, PostgreSQL service, transactional concurrent idempotency test; skipped locally without DB |
| G09 | API E2E | LOCAL | real HTTP order lifecycle |
| G10 | API backward compatibility | PARTIAL + REMOTE | JSON response contract; verified failed `orderId` fixture; no oasdiff |
| G11 | Pact consumer contract | PLANNED | no Pact consumer yet |
| G12 | Event/schema compatibility | OPTIONAL | no event bus in demo |
| G13 | DB migration safety | PLANNED | no database yet |
| G14 | Architecture boundaries | PARTIAL | local imports restricted to src |
| G15 | Dependency cycles | LOCAL | source import graph DFS + red fixture |
| G16 | Gitleaks/secret scanning | PARTIAL | basic patterns + generated synthetic red case |
| G17 | SAST | PLANNED | no CodeQL/Semgrep |
| G18 | SCA | LOCAL, REMOTE PENDING | real npm audit high+ found no vulnerabilities; PR gate + nightly |
| G19 | License policy | LOCAL FIXTURE | explicit allowlist on synthetic component licenses; no actual dependency classifier |
| G20 | IaC/K8s policy | LOCAL, REMOTE PENDING | JSON fixtures + actual real K8s Deployment security check, no OPA/Trivy yet |
| G21 | Image CVE scan | PLANNED | Docker builds/smokes only |
| G22 | SBOM completeness | LOCAL, REMOTE PENDING | real npm CycloneDX SBOM (14 components) + PURL and pg requirement + PR artifact |
| G23 | Attestation/provenance | PLANNED | no signed verification yet |
| G24 | Immutable promotion | PARTIAL + REMOTE | GHCR digest verified live; fixture equality test and same digest in kind deploy, no production |
| G25 | Performance smoke | PARTIAL | local p95 measurement, no k6 |
| G26 | Cost budget preview | LOCAL FIXTURE | explicitly labeled synthetic Pulumi JSON and budget policy, no live cloud |
| G27 | OIDC claims and STS | LOCAL SYNTHETIC | cryptographically verified local RS256 JWT and reject tests, no actual STS |
| G28 | Production approval | CONFIG | no production deploy; requires environment setup |
| G29 | Post-deploy smoke | IMPLEMENTED, REMOTE PENDING | reusable kind 2-pod deployment/readiness/HTTP smoke; earlier real Docker smoke green |
| G30 | Rolling/canary availability | IMPLEMENTED, REMOTE PENDING | kind maxUnavailable=0 + 25 HTTP checks during bad digest rollout |
| G31 | Rollback | IMPLEMENTED, REMOTE PENDING | actual kind failed rollout → kubectl rollout undo → original digest + smoke; no production |
| G32 | Aggregate required checks | PARTIAL | aggregate job exists; branch ruleset not configured |

The diagram in [docs/index.html](docs/index.html) intentionally shows the
complete **target** from the implementation brief. A green visualization
does not prove any job ran on GitHub.
