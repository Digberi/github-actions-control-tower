# GitHub Actions Control Tower — лекція 32

Навчальний стенд із **реальними GitHub Actions workflows**, маленьким Node.js HTTP API,
контрольованими RED/GREEN помилками та інтерактивною HTML-картою цільового heavy CI/CD.

**Важлива межа:** це розширюваний стенд із реальним PostgreSQL, GHCR
та тимчасовим Kubernetes-кластером на GitHub runner, але поки **не повна
реалізація всіх 32 гейтів**. Деякі гейти демонструють вузькі політики
на чесно позначених fixtures. Повний план реалізації, критерії приймання й
14 advanced demo-сценаріїв — у [IMPLEMENTATION_BRIEF.md](IMPLEMENTATION_BRIEF.md).
Поточний стан по кожному G01–G32 — [CHECKS_MATRIX.md](CHECKS_MATRIX.md).
Фактичні GitHub прогони — [VERIFICATION.md](VERIFICATION.md).
**Налаштування, які потребують прав власника / AWS:** [docs/OPERATOR_HANDOFF.md](docs/OPERATOR_HANDOFF.md).
**Для проведення лекції:** [18-хвилинний сценарій із прямими посиланнями на GREEN/RED jobs](LECTURE_DEMO.md).

**Нові поглиблені приклади:** [G13 real PostgreSQL expand/contract](docs/G13_POSTGRES_MIGRATION.md),
[G21 Trivy RED→GREEN](CHECKS_MATRIX.md),
[G24 immutable staging→second kind promotion](docs/G24_KIND_PROMOTION.md).

## Інтерактивна візуалізація

Відкрий [docs/index.html](docs/index.html) у браузері: схема працює
без npm, серверів, інтернету та сторонніх бібліотек.

