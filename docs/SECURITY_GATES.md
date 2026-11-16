# Additional real security gates

G16: Gitleaks v8.30.1 downloaded from the upstream release, sha256-verified,
and executed on the checked-out repository. RED uses a generated, nonfunctional
sample resembling a classic GitHub token in the runner's temporary directory.
It is never checked into the repository. JSON findings are redacted and retained
even on failing runs. Scanner exit code 1 counts as a valid intentional RED only
when the Gitleaks report actually contains findings.

G19: npm ci --ignore-scripts, then inspect *installed* package.json metadata
from node_modules (including transitive dependencies). Fail closed on missing
or unrecognized licenses. Allowed SPDX identifiers: MIT, Apache-2.0,
BSD-2-Clause, BSD-3-Clause, ISC, 0BSD and CC0-1.0.
Compound expressions are allowed only if every constituent is approved;
unknown WITH exceptions fail closed. The RED demonstration injects one
ephemeral GPL-3.0-only policy input, not an installed dependency.

Both gates run for every PR. Run workflow_dispatch for a selected gate with
mode=red or mode=green to generate controlled, inspectable outcomes. Do not
confuse demonstration RED runs with real credential leakage. Neither gate
requires cloud secrets or write-scoped GitHub tokens.

Limitations: Gitleaks scans checked-out files, not the entire git history
(consider adding a separate history scan); the G19 classifier reads npm
package metadata, not a verified SPDX license text; allowed SPDX expressions
are processed with an intentionally strict policy, not a complete SPDX parser.
