'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Header() {
  const [count, setCount] = useState<number | null>(null)
  useEffect(() => {
    supabase.from('products').select('id', { count: 'exact', head: true })
      .then(({ count }) => setCount(count))
  }, [])
  return (
    <nav style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
      <a href="/">ShopFast</a> <a href="/login">Log in</a> <a href="/admin">Admin</a>
      <span>{count ?? '…'} products</span>
    </nav>
  )
}
