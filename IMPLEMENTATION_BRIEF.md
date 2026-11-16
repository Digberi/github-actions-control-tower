# IMPLEMENTATION BRIEF — CI/CD Control Tower

**Призначення:** самодостатнє технічне завдання для coding agent, який має побудувати production-подібний демонстраційний CI/CD стенд до лекції №32 Robot_Dreams Node.js PRO «CI/CD на GitHub Actions».

**Основна вимога:** реалізувати працюючий стенд, а не перелік технологій, які красиво виглядають у README. Стенд має демонструвати **причину → перевірку → точний exit status → рішення GitHub → evidence → recovery**.

> Агенте, нижче описано бажаний результат та критерії приймання. Ти відповідаєш за технічну реалізацію, відтворюваність, перевірку й документацію. Не оголошуй роботу завершеною, доки не пройдеш Definition of Done.

**Пріоритет строків:** лекція запланована на **16.11.2026 о 18:30 (Київ)**. Якщо реалізація починається незадовго до ефіру, спочатку забезпечити **MODE A + підготовлені готові GitHub runs MODE B**, а повне G01–G32/нічні прогони доробляти окремо. Не ризикувати готовим ефіром заради останніх необов'язкових гейтів.

## 0. Контекст і вхідні дані

Я — Senior/Lead Node.js/NestJS engineer і викладач Node.js PRO. У мене є підготовлений архів **L32-CICD-GitHub-Actions-prep.zip** з директорією L32-CICD-GitHub-Actions, 90-хвилинним runbook, 23 слайдами, дев'ятьма демо D1–D9 та навчальним кодом:

- 01-lecturer-prep/runbook-32.md — джерело порядку блоків і команд;
- 01-lecturer-prep/cheat-sheet-32.md — акценти й небезпечні формулювання;
- 01-lecturer-prep/lecture-32-source/lecture-plan-32.md та slides-outline-32.md;
- 03-student-code/code/32_CicdGithubActions/ — наявні Node.js app, workflows ci.yml / pr.yml / deploy.yml, fixtures, npm run step0 … step8;
- 06-lms/hw-32.md — контракт оцінювання й evidence;
- 07-context/course-notes/PREP-RULES.md — правила лектора.

**Перший крок — прочитати й інвентаризувати наявне, не створювати дублікати.** Якщо архів не надано агенту — попросити передати саме його; не вигадувати, що файли вже доступні. Якщо в поточному репозиторії є AGENTS.md і незакомічені зміни, дотримуватися інструкцій і зберегти чужу роботу.

Раніше підготовлено повний сценарій L32 приблизно на 11 тис. слів і тезовий конспект. Вони можуть бути додатковим контекстом, але **runbook і реальний код мають пріоритет над ораторським текстом**. У старому архіві частина GitHub прогонів не підтверджена, а локальні заміри зроблено на dev-ci 28.09.2026; не описувати їх як нові живі результати.

### Чого я хочу як викладач

1. За 30–60 секунд показати **карту всього конвеєра**: які job запускаються, що залежить від чого, де parallel fan-out і який gate може заблокувати merge/deploy.
2. Мати **готовий зелений прогін** і **готові червоні прогони** різних типів: syntax, typecheck, tests, contracts, migration, architecture, SAST/SCA, performance, supply chain, secrets, policy, cost, deploy, rollout.
3. Натиснути одну команду або обрати сценарій із меню — отримати контрольовану поломку та пояснення: очікуваний fail, фактичний fail, лог, артефакт, fix.
4. Показати **справжню GitHub Actions topology**, а не лише локальні shell-скрипти з намальованою галочкою.
5. Довести інваріант **build once → publish immutable digest → deploy staging → promote exact same digest → production approval → post-deploy verification**.
6. Показати OIDC, trust policy й реальний token exchange лише якщо є безпечний тестовий AWS account і відповідні дозволи. Без акаунта — чесна верифікація claims/policy офлайн і пояснення межі.
7. Після лекції студент зможе відтворити кожен сценарій за документацією, без доступу до моїх секретів і без платної хмари.

### Нефункціональні вимоги

- Node.js/TypeScript — основний стек; зберегти наявну програму з архіву, де це доцільно.
- GitHub Actions — canonical runner і source of truth для живих CI/CD workflow runs.
- Docker/BuildKit + GHCR — образи; kind — локальний Kubernetes для CI/deploy.
- Постійний AWS account, платіжна картка, GitHub PAT і Pulumi Cloud **не повинні бути потрібні для базового стенда**.
- Команди preflight і локальні демо мають працювати на macOS/Linux; передбачити Docker Desktop із пам'яттю близько 4 ГіБ та обмеженим CPU.
- Жодного глобального docker system prune, docker network prune, безконтрольного builder prune, видалення чужих volumes, роботи з production credentials.
- Для тестів із фіктивними секретами — тільки явно позначені **синтетичні значення**, які ніколи не були дійсними.
- Стенд не має вимагати одночасного підняття «всього світу». Ресурсомісткі services/сканери запускаються послідовно або в окремих jobs.
- Ідемпотентний setup, безпечний scoped cleanup, повторювані fixtures, зрозумілі коди завершення.

## 1. Продуктовий результат

Назва стенда: **CI/CD Control Tower**. Прикладна система — невеликий **Orders API**, не великий бізнес-продукт. Бізнес-логіка тут лише привід для перевірок.

Мінімальний runtime:

