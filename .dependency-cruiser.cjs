/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "G15-no-circular-imports",
      severity: "error",
      comment: "Any JavaScript import cycle can produce partially initialized modules.",
      from: {},
      to: { circular: true }
    },
    {
      name: "G14-domain-must-not-depend-on-infrastructure",
      severity: "error",
      comment: "The pure domain may not import HTTP transport, runtime entrypoint, or PostgreSQL adapter.",
      from: { path: "^src/domain\\.mjs$" },
      to: { path: "^src/(app|server|postgres)\\.mjs$" }
    },
    {
      name: "G14-app-must-not-import-runtime-entrypoint",
      severity: "error",
      comment: "The HTTP application must not depend on process bootstrap.",
      from: { path: "^src/app\\.mjs$" },
      to: { path: "^src/server\\.mjs$" }
    },
    {
      name: "G14-no-unresolved-relative-imports",
      severity: "error",
      comment: "Unresolvable relative import edges are not allowed to silently disappear from the graph.",
      from: { path: "^src/" },
      to: { couldNotResolve: true }
    }
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    exclude: { path: "node_modules" }
  }
};
