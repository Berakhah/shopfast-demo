import { createClient } from '@supabase/supabase-js'
const sb = createClient(process.env.SB_URL, process.env.SB_ANON)
for (const [email, name] of [['alice@shopfast.test', 'Alice Test'], ['bob@shopfast.test', 'Bob Test']]) {
  const { data, error } = await sb.auth.signUp({ email, password: process.env.TEST_PW, options: { data: { full_name: name } } })
  console.log(email, error ? 'ERROR ' + error.message : 'created ' + data.user?.id)
}
