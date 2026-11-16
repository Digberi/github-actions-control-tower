# G01–G32 — reality check

This matrix distinguishes **local implementation** from **verified remote execution**.
The initial push is published and three remote runs were verified on
2026-11-16; see [VERIFICATION.md](VERIFICATION.md).

Legend: `LOCAL` = implemented and manually runnable, `PARTIAL` = some narrower
behavior implemented, `PLANNED` = not yet implemented, `CONFIG` = dependent on
GitHub settings, `OPTIONAL` = only needed when representative events exist.

| ID | Target gate | First-cut status | Actual implementation / gap |
|---|---|---|---|
| G01 | actionlint | PARTIAL | structural policy script; no actionlint/YAML semantics |
| G02 | yamllint/ShellCheck/Hadolint | PLANNED | not installed |
| G03 | ESLint/Prettier | PARTIAL | JS syntax + whitespace hygiene |
| G04 | TypeScript typecheck | PLANNED | demo API currently plain JS |
| G05 | Unit tests | LOCAL + REMOTE | node:test on pricing/storage; happy release verified |
| G06 | Coverage threshold | PARTIAL | nightly informational report, no gate |
| G07 | Node/platform matrix | PARTIAL | Node 22 and 24 PR unit matrix; no OS matrix |
| G08 | Postgres integration | PARTIAL | HTTP integration, no Postgres |
| G09 | API E2E | LOCAL | real HTTP order lifecycle |
| G10 | API backward compatibility | PARTIAL + REMOTE | JSON response contract; verified failed `orderId` fixture; no oasdiff |
| G11 | Pact consumer contract | PLANNED | no Pact consumer yet |
| G12 | Event/schema compatibility | OPTIONAL | no event bus in demo |
| G13 | DB migration safety | PLANNED | no database yet |
| G14 | Architecture boundaries | PARTIAL | local imports restricted to src |
| G15 | Dependency cycles | LOCAL | source import graph DFS + red fixture |
| G16 | Gitleaks/secret scanning | PARTIAL | basic patterns + generated synthetic red case |
| G17 | SAST | PLANNED | no CodeQL/Semgrep |
| G18 | SCA | PARTIAL | npm audit in nightly; zero runtime dependencies |
| G19 | License policy | PLANNED | no license classifier |
| G20 | IaC/K8s policy | PLANNED | no IaC yet |
| G21 | Image CVE scan | PLANNED | Docker builds/smokes only |
| G22 | SBOM completeness | PLANNED | no SBOM generator yet |
| G23 | Attestation/provenance | PLANNED | no signed verification yet |
| G24 | Immutable promotion | PARTIAL + REMOTE | GHCR digest was used by ephemeral smoke, not production |
| G25 | Performance smoke | PARTIAL | local p95 measurement, no k6 |
| G26 | Cost budget preview | PLANNED | no Pulumi |
| G27 | OIDC claims and STS | PLANNED | no cloud role assumption |
| G28 | Production approval | CONFIG | no production deploy; requires environment setup |
| G29 | Post-deploy smoke | PARTIAL + REMOTE | green ephemeral smoke on runner, not real staging |
| G30 | Rolling/canary availability | PLANNED | no Kubernetes |
| G31 | Rollback | PLANNED | no persisted release history |
| G32 | Aggregate required checks | PARTIAL | aggregate job exists; branch ruleset not configured |

The diagram in [docs/index.html](docs/index.html) intentionally shows the
complete **target** from the implementation brief. A green visualization
does not prove any job ran on GitHub.
