import OpenAI from 'openai'

export const dynamic = 'force-dynamic'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || undefined,
})

// PLANTED SF-08: no login, no rate limit, no input length check, no token cap.
export async function POST(req: Request) {
  const { message } = await req.json()
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You answer questions about ShopFast products.' },
      { role: 'user', content: message },
    ],
  })
  return Response.json({ reply: completion.choices[0].message.content })
}
