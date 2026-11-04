import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const { data: products } = await createClient().from('products').select('id,name,price_cents')
  return (
    <ul>
      {products?.map((p) => (
        <li key={p.id}>{p.name}: ${(p.price_cents / 100).toFixed(2)}</li>
      ))}
    </ul>
  )
}
