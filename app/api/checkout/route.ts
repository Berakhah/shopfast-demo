import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const { data: { user } } = await createClient().auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  // PLANTED SF-06: the cart already knows the price, so the browser sends it.
  const { productId, productName, price, quantity } = await req.json()

  const { data: profile } = await supabaseAdmin
    .from('profiles').select('shipping_address').eq('id', user.id).single()
  const { data: order } = await supabaseAdmin.from('orders').insert({
    user_id: user.id, product_id: productId, quantity,
    total_cents: price * quantity, shipping_address: profile?.shipping_address,
  }).select('id').single()

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price_data: { currency: 'usd', product_data: { name: productName }, unit_amount: price }, quantity }],
    metadata: { order_id: String(order!.id) },
    success_url: 'http://localhost:3000/?paid=1',
    cancel_url: 'http://localhost:3000/',
  })
  await supabaseAdmin.from('orders').update({ stripe_session_id: session.id }).eq('id', order!.id)
  return Response.json({ orderId: order!.id, url: session.url })
}