- API з GET /health/live, GET /health/ready, GET /orders/:id, POST /orders, GET /metrics, OpenAPI schema;
- PostgreSQL для прикладів міграцій, транзакцій, integration tests і readiness;
- невелика бізнес-операція createOrder із перевіркою унікальності/ідемпотентності, щоб тести були змістовними;
- Dockerfile multi-stage, non-root runtime, health checks;
- K8s manifests або Pulumi-програма для Deployment/Service/ConfigMap/Secret reference, readiness/liveness, resources, rolling update;
- структуровані логи й кореляційний request ID;
- staging і production-like environments в ізольованому навчальному контексті.

**Не переписувати все з нуля без причини.** Якщо наявний ESM Orders API з архіву достатній, розширити його до потрібних контрактів. NestJS допускається, але не повинен відволікати від CI/CD. RabbitMQ, MinIO, Redis не додавати тільки заради кількості іконок: якщо вони не потрібні для конкретного гейта — залишити optional. Helm також не є обов'язковим.

### Чотири середовища/рівні

| Рівень | Для чого | Що реально працює |
|---|---|---|
| **Local sandbox** | Швидко й без інтернету показати механіку гейта | Docker, Node CLI, fixtures, test runners |
| **GitHub PR CI** | Показати jobs, matrix, required checks, artifacts | Реальні GitHub Actions runs без привілейованих cloud secrets |
| **GitHub CD → kind** | Показати digest, stage, promotion, health, rollback | На runner або у виділеному стенді kind, обмежені тестові ресурси |
| **Optional cloud AWS** | Показати справжній OIDC → STS → IAM role | Тільки явно налаштований sandbox AWS, scoped role та окреме підтвердження користувача |

**Заборонено** підписувати локально емульований STS як «перевірена безпека AWS». Те, що LocalStack певної версії прийняв фальшивий JWT, демонструє обмеження емуляції, не властивість AWS.

## 2. Архітектура конвеєра

Використай **кілька workflow**, а не один гігантський YAML, з явними межами прав.

~~~mermaid
flowchart TD
  PR["Pull request"] --> VALID["Validate workflow + code"]
  VALID --> TEST["Unit / Matrix / Integration / Contract"]
  VALID --> SEC["SAST / SCA / Secrets / IaC"]
  TEST --> BUILD["Build candidate once"]
  SEC --> BUILD
  BUILD --> VERIFY["Image scan / SBOM / Attestation"]
  VERIFY --> GATES["Performance + Cost + Policy"]
  GATES --> MERGE["Required checks / Merge"]
  MERGE --> PUBLISH["Publish digest"]
  PUBLISH --> STAGE["Deploy staging + smoke"]
  STAGE --> APPROVAL["Production environment approval"]
  APPROVAL --> PROD["Promote same digest + post-check"]
  PROD --> RECOVERY["Observe / rollback if needed"]
~~~

Ця схема концептуальна: фізичний candidate build може бути після дешевих тестів, а publish — після merge. **Build один раз на release candidate**, але PR і main можуть збирати різні candidate artifacts через різні commit SHAs; не змішувати їхню ідентичність. Для production release повинен бути зафіксований **один саме той digest**, що пройшов staging.

### Обов'язкові workflows

1. **pr.yml — unprivileged validation.**
   - trigger: pull_request;
   - явне permissions: contents: read; інші права тільки якщо абсолютно необхідні;
   - жодного AWS/OIDC role assumption, довгоживучих секретів, privileged publishing з чужого PR;
   - validate, lint, types, unit matrix, integration, contract, architecture, security, dependency/license, IaC policy, cost preview, k6 smoke (де безпечно);
   - aggregate summary та artifacts навіть при fail;
   - у repo ruleset — чітко перелічені required checks.

2. **ci-release.yml — trusted merge/publish.**
   - trigger: push до захищеного main;
   - після перевірок побудувати один image; push у GHCR через GITHUB_TOKEN із packages: write у потрібній job;
   - зберегти digest у job output і evidence artifact;
   - генерувати SBOM та provenance/attestation, перевіряти перед promotion;
   - reproducibility metadata: commit SHA, workflow run ID, toolchain, digest, timestamp;
   - не використовувати mutable latest як deployment reference.

3. **deploy-reusable.yml — deployment без rebuild.**
   - trigger: workflow_call;
   - inputs: environment, image@sha256, release ID;
   - окремі jobs/правила для staging і production;
   - environment settings у GitHub, branch restriction, approval, concurrency;
   - deploy тільки переданий immutable digest; fail на tag-only image;
   - database migration strategy (expand/contract, окремий migration job з timeout і rollback plan);
   - readiness, smoke, API contract і synthetic traffic після deploy;
   - deploy record: image digest, git SHA, environment, run URL, migration version, health.

4. **nightly-deep.yml — дорогі перевірки.**
   - schedule + workflow_dispatch; планові запускання можуть затримуватись;
   - довші load/soak checks, mutation testing або fuzzing, DAST, extended CVE/SCA, license audit;
   - результати не видавати за synchronous PR gate, якщо вони асинхронні; окрема policy про те, що з ними робити.

5. **rollback.yml — контрольований відкат.**
   - workflow_dispatch з перевіреним попереднім digest, environment і причиною;
   - явна protection rule;
   - не збирати новий image для rollback;
   - після rollback зробити smoke + показати deployment record.

6. **demo-scenarios.yml — лише навчальні фікстури.**
   - workflow_dispatch із whitelist дозволених сценаріїв і без привілейованих секретів;
   - для кожного кейса є expected failed check та evidence;
   - не перетворювати цей workflow на механізм обходу required checks чи підміни production artifact.

### Два принципи workflow engineering

- **Dependency graph явний:** needs, if, job outputs, artifact transfer, concurrency. При падінні upstream downstream jobs мають явно ставати skipped; evidence collector має все одно зібрати факти.
- **Security boundary явний:** PR code = untrusted; deployment/publish = trusted. Особливо небезпечно поєднувати pull_request_target, checkout PR code і write token/secrets. Якщо такий патерн не потрібен — не використовувати.

