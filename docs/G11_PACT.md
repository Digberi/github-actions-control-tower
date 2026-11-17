# G11 — справжній consumer-driven contract testing із Pact V4

Цей gate перевіряє **дві незалежні речі**:

1. Реальний клієнт `consumer/order-client.mjs` викликає Pact mock HTTP server. Pact записує interaction POST `/orders` у Pact Specification V4 JSON.
2. Pact **provider verifier** програє згенерований контракт через HTTP проти справжнього `src/app.mjs` — без імітації успішної відповіді чи hardcoded PASS.

Вимоги споживача: HTTP `201`, JSON, `status: created`, `totalCents: 1000` і поле `orderId` у UUID-подібному форматі. Контракт генерується з тесту клієнта; його не підмінює OpenAPI (G10).

## Локальне відтворення

```bash
npm ci --ignore-scripts
npm run test:pact:green   # exit 0: consumer mock + real provider match
npm run test:pact:red     # exit 1: реальний provider повертає JSON без orderId
```

`red` перемикає лише тимчасовий процес провайдера через `CI_DEMO_SCENARIO=consumer`; репозиторій не змінюється. У RED саме офіційний Pact verifier повідомляє `Actual map is missing the following keys: orderId`. При аварійному перериванні запуску перевірте локальні мережеві proxy налаштування: native verifier має діставатись `127.0.0.1` без HTTP proxy.

Результати:

- `reports/pacts/*.json` — згенерований Pact V4 контракт (producer і consumer names).
- `reports/g11-pact-green.json` — `consumerVerifiedAgainstMock: true`, `providerVerified: true`.
- `reports/g11-pact-red.json` — `consumerVerifiedAgainstMock: true`, `providerVerified: false`, опис конкретного mismatch.

PR workflow `.github/workflows/pr.yml` включає Pact у job `G11 · Pact V4 consumer + real provider verification`; цей job — dependency `Required · PR Gate`, тож RED блокує агрегувальний gate. JSON зберігається як GitHub Actions artifact `g11-pact-v4` (`if: always()`).

Обмеження: цей стенд демонструє локальний consumer/provider contract, **не** Pact Broker / can-i-deploy / версіонування розгорнутих середовищ. Для них потрібна окрема інфраструктура та CI credentials.
