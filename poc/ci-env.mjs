// CI only: turns `supabase status -o env` output into the .env.local the app
// and poc/run-all.mjs expect. The keys are the local stack's development keys.
import fs from 'node:fs'
const env = Object.fromEntries(fs.readFileSync(process.argv[2], 'utf8').split(/\r?\n/)
  .map((l) => l.match(/^([A-Z_]+)="?([^"]*)"?$/)).filter(Boolean).map((m) => [m[1], m[2]]))
const url = env.API_URL, anon = env.ANON_KEY, srk = env.SERVICE_ROLE_KEY
if (!url || !anon || !srk) { console.error('missing API_URL / ANON_KEY / SERVICE_ROLE_KEY'); process.exit(1) }
console.log([
  `NEXT_PUBLIC_SUPABASE_URL=${url}`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY=${anon}`,
  `SUPABASE_SERVICE_ROLE_KEY=${srk}`,
  `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=${srk}`, // PLANTED SF-01 needs it in the bundle
  'TEST_USER_PASSWORD=ci-only-test-password-1',
  'STRIPE_SECRET_KEY=sk_test_local_standin',
  'STRIPE_API_HOST=localhost', 'STRIPE_API_PORT=12111', 'STRIPE_API_PROTOCOL=http',
  'STRIPE_WEBHOOK_SECRET=whsec_local_standin',
  'OPENAI_API_KEY=sk-local-standin', 'OPENAI_BASE_URL=http://localhost:4010/v1',
].join('\n'))