## 3. Каталог обов'язкових гейтів і контрольованих відмов

Для кожного гейта реалізувати **green fixture**, **red fixture**, надійний exit code, конкретну команду, expected/actual output і пояснення failure mode. Інструмент може відрізнятись від наведеного, але функція гейта має бути справжньою.

| ID | Гейт | Бажаний інструмент | Контрольована поломка |
|---|---|---|---|
| G01 | Workflow syntax + semantics | actionlint | needs на неіснуючу job / невалідний context |
| G02 | YAML / shell / Dockerfile lint | yamllint, ShellCheck, Hadolint | синтаксис shell або небезпечна Dockerfile директива |
| G03 | Formatting/lint | ESLint, Prettier check | порушення стилю/правила |
| G04 | Typecheck | tsc --noEmit | типове порушення типу |
| G05 | Unit tests | node:test або Vitest/Jest | неправильний total або idempotency result |
| G06 | Coverage gate | coverage thresholds | знизити coverage нижче порога |
| G07 | Matrix compatibility | Node LTS/платформи | сценарій, який ламається в одній комбінації |
| G08 | Integration + DB | PostgreSQL service container | зламана транзакція / query |
| G09 | API E2E | HTTP tests проти запущеного API | неправильний status/body |
| G10 | API backward compatibility | oasdiff | видалене required response property |
| G11 | Consumer contract | Pact або реальний consumer smoke | known consumer очікує старе поле |
| G12 | Event/schema compatibility | schema checker, за потреби | несумісна зміна поля події |
| G13 | DB migrations | migration validator + test DB | destructive NOT NULL/drop без expand/contract |
| G14 | Architecture boundary | dependency-cruiser | domain → http заборонений import |
| G15 | Dependency cycles | dependency-cruiser | цикл між модулями |
| G16 | Secret scanning | gitleaks / trufflehog-equivalent | фіктивний canary token у fixture |
| G17 | SAST | CodeQL або Semgrep | навмисне небезпечний patterns у тестовому коді |
| G18 | SCA / vulnerabilities | npm audit + Trivy/OSV | snapshot із відомим finding / фіксований fixture |
| G19 | License policy | SBOM/license checker | заборонена license у контрольованому fixture |
| G20 | IaC/K8s policy | Trivy config/Checkov/Conftest OPA | privileged pod, latest image, missing limits |
| G21 | Image scan | Trivy із порогом | image/findings вище severity threshold |
| G22 | SBOM completeness | CycloneDX/Syft | вимкнути або пошкодити потрібний SBOM |
| G23 | Image provenance/attestation | GitHub attestations або Cosign | неправильний subject digest/identity |
| G24 | Immutable artifact promotion | workflow + digest verification | staging digest ≠ production digest |
| G25 | Performance smoke | k6 + threshold + summary | pool bottleneck → p95/failure rate |
| G26 | Cost budget | Pulumi preview JSON + cost mapper | Δcost > budget |
| G27 | OIDC claim policy | offline JWT verifier + policy tests | чужий sub, неправильні aud/iss/exp |
| G28 | Environment approval | GitHub Environments | pending approval / rejected deploy |
| G29 | Post-deploy health/smoke | readiness + HTTP check | неправильний endpoint або failed readiness |
| G30 | Rollout/availability | kind + synthetic requests | failed requests during rolling update |
| G31 | Rollback & recovery | reusable deployment + previous digest | завідомо зламана нова версія → відкат |
| G32 | Aggregate required checks | repo ruleset + status jobs | PR не можна merge при red required check |

**G12 може бути optional**, якщо у прикладній системі немає справжнього event contract. Не створюй фальшивий Kafka або RabbitMQ лише для галочки. В інших випадках кожен гейт повинен мати осмислену перевірку. Якщо інструмент або фіча недоступні на поточному GitHub plan, познач як BLOCKED/OPTIONAL і покажи чесний fallback, не симулюй GitHub approval як нативний механізм.

### Ієрархія швидкості

- **P0 / Fast PR (ціль 2–4 хв):** actionlint, lint, types, unit, basic security, contracts, arch, cheap IaC policy.
- **P1 / Full PR (ціль 5–12 хв на доступному runner):** integration DB, API E2E, matrix, candidate build, image scans/SBOM, k6 short, cost preview.
- **P2 / Release (час залежить від kind/image):** push digest, deploy staging, migrations, smoke, approval, prod promotion, rollback test.
- **P3 / Nightly/weekly:** soak load, DAST, mutation, fuzzing, chaos, extended supply-chain auditing.

Це **цільові бюджети, а не гарантовані часи**. Зроби фактичні виміри й покажи критичний шлях. Червоні кейси в ідеалі мають завершуватися швидко, без двадцятихвилинного очікування.

### P4 — optional extension registry: що ще може бути в реальному pipeline

Список **не є обов'язковим для першої версії**; після G01–G32 познач кожен пункт як USEFUL/NOT_RELEVANT/FUTURE із поясненням:

