# GitHub Actions Control Tower — лекція 32

Навчальний стенд із **реальними GitHub Actions workflows**, маленьким Node.js HTTP API,
контрольованими RED/GREEN помилками та інтерактивною HTML-картою цільового heavy CI/CD.

**Важлива межа:** це перевірюваний *перший вертикальний зріз*, а не повна
реалізація всіх 32 гейтів. Повний план реалізації, критерії приймання й
14 advanced demo-сценаріїв — у [IMPLEMENTATION_BRIEF.md](IMPLEMENTATION_BRIEF.md).
Поточний стан по кожному G01–G32 — [CHECKS_MATRIX.md](CHECKS_MATRIX.md).

## Інтерактивна візуалізація

Відкрий [docs/index.html](docs/index.html) у браузері: схема працює
без npm, серверів, інтернету та сторонніх бібліотек.

- Вибери один із шести сценаріїв (happy, contract, security, performance, approval, rollout).
- Клікни на етап, щоб подивитися список гейтів.
- Схема показує **цільову архітектуру**, не стверджує, що гейт уже запущено.
- Workflow [pages.yml](.github/workflows/pages.yml) публікує цю сторінку на GitHub Pages
  після налаштування Settings → Pages → Build and deployment → GitHub Actions.

## Локальний quick start

Передумова: Node.js 22+; Docker потрібен лише для контейнерної демонстрації.

~~~bash
npm ci
npm run check
~~~

Робочий API:

~~~bash
npm start
curl http://localhost:3000/health
curl -X POST http://localhost:3000/orders \
  -H "content-type: application/json" \
  -d '{"items":[{"quantity":2,"priceCents":199}]}'
~~~

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

Локальний demo-controller повертає `0`, якщо отримано **очікуваний**
результат (навіть навмисно червоний). У GitHub workflow
**Controlled Red / Green** використовується безпосередньо *гейт*,
а не controller: навмисна помилка повертає `exit 1` і робить job
по-справжньому червоною.

## GitHub Actions

| Workflow | Trigger | Результат |
|---|---|---|
| `01 · PR Quality Gates` | PR, manual | паралельні static/unit matrix/integration/E2E/perf/Docker + агрегуючий required job |
| `02 · Trusted Build and Publish` | push main, manual | перевірка → один Docker image → GHCR digest → ephemeral staging smoke **того самого digest** |
| `03 · Controlled Red / Green` | manual із scenario | показує контрольований fail конкретного реального чека |
| `04 · Interactive HTML Demo` | docs change on main, manual | GitHub Pages із `docs/` |
| `05 · Scheduled Deep Checks` | Mondays, manual | npm audit, coverage report (поки без threshold), performance smoke |

Після першого push:

1. Відкрий **Actions → Controlled Red / Green → Run workflow** і вибери `contract`.
   Зафіксуй червону job і повідомлення, яке поле контракту видалено.
2. Запусти ще раз із `happy`. Тепер job зелена.
3. Створи PR із реальним дефектом (не з demo-фікстурою), подивися
   паралельні jobs і фінальний `Required · PR Gate`.
4. Для блокування merge налаштуй **branch protection / ruleset**
   і зроби `Required · PR Gate` обов'язковим. Сам workflow
   без цієї настройки merge не блокує.
5. Увімкни GitHub Pages у Settings → Pages (Actions).

**Безпека:** недовірений PR не має прав publish/deploy; `packages: write`
є тільки в trusted `main` release job. Жодного AWS role або платного
інфраструктурного deployment за замовчуванням.
`CI_DEMO_SCENARIO` не впливає на звичайні CI jobs — тільки на
окремий навчальний запуск.

## Що означають і що НЕ означають зелені статуси

- Сканер `check:secrets` — прості патерни, не заміна Gitleaks.
- `check:contract` перевіряє backward compatibility невеликого JSON-контракту,
  не OAS/OpenAPI semantics чи Pact.
- `check:performance` — локальний HTTP smoke, не load/soak і не k6.
- `test:integration` працює з реальним HTTP-сервером, але **без PostgreSQL**.
- Docker `staging-smoke` — ефермерний контейнер на GitHub runner,
  **не deployment до справжнього staging-кластера**.
- Візуалізація всіх 32 гейтів — архітектурна мета, а не доказ виконання.

## Для coding-агента

Прочитай [AGENTS.md](AGENTS.md), потім
[IMPLEMENTATION_BRIEF.md](IMPLEMENTATION_BRIEF.md).
Працюй інкрементально; спочатку стабільні green/red прогонки, далі
Postgres/Pact/SAST/SBOM/attestation/kind/approval/rollback. Не підміняй
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
.github/workflows/              PR, GHCR, scenarios, Pages, nightly
IMPLEMENTATION_BRIEF.md         specification for agent implementation
CHECKS_MATRIX.md                current implementation vs planned 32 gates
~~~
