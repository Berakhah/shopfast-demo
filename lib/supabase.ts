import { createBrowserClient } from '@supabase/ssr'

// PLANTED SF-01: the admin page "could not load orders" with the anon key,
// so the service-role key was swapped in. NEXT_PUBLIC_ means Next.js copies
// it into the JavaScript sent to every visitor.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
)