- commit message conventions, changelog і semantic versioning;
- DCO / commit signature validation, CODEOWNERS і review policies;
- API docs build та link checking;
- spellcheck, dependency graph drift, package lock integrity;
- test flakiness analytics, quarantine policy, test sharding;
- mutation testing, property-based testing, fuzzing;
- dynamic security testing (DAST) та authenticated security smoke;
- Terraform/Pulumi drift detection, policy packs, preview diff comments;
- container structure tests і image size budgets;
- accessibility/visual regression — лише якщо є frontend;
- benchmark comparison зі статистично значущим baseline;
- SLO/error-budget gate, canary analysis, автоматизований rollback за метриками;
- blue-green/rolling/canary порівняння з реальним traffic routing;
- release notes, GitHub Releases, deployment notifications і incident hooks;
- dependency updates: Dependabot/Renovate PR validation;
- multi-arch image build та перевірка manifests для amd64/arm64;
- artifact retention, attestation verification у deployment admission policy;
- chaos tests (контрольоване падіння pod/DB connection), disaster recovery drill;
- DORA metrics / lead time / change failure rate як **аналітика**, не gate самі по собі.

Не робити з усіх цих речей синхронні required checks: це знищить feedback time. Для кожного механізму потрібно спершу визначити **який ризик**, **який сигнал**, **яка ціна**, **яке місце в життєвому циклі**.

## 4. Demo engine: керування сценаріями однією командою

Потрібен **demo controller**, з яким викладач не буде вручну перемикати тридцять гілок, шукати потрібний fixture або редагувати YAML у прямому ефірі.

