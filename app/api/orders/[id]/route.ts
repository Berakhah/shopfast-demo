import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// PLANTED SF-04: signed-in check only; the order is looked up by ID with the
// admin client, so nobody checks whose order it is.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { data: { user } } = await createClient().auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })
  const { data } = await supabaseAdmin.from('orders').select('*').eq('id', params.id).single()
  if (!data) return new Response('Not found', { status: 404 })
  return Response.json(data)
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { data: { user } } = await createClient().auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })
  const body = await req.json()
  await supabaseAdmin.from('orders').update(body).eq('id', params.id)
  return Response.json({ ok: true })
}
