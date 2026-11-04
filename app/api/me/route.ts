import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data: { user } } = await createClient().auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })
  const { data: profile } = await supabaseAdmin
    .from('profiles').select('email,full_name,shipping_address').eq('id', user.id).single()
  const { data: orders } = await supabaseAdmin
    .from('orders').select('id,total_cents,status').eq('user_id', user.id)
  return Response.json({ ...profile, orders })
}
