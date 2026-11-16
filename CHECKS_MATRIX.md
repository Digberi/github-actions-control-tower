# G01–G32 — reality check

This matrix distinguishes **local implementation** from **verified remote execution**.
Multiple implementation pull requests have been merged on 2026-11-16 (through PR #10), with PR #11 proving G16/G19 RED/GREEN. Real runner
evidence includes [PR #8](https://github.com/Digberi/github-actions-control-tower/pull/8),
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
| G03 | ESLint/Prettier | READY NARROW + REMOTE RED/GREEN | real ESLint 9 and Prettier 3 on source + isolated style fixture; [RED exit 1 + artifact](https://github.com/Digberi/github-actions-control-tower/actions/runs/43954058276) (`eqeqeq`, `semi`, formatting) / [GREEN](https://github.com/Digberi/github-actions-control-tower/actions/runs/43953383179); not full-repo lint |
| G04 | TypeScript typecheck | READY DTO + REMOTE RED/GREEN | actual `tsc --noEmit` strict on typed order DTO, [RED TS2322 + artifact](https://github.com/Digberi/github-actions-control-tower/actions/runs/43954113680) / [GREEN](https://github.com/Digberi/github-actions-control-tower/actions/runs/43953383179); API remains ESM JavaScript |
| G05 | Unit tests | LOCAL + REMOTE | node:test on pricing/storage; happy release verified |
| G06 | Coverage threshold | READY + REMOTE | node:test lines ≥80%, locally measured 82.61%, green PR job |
| G07 | Node/platform matrix | READY REAL MATRIX + REMOTE RED/GREEN | real [GREEN four runners](https://github.com/Digberi/github-actions-control-tower/actions/runs/43953382799): Ubuntu Node 22/24, macOS Node 22, Windows Node 22. [RED](https://github.com/Digberi/github-actions-control-tower/actions/runs/43954175867): Windows fails on POSIX-only separator, other 3 pass; every job uploads evidence |
| G08 | Postgres integration | READY + REMOTE | PostgreSQL 16 service + concurrent transactional idempotency test green; skipped locally without DB |
| G09 | API E2E | READY + REMOTE RED/GREEN | real HTTP order lifecycle in [PR #8](https://github.com/Digberi/github-actions-control-tower/actions/runs/43953382585); [RED run](https://github.com/Digberi/github-actions-control-tower/actions/runs/43955060328) returns 200 instead of required 404 (actual assertion failure, exit 1 + artifact); [GREEN run](https://github.com/Digberi/github-actions-control-tower/actions/runs/43955108982) passes and saves artifact |
| G10 | API backward compatibility | READY + REMOTE RED/GREEN | Real OpenAPI 3.0 oasdiff; explicit `--fail-on ERR` fixed [false-green](https://github.com/Digberi/github-actions-control-tower/actions/runs/43898787400). [RED](https://github.com/Digberi/github-actions-control-tower/actions/runs/43899543939) / [GREEN](https://github.com/Digberi/github-actions-control-tower/actions/runs/43899598220) |
| G11 | Pact consumer contract | READY CONSUMER + REMOTE | independent HTTP consumer old response contract, verified GH PR job; not Pact yet |
| G12 | Event/schema compatibility | OPTIONAL | no event bus in demo |
| G13 | DB migration safety | READY NARROW + REMOTE | actual applied 001_orders.sql with additive-only validator vs red drop-column fixture |
| G14 | Architecture boundaries | READY NARROW + REMOTE | domain-to-transport import forbidden, real source graph + red fixture |
| G15 | Dependency cycles | LOCAL | source import graph DFS + red fixture |
| G16 | Gitleaks/secret scanning | READY REAL + REMOTE RED/GREEN | [Gitleaks v8.30.1 real RED](https://github.com/Digberi/github-actions-control-tower/actions/runs/43965551427) detected 1 ephemeral fake PAT, exit 1 + redacted report; [GREEN](https://github.com/Digberi/github-actions-control-tower/actions/runs/43965642276) scanned real checked-out files. Earlier pattern demo preserved; repository history scanning not yet wired. |
| G17 | SAST | READY CODEQL + REMOTE | [CodeQL security-extended JS workflow success](https://github.com/Digberi/github-actions-control-tower/actions/runs/43896867239) |
| G18 | SCA | READY NPM + REMOTE | real npm audit high+ found no vulnerabilities; PR gate green; full Trivy SCA remains |
| G19 | License policy | READY REAL NPM + REMOTE RED/GREEN | Real `npm ci` and transitive installed `package.json` license inventory (14 actual); [RED](https://github.com/Digberi/github-actions-control-tower/actions/runs/43965551427) ephemeral GPL policy input rejected, exit 1 + JSON; [GREEN](https://github.com/Digberi/github-actions-control-tower/actions/runs/43965642276) installed-dependency allowlist passes. Strict SPDX tokens; no license text verification. |
| G20 | IaC/K8s policy | READY NARROW + REMOTE | JSON fixtures + real K8s Deployment security check green in PR, no OPA/Trivy yet |
| G21 | Image CVE scan | READY + REAL RED | [Trivy exit 1](https://github.com/Digberi/github-actions-control-tower/actions/runs/43898137840) on immutable GHCR digest due HIGH/CRITICAL findings, real JSON evidence uploaded; needs CVE remediation to be green |
| G22 | SBOM completeness | READY NPM + REMOTE | real npm CycloneDX SBOM (14 components) + PURL and pg requirement + PR artifact |
| G23 | Attestation/provenance | READY REAL + REMOTE | trusted release GitHub Sigstore provenance and independent gh attestation verify both passed in [release 43897091325](https://github.com/Digberi/github-actions-control-tower/actions/runs/43897091325) |
| G24 | Immutable promotion | READY KIND + REMOTE | verified real GHCR digest identical in Docker and kind deployment; no production |
| G25 | Performance smoke | READY K6 + REMOTE RED/GREEN | [k6 GREEN](https://github.com/Digberi/github-actions-control-tower/actions/runs/43896867157); [k6 RED](https://github.com/Digberi/github-actions-control-tower/actions/runs/43900813599) intentionally induced p95 ~1.6s vs 800ms threshold, artifact uploaded |
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
