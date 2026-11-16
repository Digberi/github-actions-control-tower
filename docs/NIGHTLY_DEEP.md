# Deep CI checks — reproducible property fuzz, controlled mutation and HTTP soak

The primary PR path now includes `tests/property.test.mjs` as an actual
required job. It reproduces cents arithmetic with 3,000 seeded pseudo-random
baskets and compares every result to BigInt. A boundary invariant rejects
unsafe totals outside `Number.MAX_SAFE_INTEGER`.

- [True RED](https://github.com/Digberi/github-actions-control-tower/actions/runs/43967673291):
  the old domain code accepted overflowing totals; node:test threw a real
  `Missing expected exception (TypeError)`, exit 1, with TAP artifact.
- [True GREEN](https://github.com/Digberi/github-actions-control-tower/actions/runs/43967957021):
  the domain checks that line and cumulative totals remain safe integers.

## Scheduled deep workflow

`.github/workflows/nightly-deep.yml` runs every Monday at 03:17 UTC,
can be dispatched manually, and runs once on changes to its own code path.
[Verified full nightly GREEN](https://github.com/Digberi/github-actions-control-tower/actions/runs/43968370280): real 20-second soak processed 88,521 create/read cycles and 181,470 HTTP requests, p95 1.54ms, with zero failures; the single controlled arithmetic mutant was killed. JSON artifacts were uploaded.

Jobs are independent of prior PR conclusions:

1. Existing dependency audit, coverage information and local performance.
2. Genuine seeded property tests, plus a **single controlled mutant**
   (`CI_DEMO_SCENARIO=unit` changes the total by one cent). The mutation
   proof runs the real tests and requires assertion failures before it claims
   the mutant was killed, saving `reports/mutation-proof.json`.
3. Actual six-client concurrent HTTP soak: create orders, read them back,
   validate cents and readiness, measure p95, fail on mismatched responses
   or a failing threshold, save `reports/http-soak.json`.

A quick 3-second soak runs inside the PR `Performance` job, while the
nightly job performs the full 20-second scenario. This deliberately keeps
expensive load separate from the PR feedback budget.

## Reproduce locally or in a Codespace

```bash
npm ci --ignore-scripts
npm run test:property
npm run nightly:mutation
node scripts/soak.mjs 3
npm run nightly:soak
```

The mutation test is **not** full Stryker mutation testing. The soak is a
20-second concurrency/consistency exercise, **not** a production-scale load
test or authenticated OWASP ZAP DAST scan. Report real timings and avoid
presenting these narrower checks as comprehensive assessments.
