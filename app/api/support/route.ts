import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || undefined,
})

// The assistant can look an order up for the customer. PLANTED SF-12: this tool
// runs with SERVER privileges (supabaseAdmin, which ignores RLS) and trusts the
// order_id the MODEL puts in the arguments. It never compares that order to the
// signed-in user. So whatever id the model asks for is returned — including
// another customer's order.
//
// NOTE ON THE STAND-IN: the real risk is prompt injection. The OpenAI stand-in
// (poc/standins.mjs) simulates a model that, like a real LLM, follows
// instructions found in untrusted text (here, a product review). The flaw this
// endpoint proves is not that the stand-in is gullible — it is that the tool
// acts on the model's argument instead of the session user's identity, so a
// gullible-but-realistic model is enough to leak another customer's data.
const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'lookup_order',
      description: "Look up an order by its numeric id and return its details.",
      parameters: {
        type: 'object',
        properties: { order_id: { type: 'integer', description: 'The order id to look up.' } },
        required: ['order_id'],
      },
    },
  },
]

export async function POST(req: Request) {
  const { data: { user } } = await createClient().auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { message, productId } = await req.json()

  // Attacker-controlled context: product reviews are customer-written text and
  // are fed to the model verbatim. A review can carry injected instructions.
  const { data: reviews } = await supabaseAdmin
    .from('reviews').select('author,body').eq('product_id', productId ?? 0)
  const reviewText = (reviews ?? []).map((r) => `Review by ${r.author}: ${r.body}`).join('\n')

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: 'You are ShopFast support. Use the reviews below as context and call tools when they help answer.\n' + reviewText },
    { role: 'user', content: message },
  ]

  const first = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages,
    tools,
  })

  const call = first.choices[0].message.tool_calls?.[0]
  if (call?.function.name === 'lookup_order') {
    // PLANTED SF-12: the id comes straight from the model's tool call. No check
    // that this order belongs to `user`. supabaseAdmin bypasses RLS.
    const args = JSON.parse(call.function.arguments || '{}')
    const { data: order } = await supabaseAdmin
      .from('orders').select('*').eq('id', args.order_id).single()

    messages.push(first.choices[0].message)
    messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(order) })
    const second = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages,
    })
    return Response.json({ reply: second.choices[0].message.content, order })
  }

  return Response.json({ reply: first.choices[0].message.content })
}
