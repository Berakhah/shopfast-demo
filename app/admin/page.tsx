'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Admin() {
  const [orders, setOrders] = useState<{ id: number; status: string; total_cents: number }[]>([])
  useEffect(() => {
    supabase.from('orders').select('id,status,total_cents').then(({ data }) => setOrders(data ?? []))
  }, [])
  return <pre>{JSON.stringify(orders, null, 2)}</pre>
}