**[Відкрити опубліковану інтерактивну демонстрацію →](https://digberi.github.io/github-actions-control-tower/)**

Перевірений trusted release на `main` (17.11.2026): [GHCR + Sigstore + ephemeral kind rollout/rollback GREEN](https://github.com/Digberi/github-actions-control-tower/actions/runs/44072283082).
18.11.2026 у [PR #19](https://github.com/Digberi/github-actions-control-tower/pull/19)
Trivy пройшов на новому мінімальному runtime; [новий реліз перевіряє G21 перед kind staging](https://github.com/Digberi/github-actions-control-tower/actions/runs/44321088467).

- Вибери один із шести сюжетів або один із 18 окремих gate-сценаріїв (включно з G03/G04/G07/G09).
- Клікни на етап, щоб подивитися список гейтів.
- Схема показує **цільову архітектуру**, не стверджує, що гейт уже запущено.
- Workflow [pages.yml](.github/workflows/pages.yml) публікує цю сторінку на GitHub Pages
  після налаштування Settings → Pages → Build and deployment → GitHub Actions.

## Локальний quick start

Передумова: Node.js 22+; Docker потрібен лише для контейнерної демонстрації.

~~~bash
npm ci
npm run check
npm run check:depgraph
npm run check:heavy
npm run check:coverage
npm run check:sbom
~~~

### G03/G04/G07/G09 — розширення для перевірки якості

Нові окремі workflows додають реальні **ESLint + Prettier**, **tsc strict checkJs у production source**,
**Node/OS matrix** (Ubuntu 22/24, macOS 22, Windows 22) та E2E RED.
Інструменти G03/G04 закріплено точними версіями в `package-lock.json`:

~~~bash
npm run quality:bootstrap
npm run check:style
npm run check:types
npm run check:types:demo
npm run test:pact:green
npm run demo:depgraph:red
npm run check:platform
npm run demo:case -- --id G03 --mode red --target local
npm run demo:case -- --id G04 --mode red --target local
npm run demo:case -- --id G07 --mode red --target local
npm run demo:case -- --id G09 --mode red --target local
~~~

G03 перевіряє **всі `src/*.mjs`** та окрему style fixture; G04 — strict
TypeScript DTO **і весь production JavaScript API** через `checkJs` + JSDoc.
[Відтворення реального source RED/GREEN](docs/G03_G04_SOURCE.md), [Pact V4](docs/G11_PACT.md).
У G07 локальний RED використовує
чітко позначену Windows-path emulation, а RED GitHub workflow перевіряє
**справжній Windows runner**. Не називати локальну емуляцію виконанням Windows.

Робочий API:

~~~bash
npm start
curl http://localhost:3000/health
curl http://localhost:3000/health/live
curl http://localhost:3000/health/ready
curl http://localhost:3000/metrics
curl -X POST http://localhost:3000/orders \
  -H "content-type: application/json" \
  -d '{"items":[{"quantity":2,"priceCents":199}]}'
~~~

З `DATABASE_URL` запускається справжнє PostgreSQL-сховище з транзакціями
та idempotency key. Без БД застосунок працює in-memory; у PR окрема job
з PostgreSQL service container перевіряє concurrent retries і rollback.

## Керований сценарій лектора (18 парних гейтів, 36 варіантів)

~~~bash
npm run demo:preflight
npm run demo:list
npm run demo:case -- --id G27 --mode red --target local --session lecture
npm run demo:case -- --id G27 --mode green --target local --session lecture
npm run demo:report
npm run demo:show -- --id G10
npm run demo:case -- --id G27 --mode red --target prepared
npm run demo:cleanup -- --scope lecture --dry-run
~~~

Контролер записує JSON у `reports/` із джерелом `LOCAL` або
`GITHUB_REAL`. Локальний `red` вважається успішною **демонстрацією
очікуваної помилки**, а у GitHub Actions реальний red гейт повертає
`exit 1`, робить job червоною та зберігає evidence як artifact.
Для вибору Gxx відкрий **Actions → Controlled Red / Green → Run workflow**.
Фікстури OIDC — локальні RS256 підписи, **не** справжні GitHub JWT або AWS STS.
Із 18 пар G03/G04 потребують встановлених devDependencies (`npm ci`), решта
16 виконуються без цього toolchain. Для готових результатів G03/G04/G07/G09
доступний `--target prepared` з реально перевіреними RED/GREEN run URLs.

## Демонстрація RED / GREEN без редагування репозиторію

~~~bash
npm run demo:happy          # all green
npm run demo:unit           # injected pricing bug
npm run demo:integration    # wrong HTTP status
npm run demo:contract       # removed response field
npm run demo:architecture   # injected import cycle
npm run demo:security       # generated fake secret pattern
npm run demo:performance    # artificially slow response and p95 failure
~~~

Старі короткі команди вище залишені для швидкого показу шести сценаріїв;
новий контролер охоплює consumer contract, migration safety,
architecture boundaries, license, K8s, digest, cost та OIDC.

## GitHub Actions

Вже збережені приклади для лекції:

- [GREEN — повний happy check](https://github.com/Digberi/github-actions-control-tower/actions/runs/43889811097).
- [RED — зламаний контракт, відсутній `orderId`](https://github.com/Digberi/github-actions-control-tower/actions/runs/43889707611).
- [GREEN — GHCR release + smoke того самого digest](https://github.com/Digberi/github-actions-control-tower/actions/runs/43889385092).

GitHub Pages **увімкнено й перевірено в браузері**:
[публічна сторінка](https://digberi.github.io/github-actions-control-tower/)
опублікована успішним [workflow](https://github.com/Digberi/github-actions-control-tower/actions/runs/43889385204)
(повторний запуск після налаштування джерела).

| Workflow | Trigger | Результат |
|---|---|---|
| `01 · PR Quality Gates` | PR, manual | actionlint, PostgreSQL, coverage, policy matrix, CycloneDX, audit, static/unit/E2E/perf/Docker та required job |
| `02 · Trusted Build and Publish` | push main, manual | GHCR digest + Sigstore attestation/verification → Docker smoke → kind K8s rollout/rollback |
| `03 · Controlled Red / Green` | manual із scenario або gate+mode | real RED job, session-scoped JSON artifact |
| `04 · Interactive HTML Demo` | docs change on main, manual | GitHub Pages із `docs/` |
| `05 · Scheduled Deep Checks` | Mondays, manual, main changes | npm audit + coverage + real 3,000-seed property tests, killed arithmetic mutant, 20s HTTP soak (88k+ verified order cycles) |
| `Reusable · Ephemeral kind Deployment` | workflow_call | 2 pod replicas, digest, live probes, availability, undo |
| `06 · Manual Rollback Drill` | manual | відтворюваний kind rollback без rebuild |
| `07 · Real k6 Performance Gate` | PR, manual green/red | справжній k6 p95/failed rate thresholds + JSON report |
| `08 · CodeQL Static Analysis` | PR, main, manual | GitHub SAST security-extended query pack |
| `09 · Trivy Image Vulnerability Scan` | scheduled/manual | справжній CVE scan image@sha256, HIGH/CRITICAL exit 1 + JSON evidence |
| `10 · Real OpenAPI Compatibility` | PR, manual green/red | oasdiff перевіряє spec на breaking changes |
| `11 · YAML and Dockerfile Linters` | PR, manual | реальний yamllint + Hadolint; actionlint містить ShellCheck |
| `12 · Real OS and Node Compatibility Matrix` | PR, manual green/red | Ubuntu Node 22/24, macOS 22, Windows 22; керований Windows-only RED |
| `13 · Real ESLint Prettier and TypeScript` | PR, manual G03/G04 green/red | lockfile-прибиті інструменти перевіряють `src/` + окремі fixtures; machine-readable reports |
| `14 · Real Secret and License Security Gates` | reusable PR, manual red/green | Gitleaks real source scan + actual installed npm dependency licenses; RED/GREEN JSON evidence |
| `15 · Trivy Kubernetes IaC Policy` | reusable PR, manual red/green | actual Trivy config on real infra/k8s; 5 HIGH/CRITICAL red fixture; green source scan |

Після першого push:

1. Відкрий **Actions → Controlled Red / Green → Run workflow** і вибери `contract`.
   Зафіксуй червону job і повідомлення, яке поле контракту видалено.
2. Запусти ще раз із `happy`. Тепер job зелена.
3. Створи PR із реальним дефектом (не з demo-фікстурою), подивися
   паралельні jobs і фінальний `Required · PR Gate`.
4. Для блокування merge налаштуй **branch protection / ruleset**
   і зроби `Required · PR Gate` обов'язковим. Сам workflow
   без цієї настройки merge не блокує.
5. Відкрий [інтерактивну схему](https://digberi.github.io/github-actions-control-tower/) та покажи, як вибір RED-сценарію зупиняє downstream jobs.

**Безпека:** недовірений PR не має прав publish/deploy; `packages: write`
є тільки в trusted `main` release job. Жодного AWS role або платного
інфраструктурного deployment за замовчуванням.
`CI_DEMO_SCENARIO` не впливає на звичайні CI jobs — тільки на
окремий навчальний запуск.

## Що означають і що НЕ означають зелені статуси

- `check:secrets` локально — прості патерни; справжній Gitleaks окремо працює у reusable security workflow.
- `check:contract` перевіряє backward compatibility невеликого JSON-контракту,
  не OAS/OpenAPI semantics чи Pact.
- `check:performance` — швидкий локальний HTTP smoke; окремий workflow виконує справжній k6.
- `test:integration` використовує HTTP/in-memory; окремий `test:postgres` перевіряє реальну БД.
- `staging-kind` розгортає **тимчасовий kind на runner**, не постійний cloud staging.
- G30/G31 — actual bad rollout + undo у kind, не production rollback.
- G19 сканує фактично встановлені npm-ліцензії, G20 використовує справжній Trivy config. Старі fixtures збережено окремо. G26 cost preview досі synthetic; OPA/Rego не інтегровано.
- G14/G15 — незалежний Required gate із реальним dependency-cruiser та JSON-графом; [покрокове RED/GREEN](docs/G14_G15_DEPGRAPH.md).
- Візуалізація всіх 32 гейтів — архітектурна мета, а не доказ виконання.

## Для coding-агента

Прочитай [AGENTS.md](AGENTS.md), потім
[IMPLEMENTATION_BRIEF.md](IMPLEMENTATION_BRIEF.md).
Працюй інкрементально; спочатку стабільні green/red прогонки, далі
Pact Broker/can-i-deploy, розширене SAST/image remediation/approval. Не підміняй
компоненти макетами з фальшивим SUCCESS.

## Структура

~~~text
docs/index.html                 self-contained interactive diagram
src/                            Node.js HTTP orders demo
tests/                          unit, HTTP integration, E2E
contracts/                      baseline/current public API snapshots
fixtures/                       controlled incompatible contract
scripts/gates.mjs               real first-cut checks
scripts/demo.mjs                local scenario orchestrator
scripts/demo-controller.mjs     session-scoped red/green controller
src/postgres.mjs                transactional database store
infra/k8s/                     kind deployment with immutable digest
.github/workflows/              PR, GHCR, scenarios, Pages, nightly
IMPLEMENTATION_BRIEF.md         specification for agent implementation
CHECKS_MATRIX.md                current implementation vs planned 32 gates
~~~
