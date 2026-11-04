import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const code = new URL(req.url).searchParams.get('code')
  if (code) await createClient().auth.exchangeCodeForSession(code)
  return NextResponse.redirect(new URL('/', req.url))
}