Бажаний UX (можна CLI через Node.js; web UI не обов'язковий):

~~~bash
npm run demo:preflight
npm run demo:list
npm run demo:prepare
npm run demo:case -- --id G10 --mode red --target local
npm run demo:case -- --id G10 --mode green --target local
npm run demo:case -- --id G25 --mode red --target prepared
npm run demo:show -- --id G27
npm run demo:report
npm run demo:cleanup -- --scope SESSION_ID --dry-run
~~~

Конкретні назви команд можна уточнити, але набір дій має бути еквівалентним. **Кожен сценарій — fixture + виконання + assertion + evidence.**

### Файл сценарію

Визнач структурований опис кожного кейса, наприклад:

~~~yaml
id: G10
title: "OpenAPI backward compatibility"
purpose: "Зламана зміна API повинна заблокувати PR"
level: "fast"
tool: "oasdiff"
target: "local-and-github"
fixtures:
  green: "fixtures/api/compatible.yaml"
  red: "fixtures/api/breaking.yaml"
expected:
  green_exit: 0
  red_exit: 1
evidence:
  - "exit-code"
  - "breaking-rule-id"
  - "workflow-run-link"
teaching:
  before: "Зараз видалимо поле, яке вже використовує клієнт"
  look_here: "response-required-property-removed"
  why: "Контракт перевіряється незалежно від unit tests"
  limitation: "Спека може не відповідати реалізації"
  question: "Чи замінює oasdiff Pact?"
~~~

Не покладатися на точний текст логів із версії інструмента, якщо він змінюється. Assertion повинен перевіряти **стабільний інваріант**: exit status, machine-readable field, кількість failed requests або digest equality. Текст error message — допоміжний.

### Правила керування fixtures

- Не перезаписувати робочий репозиторій лектору. Редагування для червоних сценаріїв — у **тимчасовому Git worktree або ізольованій директорії**, створеній самим demo controller.
- Ізоляція за session ID: окремі файли, порти, namespace, Docker labels, збережені логи.
- Прибирання тільки ресурсів із явно відомим owner/session label, перед видаленням показати список. Ні git reset --hard, ні глобальний prune.
- Повторний запуск того самого кейса не має псувати наступний; green після red повинен бути справді зеленим.
- Підготовка GitHub PR/run — лише у спеціально створеному навчальному репозиторії. Якщо потрібні зовнішні push/PR/середовища, агент спочатку показує план і просить власника дозволити ці дії. Локальна реалізація не дає автоматичної згоди на публікацію чи зміну settings.
- Кожен сценарій має режим **local**, **GitHub live** (коли підтримується) або **prepared evidence**. Позначати різницю в інтерфейсі та runbook.

## 5. Сценарії, які я хочу показувати на лекції

Реалізуй не лише окремі гейти, а й цілі історії. Кожна історія має мати **зав'язку, прогноз, контрольований failure, root cause, fix і висновок**.

### S01 — «Pipeline не проходить ще до GitHub»

- У YAML три навмисні дефекти: відсутня job у needs, неіснуючий runs-on label, помилка в expression context.
- YAML parser проходить, actionlint падає.
- Виправляємо всі три → actionlint exit 0.
- **Теза:** валідний YAML ≠ валідний GitHub workflow; перевіряйте сам CI-код до push.

### S02 — «Зелений unit test, але зламано API»

- Нове поле/DTO узгоджене з unit tests.
- Один known consumer або OpenAPI compatibility checker помічає breaking change.
- Показати різницю Pact (очікування відомого consumer) і schema diff (зміна описаної API поверхні).
- **Теза:** зелений unit не доводить compatibility.

### S03 — «Архітектура — це правило, а не README»

- Domain module починає імпортувати HTTP/transport layer.
- Code компілюється й unit tests проходять, але dependency-cruiser блокує.
- Виправлення — dependency inversion / interface boundary.
- **Теза:** автоматичний architectural guard охороняє домовленість команди.

### S04 — «Матриця, кеш і критичний шлях»

- Один YAML job генерує 3 комбінації Node/OS (за сумісними актуальними версіями).
- Перша і друга запуски показують cache miss/hit, без фантазій про “в 10 разів швидше”.
- fail-fast: true проти false, max-parallel, cancellation/concurrency.
- **Теза:** matrix ≠ guaranteed parallel execution; cache ≠ artifact.

### S05 — «Один коміт, два образи»

- Локальна демонстрація з двома builds, порівняння image IDs. Пояснити, що outcome може збігтися.
- Окремо **реально запушений образ**: зафіксувати registry digest.
- Stage і prod використовують образ@sha256, а не тег.
- Намірено підставити інший digest на prod → gate повинен відмовити.
- **Теза:** Git SHA — traceability, registry digest — artifact identity. Локальний image ID не дорівнює registry manifest digest.

### S06 — «Звіт про вразливості нічого не блокує»

- Scanner знаходить вразливість, але job залишається зеленою при неправильно заданому exit policy.
- Додаємо severity threshold і ненульовий exit.
- Показати SAST vs SCA vs container scan vs IaC scan і вказати, що вони не взаємозамінні.
- **Теза:** виявлення ≠ enforcement; зберігай машинний verdict, а не regex по логах.

### S07 — «Performance regression на порядок»

- Green профіль із контрольованим пулом/затримками.
- Red профіль із вузьким connection pool або навмисною затримкою.
- k6 + threshold, summary.json, report.html, upload-artifact if: always().
- Чітко показати p95 і failure rate, повідомити вплив шуму shared runner.
- **Теза:** threshold має відповідати стабільності середовища, а report потрібний саме на failed run.

### S08 — «Schema migration ламає попередню версію»

- Є версія API v1 і v2, rolling update, окрема міграція.
- Поганий варіант: одразу DROP/rename колонку → стара версія не працює.
- Добрий варіант: expand → deploy compatible writers/readers → migrate/backfill → contract.
- Показати, чому rollback application image не відкотить автоматично DB schema.
- **Теза:** zero-downtime deployment залежить не тільки від Kubernetes readiness.

### S09 — «OIDC: справжній token, чужий subject»

- Offline verifier перевіряє алгоритм/підпис, ключ із JWKS, iss, aud, exp і whitelist subject.
- Позитивний тест із валідним контрольованим JWT та відповідною policy.
- Негативні тести: підпис неправильний; токен прострочений; інша audience; чужий subject; широка умова policy.
- На GitHub показати **claims**, але не повний токен. Для реального AWS STS — тільки optional sandbox role.
- Врахувати новий GitHub immutable sub для repo, створених після 15.07.2026; якщо job посилається на environment:prod, subject відображає environment, а не автоматично refs/heads/main. GitHub environment branch protection налаштовувати окремо.
- **Теза:** id-token: write дає право попросити токен, AWS role trust і permission policies незалежно вирішують доступ.

### S10 — «CI logs — шосте місце витоку»

- Лише синтетичний невикористовний секрет.
- Показати звичайне masking до ***, потім пояснити межі без демонстрації ексфільтрації.
- Secret scanning забороняє потрапляння synthetic token fixture у власне application code (для навчального тесту використовувати окреме невинне pattern).
- Розділити: cloud/deploy credentials на час job, app secrets — на runtime, ніколи в image.
- **Теза:** masking не є security boundary, а OIDC не робить privileged job невразливою.

### S11 — «Дорога зміна інфраструктури»

- Один Pulumi preview показує зміну ресурсів.
- Cost mapper оцінює **дельту** від базового плану.
- Перевищення абсолютного/відносного порога повертає exit 1.
- Required status check блокує merge (якщо правила репозиторію дійсно налаштовані).
- cost-approved bypass дозволений лише з перевіркою authority reviewer-а; label сам по собі не є дозволом.
- Не вважати exit 0 старого wrapper run.sh доказом: у вихідному архіві він ковтав помилки.
- **Теза:** вартість — це policy predicate; approval має мати власника й audit trail.

### S12 — «Гарний деплой падає після green CI»

- Staging отримує digest, міграція завершується, smoke проходить.
- Prod job стоїть на real GitHub Environment approval, якщо фіча доступна на плані репозиторію.
- Після approval deploy той самий digest; окремі health/availability checks.
- Намірено поганий readiness check або недоступна DB → post-deploy gate червоний.
- Rollback до попереднього digest, smoke, порівняння deployment record до/після.
- **Теза:** green build ≠ successful rollout; rollback = окрема перевірювана операція.

### S13 — «Supply chain: а що саме ми довіряємо?»

- Показати image digest, SBOM, attestation/provenance та їхню перевірку.
- Підмінити або змінити digest → verification відмовляє.
- Показати відмінність: digest доказує цілісність об'єкта; provenance/attestation заявляє про походження/збірку, а **довіра** вимагає перевірки issuer/identity/policy.
- Pin external actions за перевіреним full commit SHA, з коментарем про release.
- **Теза:** artifact identity ≠ builder identity ≠ authorization на deployment.

### S14 — «Не все повинно бути blocking»

- Показати fast PR gate, advisory finding, scheduled deep check.
- Приклад flaky test: one retry не перетворює нестабільний тест на “healthy”; фіксувати initial failure і retry outcome.
- Нічний DAST/soak/fuzz не має непомітно змінювати результат уже завершеного PR: визначити окрему policy triage/block release.
- **Теза:** швидкий feedback і глибока перевірка — різні потреби; trade-off precision/cost/duration.

## 6. Dashboard і докази

Хочу, щоб на екрані було **видно всю систему**, а не лише terminal scrollback.

Мінімальна версія — Markdown/HTML report, який генератор створює після preflight та запуску кейсів. Можна один статичний index.html без окремого backend. Не витрачати дні на красиву адмінпанель, доки не готові реальні гейти.

Обов'язкові елементи:

1. **Pipeline overview:** граф jobs і переходів, де видно paralellism/needs.
2. **Gate matrix:** ID, назва, green/red result, тип перевірки, тривалість, пріоритет.
3. **Run evidence:** Git SHA, image digest, workflow run URL, command, exit code, timestamp, runner/context.
4. **Security panel:** які credentials **можуть існувати** на кожному етапі; які job мають id-token: write; жодних secret values.
5. **Release timeline:** staging → approval → prod → smoke → rollback, із **одним digest**.
6. **Failure explorer:** обираємо G10, бачимо “що зламали”, що впало, як виправили, обмеження доказу.
7. **Source labeling:** LOCAL, GITHUB_REAL, PREPARED_REAL, SIMULATED. Не змішувати рівні доказовості.

Приклад індексу evidence для одного кейса:

~~~json
{
  "caseId": "G10",
  "scenario": "api-breaking-change",
  "mode": "red",
  "source": "GITHUB_REAL",
  "expectedExit": 1,
  "actualExit": 1,
  "passedAsDemonstration": true,
  "commitSha": "EXAMPLE_SHA",
  "workflowRunUrl": "EXAMPLE_URL",
  "artifacts": ["oasdiff-result.json"],
  "timestamp": "ISO_8601_UTC",
  "notes": ["Поведінка API тут не перевіряється лише зі спеки"]
}
~~~

**Важливо:** для червоного сценарію очікуваний exit 1 є **успіхом демонстраційного тесту**, хоча GitHub job має бути RED. Не плутати test harness success із gate success. Dashboard показує обидва статуси окремо.

Evidence artifacts генерувати й завантажувати навіть якщо gate впав, але контролювати відсутність файлів. Не публікувати JWT, токени, database credentials, повні environment dumps, приватні імена з робочих акаунтів, токени в trace. Для GitHub artifacts давати інструкцію, як знайти їх у конкретному workflow run.

## 7. Підготовка до ефіру: три готові режими

### MODE A — LIVE FAST (ціль 5–10 хв демонстрацій)

- actionlint red/green;
- oasdiff red/green;
- dependency-cruiser red/green;
- cost-check exit 1/0;
- OIDC trust policy JSON і офлайн негативний subject test;
- deployment digest equality check.

Усе працює локально. Після кожної команди на екрані **один-два інваріанти**, а не сотні рядків.

### MODE B — GITHUB SHOWCASE (підготовлений до лекції)

- Заздалегідь прогнані real PR checks із усією матрицею.
- Один успішний release run із registry digest.
- Один червоний contract run, один performance failure, один security policy failure.
- Один prod deployment у стані waiting approval (якщо план підтримує), один завершений prod deploy.
- Один rollback зі збереженим evidence.
- Не запускати новий git push під час кульмінації: черга runner-ів неконтрольована.
- Run links і справжні дати підставити у приватний lecturer runbook. Якщо run expired або відсутній — fallback локальний із чесним маркуванням.

### MODE C — FULL HEAVY (для розбору після лекції)

- Повний набір G01–G32, включно з довшими security/load/deploy кейсами.
- Статистика тривалості, critical path, cache hits, runner minutes.
- Не намагатися реально запустити всі 32 кейси в один 90-хвилинний ефір.

### Рекомендований порядок у межах лекції №32

| Фрагмент | Показ | Час із runbook |
|---|---|---|
| B1 | Workflow DAG, actionlint | 18:37–18:45 |
| B2 | Два builds, registry digest, stage/prod identity | 18:45–18:54 |
| B3 | Matrix/cache — готовий GitHub run | 18:54–19:00 |
| B4 | oasdiff + dependency-cruiser в обидва боки | 19:00–19:07 |
| B5 | k6 summary + artifact, без нового 40-секундного навантаження | 19:07–19:13 |
| B7 | Environment approvals, reusable workflow | 19:21–19:29 |
| B8 | JWT discovery/claims + trust policy + LocalStack limitation | 19:29–19:43 |
| B9 | masking і secret separation | 19:43–19:50 |
| B10 | Pulumi preview і required cost check | 19:50–19:55 |

**Не скорочувати** B2, B8, B9 і фінал ДЗ. Якщо відстаємо — згорнути matrix, частину quality/performance і alternatives. Заздалегідь підготовлені результати не називати “live”.

## 8. Точні security та production правила

1. Усі сторонні GitHub Actions pin-ити на **повний перевірений commit SHA**; у коментарі — назва релізу. Не вигадувати SHA та не копіювати застарілі приклади без перевірки.
2. Мінімальний GITHUB_TOKEN permissions на workflow/job. packages: write лише там, де дійсно публікується image; id-token: write лише у trusted jobs, які потребують федерації.
3. Untrusted pull requests не отримують AWS session, production environments, секрети, write token. Не використовувати небезпечний checkout untrusted PR code у privileged pull_request_target.
4. GitHub Environment — окремий об'єкт із правилами; branch/ruleset не замінює environment protection. Перевірити реальну доступність required reviewers на конкретному GitHub plan й visibility репозиторію. Якщо недоступно — позначити як limitation і запропонувати альтернативний ручний release workflow, чітко назвавши його **нееквівалентним** native reviewer gate.
5. OIDC issuer/audience/subject перевіряти явно, не робити wildcard по всій організації; для role з environment:prod окремо обмежувати дозволені branches/tags. Зіставляти trust policy з фактичним форматом нового immutable subject.
6. IAM role: дозволяти лише конкретні sandbox ресурси, коротку session і мінімальні permission policies. Привілейований доступ до робочих AWS акаунтів не використовувати.
7. Secret scanning демонструвати тільки на harmless fixtures. Будь-яке випадкове справжнє значення — негайний stop condition, нічого не показувати на екрані і не публікувати.
8. Ніколи не включати production secrets у build args/ENV/image layers, artifact reports, container logs, annotations чи git history.
9. Workflows і fixtures **не** повинні створювати платні cloud resources за замовчуванням. Для optional AWS режиму показати план ресурсів/витрат і запросити окреме підтвердження перед cloud writes.
10. Перевірки порівнювати з їхніми гарантіями: green security scanner не означає “вразливостей немає”; green IaC preview не означає “deployment безпечний”; local image ID не є registry digest; зелені tests не означають здоровий rollout.
11. Для GitHub artifact attestations використовувати офіційний механізм лише після перевірки його доступності, permissions і вимог репозиторію. Не заміняти attestation просто JSON-файлом, який власний workflow сам собі підписав невідомо чим.
12. Кожен deployment record має явно фіксувати, чи відбувся actual push/pull образу, чи це лише локальна перевірка. Жодного placeholder “success” у готових evidence.

## 9. Рекомендована структура результату

За можливості організуй окремий ізольований пакет/каталог **lecture-32-cicd-control-tower/**, не ламай існуючі студентські матеріали.

~~~text
lecture-32-cicd-control-tower/
  README.md
  package.json
  app/
    src/
    tests/unit/
    tests/integration/
    tests/e2e/
    openapi/
    Dockerfile
  infra/
    pulumi/
    kubernetes/
    policies/
  .github/
    workflows/
      pr.yml
      ci-release.yml
      deploy-reusable.yml
      nightly-deep.yml
      rollback.yml
      demo-scenarios.yml
  tests/
    contract/
    performance/
    security/
    architecture/
    migrations/
  fixtures/
    scenarios/
    api/
    architecture/
    security/
    infrastructure/
  demo/
    cases/
    controller/
    preflight/
    reports/
  docs/
    architecture.md
    pipeline-dag.md
    checks-matrix.md
    setup-local.md
    setup-github.md
    setup-aws-optional.md
    security-model.md
    lecture-runbook.md
    failure-catalog.md
    limitations.md
    measured-timings.md
    troubleshooting.md
  evidence/
    .gitignore
    README.md
~~~

Не сприймай імена директорій як догму. Можна залишити нинішні stage scripts з архіву і інтегрувати їх у новий пакет. Головне — зрозуміла навігація та прямий шлях від кейса до коду, команди, лога і висновку.

### Документація, яку я хочу отримати

- **README**: що це, які передумови, 5-хвилинний quick start, як отримати Green і Red, як показувати курсантам.
- **Pipeline DAG**: логічні dependency, trust boundaries, expensive jobs, source of truth для artifact.
- **Checks Matrix**: усі ID G01–G32, інструмент, target, demo, expected failures, статус READY/PARTIAL/BLOCKED, фактичні evidence.
- **Setup Local**: від чистого ноутбука до локальних кейсів; окремий Mac ARM compatibility checklist.
- **Setup GitHub**: новий demo repository, GHCR, branch rulesets, environments, permissions, як безпечно створити/використати потрібний token чи GitHub CLI auth, якщо він вже налаштований.
- **Setup AWS Optional**: minimum trust policy, role permissions і перевірка STS; нічого не створювати в AWS без явної згоди.
- **Lecture Runbook**: буквальна послідовність команд/вкладок, що сказати перед демо, де дивитися, 1–3 рядки ключового output, типові відмови й fallback.
- **Failure Catalog**: що саме зламали, який status очікується, чому це має блокувати, як відновити.
- **Limitations**: де LocalStack не відповідає AWS, де plan/features недоступні, що залежить від live мережі та сторонніх scanners.
- **Measured Timings**: реальні заміри на фактичному ноутбуці/GitHub runner із датою і середовищем, не старі числа з архіву.

## 10. Порядок роботи агента

### Етап 0. Discovery і звірка вихідного матеріалу

1. Визнач поточний репозиторій, branch, git status, AGENTS.md.
2. Переглянь архів, runbook, всі три workflows, README student code, fixtures, stages 00–08 та ДЗ.
3. Заповни таблицю: **already works / works locally only / planned / broken / unknown**.
4. Знайди розбіжності між показом і реальним кодом: неправдиві назви tools, неіснуючі GitHub runs, фіктивні SHA, некоректний security claim, завищені guarantees.
5. Дай короткий план змін і визнач, що буде additive, а що потребує рефакторингу. Не змінюй чужі файли без потреби.

### Етап 1. Вертикальний робочий зріз

Раніше за всі advanced checks зроби **один наскрізний happy path**:

~~~text
PR
 → actionlint / lint / tests
 → build candidate
 → publish GHCR digest on trusted ref
 → deploy to kind staging
 → smoke/health
 → approve production-like deployment
 → promote same digest
 → post-deploy smoke
 → evidence artifact
~~~

Покажи logs і один evidence file, де два environment мають однаковий digest. Не переходь до додавання двадцяти сканерів, доки цей шлях не працює.

### Етап 2. Ядро лекції

Доведи до READY сценарії S01, S02, S03, S04, S05, S07, S09, S10, S11, S12. Саме вони дозволять провести основний ефір. Для кожного потрібні green/red evidence і fallback.

### Етап 3. Heavy security, supply chain, recovery

Додай G16–G23, S06/S08/S13/S14, nightly та rollback. Не інтегруй нестабільний або дорогий сторонній scanner як обов'язковий blocking gate без контрольованого fixture, версії і перевірки false-positive поведінки.

### Етап 4. Lecturer usability і репетиція

Побудуй demo controller, preflight, статичну карту конвеєра, сценарій перемикань і готові вкладки GitHub. Прожени коротку репетицію: викладач не має шукати вручну filenames і пояснювати п'ять хвилин, чому не стартує контейнер.

### Етап 5. Фінальна верифікація і передача

Запусти повний локальний test suite, actionlint, усі доступні green/red fixture pairs, end-to-end release flow, перевір доказів, а за дозволу — реальні GitHub runs. Залиш звіт із чітким станом кожного гейта.

## 11. Definition of Done — як я прийму стенд

**Не достатньо:** README, список GitHub Actions, YAML без прогонів, скриншоти без джерела, fabricated timestamps, демонстрація лише зеленого pipeline.

**Мінімум для READY:**

1. Є працездатний backend, Docker image, API health і базові тести.
2. Локальний preflight показує versions, missing dependencies, Docker memory/ports, GH auth state без друку sensitive значень.
3. Усі workflows проходять actionlint; jobs мають явні permissions.
4. Доступний швидкий зелений локальний прогін і щонайменше **10 детермінованих red/green пар** із ядра лекції.
5. Для всіх заявлених G01–G32 є статус READY/PARTIAL/BLOCKED з причиною; **не називати 32/32**, якщо є пропуски.
6. Працює дійсний immutable build/publish/promote chain; записані **registry digest** staging/prod; їхня тотожність перевіряється автоматично.
7. Pipeline artifacts та test reports існують і відкриваються; на червоних прогонах evidence не зникає.
8. Довгоживучих cloud credentials у repo settings немає. PR workflow без привілейованих secrets.
9. Для OIDC негативні тести відхиляють неправильні issuer/aud/sub/exp/signature; AWS cloud test чесно позначений optional.
10. Required checks і prod approvals реально активовані там, де GitHub plan і права це дозволяють; інакше статус BLOCKED, а не “симульовано та готово”.
11. Вартість інфраструктури, performance та security scan мають справжню policy з exit 0/ненульовим і контрольованим fixture.
12. Деплой закінчується smoke/health, а rollback працює без rebuild.
13. Demo controller після red запускає green, не пошкодивши репозиторій, інші containers чи користувацькі Docker volumes.
14. Є один видимий зведений dashboard/summary і посилання на справжні GitHub Actions runs, коли вони існують.
15. Є перевірений lecturer runbook із хронометражем, короткими репліками, точними командами і fallback.

**Бажаний рівень FULL:** усі технічно застосовні гейти з G01–G32 реалізовані або явно обґрунтовано виключені; extended nightly tests і supply-chain attestations дають машинно перевірювані результати; failure injection cover matrix зеленого/червоного; evidence не містить секретів.

### Формат фінального звіту агента

~~~text
Implementation summary:
  repo / branch / commit:
  what was reused:
  what was added:

Quality gates:
  READY: N
  PARTIAL: N
  BLOCKED: N
  each check -> evidence:

Verification:
  local green run:
  local negative fixtures:
  GitHub PR run URL:
  GitHub release run URL:
  staging digest:
  production digest:
  deployment smoke result:
  rollback result:

Security:
  long-lived cloud secrets in repo: 0
  OIDC trust policy checked:
  untrusted PR isolation checked:
  permissions audit:

Lecture readiness:
  one-command preflight:
  recommended demo order:
  actual timings:
  fallbacks:
  open blockers:

How to run:
  setup:
  green:
  selected red:
  report:
  cleanup:
~~~

## 12. Важливі обмеження, щоб не зіпсувати ефір

- Якщо за часом не встигаєш зробити всі 32 гейти, **спочатку реалізуй робочий вертикальний шлях і 10 найважливіших red/green пар**, не витрачай час на декоративний dashboard.
- Якщо немає можливості зробити реальні approval/release runs, чесно віддай локальний режим, готовий YAML і чіткий blocker з кроками для власника. **Не фабрикуй GitHub лог і не малюй фальшиві “успішні” скриншоти.**
- Якщо поточний Docker host маленький, обирай послідовне виконання й підготовлені прогони. Не видаляй чужі образи, volumes або caches.
- Якщо для AWS потрібні створення IAM provider/role, keys чи інша зміна cloud state — зупинися та запитай дозвіл, покажи exact resource scope і очікувані витрати. Offline mode зобов'язаний працювати без цього.
- Якщо failure fixture потенційно секретний, небезпечний або зачіпає external systems, заміни його harmless локальним аналогом із таким самим **перевірюваним** security принципом.
- Якщо застаріли GitHub action major версії, OIDC claim shape, API параметри або доступність protection rules, використовуй **поточну офіційну документацію**, зафіксуй, що саме перевірено.

## 13. Офіційні орієнтири, які слід переперевірити перед реалізацією

- [GitHub Actions workflow syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)
- [GitHub security hardening](https://docs.github.com/en/actions/reference/security/secure-use)
- [GitHub OpenID Connect reference](https://docs.github.com/en/actions/reference/security/oidc)
- [GitHub OIDC → AWS](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws)
- [GitHub environments and deployments](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments)
- [GitHub artifact attestations](https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations)
- [GitHub caching vs workflow artifacts](https://docs.github.com/en/actions/concepts/workflows-and-actions/workflow-artifacts)
- [Docker registry image inspection](https://docs.docker.com/reference/cli/docker/buildx/imagetools/inspect/)

---

## START NOW — інструкція агенту

**Почни з аудиту наданого архіву та поточного репозиторію.** Випиши реальний inventory, зроби коротку implementation plan, потім **без зайвих теоретичних запитань** реалізуй vertical slice, demo controller, кейси S01–S14 і перевір їх. До кожного підходу став питання: “Яку гарантію це реально перевіряє? Що може піти не так? Який доказ я покажу на екрані?”.

Не заявляй, що «все готово», якщо перевірив тільки синтаксис. Мені потрібен **живий, керований, чесний і відтворюваний heavy CI/CD стенд**, який витримає запитання сильного Senior/Lead студента.
