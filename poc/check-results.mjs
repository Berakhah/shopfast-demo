// Fails the job unless every proof in poc/out/results.txt shows the flaw was
// actually reproduced. run-all.mjs always exits 0, so this is the real gate.
import fs from 'node:fs'
const t = fs.readFileSync(process.argv[2] || 'poc/out/results.txt', 'utf8')
const expect = [
  ['SF-01', /payload role: service_role/],
  ['SF-01', /using the token from the bundle: GET \/rest\/v1\/profiles -> HTTP 200, [1-9]\d* rows/],
  ['SF-02', /GET \/rest\/v1\/orders with the anon key -> HTTP 200/],
  ['SF-02', /PATCH \/rest\/v1\/orders\?id=eq\.1041 \{"status":"paid"\} with the anon key -> HTTP 200, now: "paid"/],
  ['SF-04', /GET \/api\/orders\/1041 -> HTTP 200/],
  ['SF-04', /GET \/api\/orders\/1041 again -> shipping_address: "ATTACKER ADDRESS \(test\)"/],
  ['SF-05', /order 1042 status after: paid/],
  ['SF-06', /total_cents=50,/],
  ['SF-07', /access-control-allow-origin: https:\/\/attacker\.example/],
  ['SF-07', /access-control-allow-credentials: true/],
]
let failed = 0
if (/^ERROR:/m.test(t)) { console.log('FAIL  runner reported an ERROR line'); failed++ }
for (const [id, re] of expect) {
  const ok = re.test(t); if (!ok) failed++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${id}  ${re.source}`)
}
console.log(failed ? `\n${failed} check(s) failed` : '\nAll 6 runner-covered findings reproduced (SF-01, 02, 04, 05, 06, 07).')
process.exit(failed ? 1 : 0)
