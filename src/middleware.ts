import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_ROUTES = [
  '/',
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/callback',
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow public routes
  const isPublic = PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))
  const isApprove = pathname.startsWith('/approve/')
  const isApi = pathname.startsWith('/api/')
  const isInternal = pathname.startsWith('/_next/') || pathname.includes('favicon')

  if (isPublic || isApprove || isApi || isInternal) {
    return NextResponse.next()
  }

  // Check for Supabase auth cookie
  const token =
    req.cookies.get('sb-access-token')?.value ||
    req.cookies.get(`sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`)?.value ||
    req.cookies.get('supabase-auth-token')?.value

  // Look for any supabase session cookie
  const hasSession = Array.from(req.cookies.getAll()).some(
    c => c.name.includes('auth-token') || c.name.includes('sb-')
  )

  if (!hasSession) {
    const loginUrl = new URL('/auth/login', req.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
