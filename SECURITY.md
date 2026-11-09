# Security policy

ShopFast is intentionally vulnerable. Its twelve planted flaws (SF-01 to SF-12) are documented
in the README and the sample report, and they are not bugs to report.

## What to report

Report these privately through GitHub
([Security → Report a vulnerability](https://github.com/Berakhah/shopfast-demo/security/advisories/new)):

- A **real** credential in the repo or its history: a Supabase key, a Stripe key or a webhook
  secret that works against something other than a local or test project.
- A problem in the CI workflow (`.github/workflows/poc.yml`) that could leak a repository
  secret or let a pull request run with write access.
- A flaw that is **not** one of SF-01 to SF-12 and would also affect a real app built the same
  way. I will credit you and may add it to the set.

I aim to acknowledge within 5 business days.

## What not to report

- Any of SF-01 to SF-12, or a variant of one.
- Anything about a public deployment of this code. There is no official one, and the README
  says not to make one.

A proof that no longer reproduces, or a fix in the report that is wrong, is welcome as an
ordinary issue.
