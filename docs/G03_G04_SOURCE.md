# G03/G04 — code quality on the real Orders application

Попередні приклади перевіряли вузький модуль і окремі контрольні файли. Тепер **усі чотири production-модулі `src/*.mjs`** перевіряються тими самими справжніми інструментами, що ловлять RED-демонстрації:

- **G03** — ESLint 9 (`eqeqeq`, `curly`, `semi`, `no-extra-semi`) та Prettier 3; конфіг охоплює `src/**/*.mjs` і окремі `quality/style` fixtures.
- **G04** — TypeScript 5 `tsc --noEmit` у `strict` + `allowJs` + `checkJs` через `quality/types/tsconfig.src.json`. Програма лишається JavaScript ESM; JSDoc типізує Orders DTO, сховище, HTTP-відповіді та PostgreSQL виклики. Окремо залишається strict TypeScript DTO fixture.
- ESLint, Prettier, TypeScript, `@types/node` та `@types/pg` закріплено у `package-lock.json`, а не встановлюються непередбачувано щоразу в CI.
- G19 license policy явно дозволяє OSI-approved `Python-2.0`, яку має транзитивний dev dependency `argparse` від ESLint. GPL та невідомі ліцензії й надалі заборонені.

## Як запустити

```bash
npm ci --ignore-scripts
npm run check:style
npm run check:types
node scripts/quality-check.mjs G03 red  # exit 1: реальні ESLint/Prettier diagnostics
node scripts/quality-check.mjs G04 red  # exit 1: справжня TS2322 на DTO fixture
```

За PR обидва `check:style` і `check:types` тепер йдуть у job `Syntax · Source lint/types`, від якого залежить `Required · PR Gate`. Додаткові jobs workflow `13 · Real ESLint Prettier and TypeScript` створюють `quality-G03-*.json` / `quality-G04-*.json` artifacts навіть при помилці.

Контрольна RED-перевірка саме **production source**, а не fixture: на тимчасовому PR commit у `src/domain.mjs` було оголошено `/** @type {number} */ const lectureTypeViolation = "not-a-number"`. `tsc --strict --checkJs` повернув TS2322, впали G04 та Required. Помилковий рядок прибрано в наступному GREEN commit.

Межа: `src` — це production-код застосунку. Ці checks **ще не покривають усі `scripts/`, `tests/` та HTML** і не гарантують відсутність інших категорій дефектів. Для них є окремі функціональні, contract, security та workflow gates.
