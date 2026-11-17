# G14/G15 — real import dependency graph and architecture boundaries

Instead of merely matching source text with a regular expression, this gate invokes **dependency-cruiser 18** on the real ESM import graph of `src/*.mjs`. The rule set is committed as `.dependency-cruiser.cjs`:

- **G14** prevents business domain imports of the HTTP app, runtime entrypoint and PostgreSQL adapter; prevents the app from importing its process bootstrap; and rejects unresolved source imports.
- **G15** rejects circular dependencies, including cycles that span multiple modules.

An independent PR job `G14/G15 · dependency-cruiser boundaries and cycles` runs `npm ci` and `npm run check:depgraph`. Its status is an input of `Required · PR Gate`. JSON graph and machine-readable violations are uploaded even on failure, as `g14-g15-dependency-cruiser`.

## Local reproduction

```bash
npm ci --ignore-scripts
npm run check:depgraph       # GREEN: real src graph, no rule violations
npm run demo:depgraph:red    # RED exit 1: import cycle between real fixture modules
```

Files written:

- `reports/depcruise-green.json` / `reports/depcruise-red.json`: complete parsed import graph, dependency types and official policy findings.
- `reports/g14-g15-green.json` / `reports/g14-g15-red.json`: bounded summary, including the actual validating CLI exit code.

**Important scanner behavior:** dependency-cruiser's JSON reporter can emit an error verdict while returning exit `0`. The wrapper therefore also runs the official `err-long` reporter, verifies the matching `summary.advisedExitCode` and propagates the **actual validation exit**. Without this, a red architecture violation could silently become a green CI job.

The committed red fixture is isolated in `fixtures/depgraph/red/`, not imported by the application. A separate temporary PR commit introduces `src/domain.mjs` → `src/app.mjs`, which both violates the domain boundary (G14) and produces a real import cycle (G15). A subsequent GREEN commit removes that import; real GitHub runner results are listed in [VERIFICATION.md](../VERIFICATION.md).

Limits: this checks the production JavaScript module graph, not runtime reflection, undocumented side effects, or internal calls hidden behind external packages. The custom legacy `check:architecture` is retained for the original controller demo, while dependency-cruiser is an independent required gate.
