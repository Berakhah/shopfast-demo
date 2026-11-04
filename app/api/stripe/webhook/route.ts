import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// PLANTED SF-05: the body is trusted as-is; Stripe-Signature is never checked.
export async function POST(req: Request) {
  const event = await req.json()
  if (event.type === 'checkout.session.completed') {
    const orderId = event.data.object.metadata.order_id
    await supabaseAdmin.from('orders').update({ status: 'paid' }).eq('id', orderId)
  }
  return Response.json({ received: true })
}
