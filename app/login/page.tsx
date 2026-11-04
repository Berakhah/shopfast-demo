import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

async function login(formData: FormData) {
  'use server'
  const { error } = await createClient().auth.signInWithPassword({
    email: String(formData.get('email')),
    password: String(formData.get('password')),
  })
  redirect(error ? '/login?error=1' : '/')
}

export default function Login() {
  return (
    <form action={login} style={{ display: 'grid', gap: 8, maxWidth: 280 }}>
      <input name="email" type="email" placeholder="Email" required />
      <input name="password" type="password" placeholder="Password" required />
      <button type="submit">Log in</button>
    </form>
  )
}
