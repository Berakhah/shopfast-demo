import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { data } = await createClient()
    .from('products').select('id,name,description,price_cents').eq('id', params.id).single()
  if (!data) return new Response('Not found', { status: 404 })
  return Response.json(data)
}
