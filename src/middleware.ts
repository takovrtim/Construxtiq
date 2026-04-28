// ─────────────────────────────────────────────────────────
// CONSTRUCTIQ — Auth Middleware
// Runs on every non-static request.
// - Refreshes the session token (keeps users logged in)
// - Redirects unauthenticated users to /auth/login
// - Redirects authenticated users away from auth pages
// ─────────────────────────────────────────────────────────

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that never require auth
const PUBLIC_PATHS = [
  '/',
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/pricing',
  '/api/stripe/webhook',   // Stripe sends unauthenticated POST
  '/api/cron',             // Auth'd by CRON_SECRET header, not session
]

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  // Create a Supabase client that can read/write cookies in this request
  const supabase = createServerClient(supabaseUrl, supabaseAnon, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        // Update request cookies (for subsequent server reads in this request)
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value)
        })
        // Rebuild response so the updated cookies are sent to the browser
        response = NextResponse.next({ request: { headers: request.headers } })
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
        })
      },
    },
  })

  // IMPORTANT: Always call getUser() — this refreshes the session if needed.
  // Do NOT call getSession() here; it trusts the client's local token
  // without re-validating with Supabase Auth server.
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  const isPublic = PUBLIC_PATHS.some(p =>
    p === pathname || pathname.startsWith(p + '/')
  )

  // No session + protected route → send to login
  if (!user && !isPublic) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/auth/login'
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Has session + auth page → send to dashboard
  if (user && (
    pathname.startsWith('/auth/login') ||
    pathname.startsWith('/auth/signup')
  )) {
    const dashUrl = request.nextUrl.clone()
    dashUrl.pathname = '/dashboard'
    dashUrl.searchParams.delete('redirect')
    return NextResponse.redirect(dashUrl)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT Next.js internals and static files.
     * This ensures the middleware runs on all page routes and API routes,
     * but skips /_next/static, /_next/image, and public files.
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt)$).*)',
  ],
}
