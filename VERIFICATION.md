# Перевірені GitHub Actions — evidence ledger

Станом на **16.11.2026**. Нижче — справжні публічні GitHub workflow runs,
не намальовані позначки, не локальні симуляції. Для кожної демонстрації
червоний статус може бути **очікуваним** — дивись причину та JSON/Markdown
артефакти, а не лише кольорову іконку.

| Механізм | Результат | Справжній GitHub run |
|---|---|---|
| P3 nightly: actual 20s six-client HTTP soak, 88,521 order create/read cycles, 181,470 HTTP requests, 0 errors, p95 1.54ms | ✅ GREEN, JSON artifact | [43968370280](https://github.com/Digberi/github-actions-control-tower/actions/runs/43968370280) |
| P3 nightly: actual seeded property tests plus `CI_DEMO_SCENARIO=unit` mutant detected by failing assertions | ✅ MUTANT KILLED, JSON evidence | [43968370280](https://github.com/Digberi/github-actions-control-tower/actions/runs/43968370280) |
| G25 PR quick soak: 3s, 16,726 HTTP requests, 0 errors, p95 2.67ms | ✅ GREEN, JSON artifact | [43968155397](https://github.com/Digberi/github-actions-control-tower/actions/runs/43968155397) |
| G05 property fuzz: arithmetic loses integer precision beyond MAX_SAFE_INTEGER; missing expected TypeError | 🔴 EXPECTED RED, real assertion + TAP artifact, required PR failed | [43967673291](https://github.com/Digberi/github-actions-control-tower/actions/runs/43967673291) |
| G05 property fuzz: Number.isSafeInteger guards both line and cumulative cents, 3,000 seeded examples | ✅ GREEN | [43967957021](https://github.com/Digberi/github-actions-control-tower/actions/runs/43967957021) |
| G20: real Trivy config scanner found 5 HIGH/CRITICAL in generated insecure Kubernetes Deployment, exit 1, JSON artifact | 🔴 EXPECTED RED | [43966679118](https://github.com/Digberi/github-actions-control-tower/actions/runs/43966679118) |
| G20: Trivy config scans actual `infra/k8s/*.json` with no HIGH/CRITICAL and artifact | ✅ GREEN | [43966807059](https://github.com/Digberi/github-actions-control-tower/actions/runs/43966807059) |
| G16: verified Gitleaks v8.30.1, temporary fake PAT detected, exit 1 + redacted JSON | 🔴 EXPECTED RED | [43965551427](https://github.com/Digberi/github-actions-control-tower/actions/runs/43965551427) |
| G19: actual installed npm license inventory (14 packages + one temporary GPL input), exit 1 + JSON | 🔴 EXPECTED RED | [43965551427](https://github.com/Digberi/github-actions-control-tower/actions/runs/43965551427) |
| G16/G19: actual Gitleaks repo scan + installed npm dependency licenses | ✅ GREEN BOTH | [43965642276](https://github.com/Digberi/github-actions-control-tower/actions/runs/43965642276) |
| PR #1: actionlint, PostgreSQL, тестова матриця, coverage, SBOM/audit, Docker, required job | ✅ GREEN | [43894228150](https://github.com/Digberi/github-actions-control-tower/actions/runs/43894228150) |
| PR #2: незалежний consumer, міграція, boundaries, required checks | ✅ GREEN | [43896867056](https://github.com/Digberi/github-actions-control-tower/actions/runs/43896867056) |
| PR #3: новий OpenAPI, Hadolint, yamllint, required suite | ✅ GREEN | [43898394030](https://github.com/Digberi/github-actions-control-tower/actions/runs/43898394030) |
| PR #8: Node HTTP E2E + required gate | ✅ GREEN | [43953382585](https://github.com/Digberi/github-actions-control-tower/actions/runs/43953382585) |
| G03/G04: real ESLint 9 + Prettier 3 / `tsc --noEmit` strict DTO | ✅ GREEN BOTH | [43953383179](https://github.com/Digberi/github-actions-control-tower/actions/runs/43953383179) |
| G03: true ESLint `eqeqeq`, `semi` violations + Prettier formatting | 🔴 EXPECTED RED, exit 1 + artifact | [43954058276](https://github.com/Digberi/github-actions-control-tower/actions/runs/43954058276) |
| G04: true TypeScript TS2322 string → number mismatch | 🔴 EXPECTED RED, exit 1 + artifact | [43954113680](https://github.com/Digberi/github-actions-control-tower/actions/runs/43954113680) |
| G07: real four-runner Ubuntu/macOS/Windows matrix | ✅ GREEN 4/4 | [43953382799](https://github.com/Digberi/github-actions-control-tower/actions/runs/43953382799) |
| G07: POSIX path separator assumption | 🔴 EXPECTED RED, Windows fails; Ubuntu 22/24 and macOS pass; artifact each | [43954175867](https://github.com/Digberi/github-actions-control-tower/actions/runs/43954175867) |
| G09: actual API E2E unknown-route 200 ≠ 404 | 🔴 EXPECTED RED, exit 1 + JSON artifact | [43955060328](https://github.com/Digberi/github-actions-control-tower/actions/runs/43955060328) |
| G09: API E2E restored 404 invariant | ✅ GREEN + JSON artifact | [43955108982](https://github.com/Digberi/github-actions-control-tower/actions/runs/43955108982) |
| G02: реальний yamllint + Hadolint (після виправлення Dockerfile) | ✅ GREEN | [43898394391](https://github.com/Digberi/github-actions-control-tower/actions/runs/43898394391) |
| G02: Hadolint помітив shell-form HEALTHCHECK | 🔴 EXPECTED FIX CYCLE | [43897556010](https://github.com/Digberi/github-actions-control-tower/actions/runs/43897556010) |
| G02: Hadolint помітив нечисловий USER | 🔴 EXPECTED FIX CYCLE | [43898053537](https://github.com/Digberi/github-actions-control-tower/actions/runs/43898053537) |
| G10: oasdiff OpenAPI nonbreaking candidate на PR | ✅ GREEN | [43898394017](https://github.com/Digberi/github-actions-control-tower/actions/runs/43898394017) |
| G10: оasdiff видалено `orderId`, explicit `--fail-on ERR` | 🔴 EXPECTED RED | [43899543939](https://github.com/Digberi/github-actions-control-tower/actions/runs/43899543939) |
| G10: ручний сумісний OpenAPI після виправлення exit policy | ✅ GREEN | [43899598220](https://github.com/Digberi/github-actions-control-tower/actions/runs/43899598220) |
| G17: CodeQL security-extended | ✅ GREEN | [43898394012](https://github.com/Digberi/github-actions-control-tower/actions/runs/43898394012) |
| G25: реальний k6 p95 + error rate | ✅ GREEN | [43896867157](https://github.com/Digberi/github-actions-control-tower/actions/runs/43896867157) |
| G25: реальний k6 RED p95 ≈1.6s > 800ms threshold, JSON/HTML evidence | 🔴 EXPECTED RED | [43900813599](https://github.com/Digberi/github-actions-control-tower/actions/runs/43900813599) |
| Trusted release: GHCR digest, Sigstore attestation, незалежне verify, kind rollout/rollback | ✅ GREEN | [43897091325](https://github.com/Digberi/github-actions-control-tower/actions/runs/43897091325) |
| G21: Trivy виявив HIGH/CRITICAL у наявному immutable GHCR image, збережено JSON | 🔴 BLOCKED BY CVEs | [43898137840](https://github.com/Digberi/github-actions-control-tower/actions/runs/43898137840) |
| G27: синтетичний RS256 OIDC JWT з неправильним subject | 🔴 EXPECTED RED | [43894863175](https://github.com/Digberi/github-actions-control-tower/actions/runs/43894863175) |
| G27: синтетичний RS256 OIDC JWT з дозволеним subject | ✅ GREEN | [43894983037](https://github.com/Digberi/github-actions-control-tower/actions/runs/43894983037) |
| Старий JSON consumer contract: missing orderId | 🔴 EXPECTED RED | [43889707611](https://github.com/Digberi/github-actions-control-tower/actions/runs/43889707611) |
| Контрольне happy demo | ✅ GREEN | [43889811097](https://github.com/Digberi/github-actions-control-tower/actions/runs/43889811097) |
| GitHub Pages | ✅ PUBLISHED | [відкрити HTML](https://digberi.github.io/github-actions-control-tower/) |

## Supply chain та Kubernetes — що справді доведено

- GHCR digest у [першому перевіреному kind release](https://github.com/Digberi/github-actions-control-tower/actions/runs/43894401938):
  `ghcr.io/digberi/github-actions-control-tower@sha256:5d2043265842382a06efa9e66edb33b5bbe27647d01a103fc164d28a210e699f`.
- Наступний trusted release [43897091325](https://github.com/Digberi/github-actions-control-tower/actions/runs/43897091325)
  створив реальну Sigstore/GitHub provenance attestation для immutable digest;
  незалежний крок `gh attestation verify` завершився успішно.
- Kind піднімає **реальний тимчасовий Kubernetes на GitHub runner**, Deployment
  із двома репліками, readiness/liveness, Service HTTP. Невдалий rollout
  з неіснуючим digest був виявлений; 25 HTTP проб перевірили доступність,
  після чого `kubectl rollout undo` повернув попередній digest.
  [Логи та deploy evidence](https://github.com/Digberi/github-actions-control-tower/actions/runs/43894401938).
- PostgreSQL 16 піднімається окремим service container у PR; перевіряються
  транзакційна ідемпотентність та конкурентні повтори.
- npm створює **реальний CycloneDX SBOM** і прикріплює його до run;
  `npm audit --audit-level=high` є реальною перевіркою залежностей.

## Червоні прогони — інтерпретація

1. **G21 Trivy** — реальний security finding на існуючому container image.
   Scan крок завершився exit 1, проте job `upload-artifact` успішно зберіг
   `trivy-image-cve-report`. Це **не зелений security gate**.
2. **G27 OIDC** — криптографічно підписаний **синтетичний RSA JWT** перевіряється
   офлайн за `iss/aud/sub/exp`. Це **не реальний AWS STS exchange**.
3. **G02 Hadolint** — показовий fail → fix → fail наступного правила →
   fix → green. Жоден результат не підмінявся.
4. **G03/G04/G07/G09** — реальні RED jobs на GitHub runners (не симуляція
   повідомлення про помилку). `ESLint` повідомив `eqeqeq` і `semi`,
   `tsc` — `TS2322`, а Windows спіймав некоректне POSIX-only припущення;
   три інші matrix combinations залишилися зеленими. Для G09 E2E справді
   спостерігали `200 !== 404` і перевірили виправлення на окремому GREEN run.
   Всі failed jobs виконали `upload-artifact` успішно.
5. **G10 oasdiff** — ручний [перший RED attempt 43898787400](https://github.com/Digberi/github-actions-control-tower/actions/runs/43898787400)
   виявив підступний **false-green**: без `--fail-on ERR` oasdiff публікував
   breaking-change report, але повертав exit 0. [PR #4](https://github.com/Digberi/github-actions-control-tower/pull/4)
   додав explicit exit policy. Після нього [RED 43899543939](https://github.com/Digberi/github-actions-control-tower/actions/runs/43899543939)
   справді впав на breaking change, а [GREEN 43899598220](https://github.com/Digberi/github-actions-control-tower/actions/runs/43899598220)
   перевіряє сумісний контракт. Перший прогін — false-green teaching evidence,
   не RED evidence.

## Чесні межі

- **GitHub Environments production approval (G28)** не налаштовано, бо
  немає призначеного reviewer/prod-середовища. **Branch protection/ruleset
  (G32)** ще не налаштовано: агрегувальний `Required · PR Gate` є, але
  немає підтвердженої заборони merge на GitHub UI.
- Deployment — **staging-like на ephemeral kind**, не AWS/production.
  Один перевірений digest проходить kind; actual production promotion
  із human approval немає.
- Full-repository ESLint/TypeScript, Pact, Gitleaks, OPA, реальний Pulumi cost, cloud STS,
  DAST/fuzzing/mutation та частина G01–G32 — **не реалізовані повністю**.
  Деталі — у [матриці гейтів](CHECKS_MATRIX.md).
- HTTP visualization — інтерактивна **модель** для пояснення причин/наслідків,
  а доказ виконання — гіперпосилання на реальні GitHub run IDs.
