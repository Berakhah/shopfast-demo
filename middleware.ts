import { NextResponse, type NextRequest } from 'next/server'

// PLANTED SF-07 (part 1): added to "fix" a CORS error. It trusts every origin
// and lets that origin send the visitor's cookies.
function corsHeaders(origin: string) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

export function middleware(req: NextRequest) {
  const origin = req.headers.get('origin') ?? '*'
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: corsHeaders(origin) })
  }
  const res = NextResponse.next()
  for (const [k, v] of Object.entries(corsHeaders(origin))) res.headers.set(k, v)
  return res
}

export const config = { matcher: '/api/:path*' }
