// Local stand-ins for Stripe (test mode) and OpenAI, so no real account is touched.
// Every request the app sends is appended to poc/out/*.log as evidence.
import http from 'node:http'
import fs from 'node:fs'
import crypto from 'node:crypto'

const log = (file, obj) => fs.appendFileSync(`poc/out/${file}`, JSON.stringify(obj) + '\n')
const body = (req) => new Promise((r) => { let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => r(b)) })

http.createServer(async (req, res) => {
  const raw = await body(req)
  if (req.method === 'POST' && req.url === '/v1/checkout/sessions') {
    const p = new URLSearchParams(raw)
    const unit = Number(p.get('line_items[0][price_data][unit_amount]'))
    const qty = Number(p.get('line_items[0][quantity]'))
    const id = 'cs_test_' + crypto.randomBytes(12).toString('hex')
    const session = { id, object: 'checkout.session', mode: 'payment', currency: 'usd',
      amount_total: unit * qty, payment_status: 'unpaid', metadata: { order_id: p.get('metadata[order_id]') },
      url: `http://localhost:12111/pay/${id}` }
    log('stripe-requests.log', { at: new Date().toISOString(), path: req.url, params: Object.fromEntries(p), response: session })
    res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(session))
    return
  }
  res.writeHead(404).end('{}')
}).listen(12111, () => console.log('stripe stand-in on :12111'))

let calls = 0
http.createServer(async (req, res) => {
  const raw = await body(req)
  if (req.method === 'POST' && req.url === '/v1/chat/completions') {
    const p = JSON.parse(raw)
    calls += 1
    log('openai-requests.log', { n: calls, at: new Date().toISOString(), model: p.model, max_tokens: p.max_tokens ?? null, input_chars: JSON.stringify(p.messages).length })
    res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({
      id: 'chatcmpl-standin-' + calls, object: 'chat.completion', created: Math.floor(Date.now() / 1000), model: p.model,
      choices: [{ index: 0, finish_reason: 'stop', message: { role: 'assistant', content: 'Stand-in reply.' } }],
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 } }))
    return
  }
  res.writeHead(404).end('{}')
}).listen(4010, () => console.log('openai stand-in on :4010'))
