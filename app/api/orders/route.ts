import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data: { user } } = await createClient().auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })
  const { data } = await supabaseAdmin
    .from('orders').select('id,total_cents,status').eq('user_id', user.id)
  return Response.json(data ?? [])
}
