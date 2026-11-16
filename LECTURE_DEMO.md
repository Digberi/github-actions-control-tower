# Лекція 32 — Live Demo: CI/CD Control Tower

**Мета:** за 12–18 хвилин показати студентам справжні GitHub Actions,
ланцюг **код → перевірка → рішення → artifact → recovery**, не покладаючись
на те, що workflow встигне стартувати під час ефіру.

## Перед лекцією (2–3 хв)

1. Відкрий [інтерактивну карту pipeline](https://digberi.github.io/github-actions-control-tower/)
   на весь екран. Вона показує логіку та сценарії, **не є live telemetry**.
2. В іншій вкладці відкрий [Actions](https://github.com/Digberi/github-actions-control-tower/actions)
   та [evidence ledger](VERIFICATION.md).
3. Якщо є локальний клон: `npm ci && npm run demo:preflight`;
   без Docker/локального коду можна проводити всю демонстрацію тільки з браузера.
4. Запам'ятай послідовність: **GREEN PR → RED contract → RED security →
   GREEN release + attestation → kind rollback → висновок**.

### Додатковий 3-хвилинний блок: реальний cross-platform RED

Якщо студенти запитують, навіщо потрібна matrix, відкрий
[G07 GREEN — 4/4](https://github.com/Digberi/github-actions-control-tower/actions/runs/43953382799),
а потім [G07 RED](https://github.com/Digberi/github-actions-control-tower/actions/runs/43954175867).
Три jobs Ubuntu/macOS успішні, і **тільки реальний Windows runner** падає
через POSIX-only path separator. `fail-fast: false` дає іншим jobs завершитися;
артефакти завантажені навіть після failure. Локальна емуляція Windows
у CLI позначена окремо й не є заміною цього run.

Для style/type gate відкрий [G03/G04 GREEN](https://github.com/Digberi/github-actions-control-tower/actions/runs/43953383179),
потім [G03 RED (ESLint/Prettier)](https://github.com/Digberi/github-actions-control-tower/actions/runs/43954058276)
і [G04 RED (TS2322)](https://github.com/Digberi/github-actions-control-tower/actions/runs/43954113680).
Це справжні tool exits `1`, а `upload-artifact` працює на `always()`.
Важлива межа: G04 компілює вузьку TypeScript DTO fixture; backend лишається JS.

## Основний сценарій (12–18 хв)

| Час | Що демонструю | Що говорю | Де дивлюся |
|---|---|---|---|
| 00:00–02:00 | Ієрархія stage та паралельні gates | «Pipeline — граф залежностей. Незалежні перевірки йдуть паралельно; publish не запускається на untrusted PR» | [HTML topology](https://digberi.github.io/github-actions-control-tower/) |
| 02:00–04:00 | Справжній повністю зелений PR | «Node 22/24, PostgreSQL 16, HTTP E2E, coverage, CodeQL, k6, CycloneDX, Docker — окремі jobs, а не виведена у README галочка» | [PR green](https://github.com/Digberi/github-actions-control-tower/pull/3/checks) |
| 04:00–06:00 | G10 API backward compatibility | «Видалення orderId може не зламати тести producer, але ламає consumer. oasdiff перевіряє OpenAPI контракт; потрібен explicit nonzero exit» | [G10 RED](https://github.com/Digberi/github-actions-control-tower/actions/runs/43899543939) → [G10 GREEN](https://github.com/Digberi/github-actions-control-tower/actions/runs/43899598220), [workflow](https://github.com/Digberi/github-actions-control-tower/actions/workflows/openapi-diff.yml) |
| 06:00–08:00 | Реальна поправка з CI | «Hadolint двічі знайшов різні проблеми Dockerfile: shell HEALTHCHECK та USER. Після fix — GREEN. Не усі червоні прогони слід приховувати» | [перший lint RED](https://github.com/Digberi/github-actions-control-tower/actions/runs/43897556010) → [другий lint RED](https://github.com/Digberi/github-actions-control-tower/actions/runs/43898053537) → [GREEN](https://github.com/Digberi/github-actions-control-tower/actions/runs/43898394391) |
| 08:00–10:00 | G21 Trivy real CVE block | «Security gate має право провалити збірку. Scan з HIGH/CRITICAL вийшов exit 1, але report artifact усе одно збережений» | [Trivy RED + artifact](https://github.com/Digberi/github-actions-control-tower/actions/runs/43898137840) |
| 10:00–13:00 | Build once, immutable digest + attestation | «Trusted main пушить GHCR digest; Sigstore зв'язує artifact із workflow; незалежний gh attestation verify; повторної збірки для deploy немає» | [verified release](https://github.com/Digberi/github-actions-control-tower/actions/runs/43897091325) |
| 13:00–16:00 | Kind rollout, availability, rollback | «Дві репліки, readiness, bad rollout, 25 реальних HTTP probes, kubectl rollout undo, повернення попереднього digest» | [kind evidence](https://github.com/Digberi/github-actions-control-tower/actions/runs/43894401938) |
| 16:00–18:00 | Trust boundary та tradeoffs | «OIDC у цьому стенді перевіряється синтетично; немає AWS STS або production approval. Це показує принцип policy, але не доводить AWS інтеграцію» | [G27 RED](https://github.com/Digberi/github-actions-control-tower/actions/runs/43894863175) / [GREEN](https://github.com/Digberi/github-actions-control-tower/actions/runs/43894983037) |

## Якщо потрібно зламати щось наживо (опція 3–5 хв)

У [Actions → 03 · Controlled Red / Green](https://github.com/Digberi/github-actions-control-tower/actions/workflows/demo-scenarios.yml)
натисни **Run workflow**. На основі вже перевірених GitHub runs:

- `G27 / red` — синтетичний неправильний JWT subject, **справжній GitHub failed job**,
  machine-readable evidence у artifacts. Поруч `G27 / green` — виправлена policy.
- `contract / red` — потрібне поле `orderId` зникає, перевірка повертає exit 1.
- `G09 / red` — API E2E перевіряє, що неіснуючий order має HTTP 404,
  навмисна ін'єкція повертає 200 і руйнує assertion (після оновлення workflow).
- У [10 · Real OpenAPI Compatibility](https://github.com/Digberi/github-actions-control-tower/actions/workflows/openapi-diff.yml)
  ручний input `mode=red` запускає реальний oasdiff і падає на breaking ERR;
  `mode=green` завершується успішно. Пара прямих посилань вище.
- Для локального швидкого показу (не потрібна зміна Git branch):

~~~bash
npm ci
npm run demo:list
npm run demo:case -- --id G10 --mode red --target local --session lecture
npm run demo:case -- --id G10 --mode green --target local --session lecture
npm run demo:case -- --id G27 --mode red --target prepared
npm run demo:show -- --id G27
npm run demo:report
npm run demo:cleanup -- --scope lecture --dry-run
~~~

**ВАЖЛИВО:** `--target prepared` лише дає посилання на вже записаний workflow
і не виконує новий GitHub run. `--target github` / workflow_dispatch створюють
реальний run; не запускати під час короткого demo, якщо час критичний.

## Ключові висновки студентам

1. **Green job ≠ secure release**. GitHub reports показують факти; пороги,
   policy та права визначають їхню цінність. Реальний Trivy тут червоний.
2. **PR ≠ trusted main**: untrusted fork не отримує publish credentials,
   publish digest відбувається лише після main merge.
3. **Immutable image@sha256** є конкретним кандидатом для rollback. Tag може змінитися.
4. **SBOM ≠ attestation**: SBOM описує склад; attestation — provenance;
   обидва потрібні, але не замінюють CVE scanning.
5. **Gate повинен повертати правильний exit code**. Інакше він може
   надрукувати реальну помилку та все одно дати false-green.
6. **Retry та rollback** — частина release design, але production change
   потребує окремих Environments approval/ruleset та відповідального reviewer.

## Що тут не слід демонструвати як готовий production

- Немає налаштованого native GitHub production approval чи branch ruleset,
  відповідно `Required · PR Gate` не заявлений як фізичний merge blocker.
- AWS OIDC/STS не використовується. Claims перевіряються локальними
  підписаними синтетичними JWT.
- Kind — тимчасовий Kubernetes на GitHub runner, **не виробниче середовище**.
- Без реальних бізнес-витрат Pulumi budget — synthetic fixture;
  license та K8s policy наразі вузькі навчальні перевірки.
- Стенд підтримує 18 зареєстрованих пар RED/GREEN (G03/G04 після
  `quality:bootstrap`), а не 32/32 повних
  production-equivalent gates. [Матриця стану](CHECKS_MATRIX.md).
