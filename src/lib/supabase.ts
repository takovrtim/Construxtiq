import { createBrowserClient, createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseSvc  = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const STORAGE_BUCKET = 'documents'

// Browser client — for use in client components
export const supabase = createBrowserClient(supabaseUrl, supabaseAnon)

// Server client — for server components and API routes
export function createServerSupabase() {
  const { cookies } = require('next/headers')
  const cookieStore = cookies()
  return createServerClient(supabaseUrl, supabaseAnon, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll(cookiesToSet: any[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }: any) =>
            cookieStore.set(name, value, options)
          )
        } catch {}
      },
    },
  })
}

// Admin client — bypasses RLS, use only in API routes
export function createAdminSupabase() {
  return createClient(supabaseUrl, supabaseSvc, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
