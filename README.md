# ShopFast: intentionally vulnerable demo store

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

Needs Node 20+ and a throwaway Supabase project you own.

1. Apply `supabase/migrations/` to the throwaway project.
2. Create `.env.local` with `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` and
   `TEST_USER_PASSWORD`.
3. `npm install`, then `npm run poc`. It builds the app, runs every proof against
   `localhost` and writes redacted results to `poc/out/results.txt`.

Pause or delete the throwaway project when you're done: with these flaws it is
open to anyone who has its URL.

## Get your own app audited

This is the review I offer for Lovable, Bolt, Cursor and Next.js + Supabase apps
before launch.
[Hire me on Upwork](https://www.upwork.com/freelancers/~01645da719eb4829ed), or
see [my other work](https://berakhah.github.io).
