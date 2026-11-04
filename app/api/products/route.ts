import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data } = await createClient().from('products').select('id,name,description,price_cents')
  return Response.json(data ?? [])
}
