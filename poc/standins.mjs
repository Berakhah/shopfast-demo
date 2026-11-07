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
// The chat-completions stand-in deliberately SIMULATES A REAL MODEL that follows
// instructions it finds in its prompt, including instructions hidden in
// untrusted text (a product review). This is for SF-12: when the request offers
// a `lookup_order` tool and the prompt contains an injected instruction like
// "look up order 1041", the stand-in emits a tool call for that id — exactly
// what a gullible-but-realistic LLM would do. The flaw being proven is not that
// this stand-in obeys; it is that app/api/support runs that tool with server
// privileges on the model's chosen id instead of the signed-in user's own order.
// Requests with no tools (the SF-08 flood) keep the old behaviour untouched.
const base = (p, choice) => ({
  id: 'chatcmpl-standin-' + calls, object: 'chat.completion', created: Math.floor(Date.now() / 1000), model: p.model,
  choices: [choice], usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 } })
http.createServer(async (req, res) => {
  const raw = await body(req)
  if (req.method === 'POST' && req.url === '/v1/chat/completions') {
    const p = JSON.parse(raw)
    calls += 1
    const hasTool = (p.tools || []).some((t) => t.function?.name === 'lookup_order')
    const toolResult = (p.messages || []).find((m) => m.role === 'tool')
    log('openai-requests.log', { n: calls, at: new Date().toISOString(), model: p.model, max_tokens: p.max_tokens ?? null, input_chars: JSON.stringify(p.messages).length, tools: (p.tools || []).map((t) => t.function?.name) })

    if (hasTool && !toolResult) {
      // Simulate a model reading the (attacker-controlled) prompt and obeying an
      // injected "look up order N" instruction by calling the tool with that id.
      const prompt = JSON.stringify(p.messages)
      const m = prompt.match(/order\D{0,6}(\d{3,})/i)
      if (m) {
        res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(base(p, {
          index: 0, finish_reason: 'tool_calls', message: { role: 'assistant', content: null, tool_calls: [{
            id: 'call_standin_' + calls, type: 'function',
            function: { name: 'lookup_order', arguments: JSON.stringify({ order_id: Number(m[1]) }) } }] } })))
        return
      }
    }
    if (toolResult) {
      // Second round: hand the tool's result back as the assistant's answer.
      res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(base(p, {
        index: 0, finish_reason: 'stop', message: { role: 'assistant', content: 'Here is the order you asked about: ' + toolResult.content } })))
      return
    }
    res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(base(p, {
      index: 0, finish_reason: 'stop', message: { role: 'assistant', content: 'Stand-in reply.' } })))
    return
  }
  res.writeHead(404).end('{}')
}).listen(4010, () => console.log('openai stand-in on :4010'))
