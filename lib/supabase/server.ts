import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // PLANTED SF-07 (part 2): set during an iframe-embed experiment
      cookieOptions: { sameSite: 'none', secure: true },
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(list) {
          try {
            list.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, { ...options, sameSite: 'none', secure: true })
            )
          } catch {
            // called from a Server Component; middleware refreshes sessions
          }
        },
      },
    }
  )
}
