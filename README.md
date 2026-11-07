# ShopFast: intentionally vulnerable demo store

[![proofs](https://github.com/Berakhah/shopfast-demo/actions/workflows/poc.yml/badge.svg?branch=main)](https://github.com/Berakhah/shopfast-demo/actions/workflows/poc.yml)

![Sample audit: eight planted flaws, 3 Critical, 2 High, 3 Medium, all proven in a live run](docs/sample-audit-cover.png)

**Do not deploy this publicly. Do not reuse this code.** ShopFast is a training
fixture: a small Next.js 14 + Supabase + Stripe store with eight security flaws
planted on purpose, each a pattern AI coding tools commonly produce. It backs the
sample findings report "Sample Security Audit: AI-Built Supabase + Stripe Store".

Every planted flaw is marked in the code with a `PLANTED SF-0n` comment.

| ID | Planted flaw | Where |
| --- | --- | --- |
| SF-01 | Service-role key shipped to the browser | `lib/supabase.ts` |
| SF-02 | RLS off on `profiles` and `orders` | `supabase/migrations/` |
| SF-03 | Stripe secret key in git history (a fake test key) | `.env`, first commit |
| SF-04 | No ownership check on orders | `app/api/orders/[id]` |
| SF-05 | Stripe webhook signature never checked | `app/api/stripe/webhook` |
| SF-06 | Price taken from the browser at checkout | `app/api/checkout` |
| SF-07 | CORS reflects any origin, cookies sent cross-site | `middleware.ts`, `lib/supabase/server.ts` |
| SF-08 | No limits on the AI chat endpoint | `app/api/chat` |

Stripe and OpenAI calls go to local stand-ins (`poc/standins.mjs`), so running the
proofs of concept touches no payment or AI account. The Stripe key in git history
is fake and was never valid.

## The report

The full findings report (plain-English summary, a CVSS 3.1 score, proof and code
fix for each of the eight findings, and a fix-today / this-week / before-launch
roadmap) is the first item in my
[Upwork portfolio](https://www.upwork.com/freelancers/~01645da719eb4829ed).

Results: 8 findings (3 Critical, 2 High, 3 Medium), all 8 proven in a live run.

## Run the proofs yourself

**On GitHub, no setup:** the [proofs workflow](.github/workflows/poc.yml) starts a
throwaway local Supabase stack inside the job, seeds two test users and their
orders, runs `npm run poc`, and fails unless SF-01, 02, 04, 05, 06 and 07 are each
reproduced ([`poc/check-results.mjs`](poc/check-results.mjs)). It runs on every push
and weekly, uses no repository secrets, and keeps the redacted results as a
download on each run. SF-03 (key in git history) and SF-08 (unlimited AI spend)
are shown in the report, not by the runner.

**On your machine:** needs Node 20+, Docker and the
[Supabase CLI](https://supabase.com/docs/guides/local-development).

1. `supabase init && supabase start` (applies `supabase/migrations/` to a local
   stack), then `supabase status -o env > supabase.env`.
2. `node poc/ci-env.mjs supabase.env > .env.local`. This writes the Supabase URL and
   keys, the planted `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` (SF-01), a test
   password, and the settings that point Stripe and OpenAI at the local stand-ins.
3. `npm install`, then `node poc/ci-seed.mjs` (creates Alice, Bob, and orders
   1041 and 1042).
4. `npm run poc`, then `node poc/check-results.mjs`. Redacted output is in
   `poc/out/results.txt`.

`supabase stop` when you're done. Don't point this at a hosted project: with these
flaws it is open to anyone who has its URL.

## Get your own app audited

This is the review I offer for Lovable, Bolt, Cursor and Next.js + Supabase apps
before launch.
[Hire me on Upwork](https://www.upwork.com/freelancers/~01645da719eb4829ed), or
see [my other work](https://berakhah.github.io).
