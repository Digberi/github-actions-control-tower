# Agent instructions — CI/CD Control Tower

You are implementing the Node.js PRO Lecture 32 heavy CI/CD training stand.

1. Read **IMPLEMENTATION_BRIEF.md** in full before expanding the project.
2. Preserve the working Node.js API, existing fixtures, and runnable GitHub
   workflows while adding the missing gates. Make incremental changes.
3. Treat **docs/index.html** as a stable, standalone GitHub Pages artifact.
   It depicts the TARGET system. Do not silently change its topology;
   update explanatory status text as gates become real.
4. For each new gate, implement a genuine observable check:
   command, green fixture, red fixture, failure exit code, output,
   evidence, cleanup and lecturer instructions.
5. Update **CHECKS_MATRIX.md** after verified changes. Never label a
   simulated or unrun integration as VERIFIED.
6. Keep PR jobs unprivileged; no pull_request_target + untrusted checkout,
   secrets in logs, AWS writes, paid infrastructure, production deployments
   or access policy changes by default.
7. GitHub Actions marketplace uses should be pinned to full SHAs;
   update currently used versions to supported, verified releases.
8. Require explicit authorization before creating cloud resources or
   changing production settings.
9. Verify locally; then verify actual GitHub Actions runs when access
   exists, capturing exact run URLs and failure evidence.
10. Do not merge independent red demo scenarios into release pathways.

Priority: follow the phased Definition of Done in the brief,
not merely its file/folder tree.
