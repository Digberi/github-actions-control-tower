# G16 — two real secret scans: checkout and Git history

The required PR security workflow now runs checksum-verified Gitleaks 8.30.1
twice in normal (`green`) mode:

- `gitleaks dir .` scans the checked-out working tree. Output:
  `reports/g16-green.json` plus `g16-verdict-green.json`.
- `gitleaks git . --log-opts="--all"` scans **reachable Git commit history**
  after `checkout` with `fetch-depth: 0`. Output:
  `reports/g16-history.json` plus `g16-verdict-green-history.json`.

Both actual commands require exit 0 for the job to be green, and each report
uses `--redact=100`. A previously committed credential that was later
deleted from HEAD is a meaningful reason for the history scanner to fail.
Review such a finding privately and rotate/revoke any real exposed credential
before considering history rewrites. Never force-push rewritten shared history
as part of an unattended lecture demo.

The controlled `red` mode continues to scan only an ephemeral, deliberately
synthetic token file outside the checkout and expects a real Gitleaks exit 1.
It does not modify or poison repository history. See the workflow artifact
`g16-gitleaks-<run id>` on both passing and failing jobs.

Limitations: an offline history scan cannot inspect commits pruned or made
unreachable by Git maintenance, other forks, hidden refs or credentials held
only in external cloud services. A green result is not proof that the repo
has never exposed a secret.
