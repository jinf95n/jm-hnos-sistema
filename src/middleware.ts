import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { ADMIN_EMAILS } from '@/app/lib/config';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return request.cookies.get(name)?.value },
        set(name, value, options) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name, options) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // 1. Si no hay usuario, al login
  if (!user && (request.nextUrl.pathname.startsWith('/admin') || request.nextUrl.pathname.startsWith('/catalogo'))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 2. SEGURIDAD ADMIN: Solo tu mail puede entrar a /admin

  if (request.nextUrl.pathname.startsWith('/admin')) {
  if (!user?.email || !ADMIN_EMAILS.includes(user.email)) {
    return NextResponse.redirect(new URL('/catalogo', request.url));
  }
}

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/catalogo/:path*'],
}