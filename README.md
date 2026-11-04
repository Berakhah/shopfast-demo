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
