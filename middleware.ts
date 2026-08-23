import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isDisabledDashboardRoute } from '@/src/config/features'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Aset Next.js & file statis: lewati tanpa auth
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/public') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Tanpa env, jangan blokir total (hindari loop blank)
  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  // Penting: getUser() merefresh sesi & menulis cookie
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isPublicRoute =
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/portal' ||
    pathname.startsWith('/santri/') ||
    pathname === '/auth/callback'

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    if (pathname.startsWith('/auth/')) {
      url.searchParams.set('error', 'reset_session')
    }
    return NextResponse.redirect(url)
  }

  // Sudah login: jangan stuck di halaman login (kecuali sedang reset password)
  if (user && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Fitur dimatikan: jangan biarkan URL langsung dibuka
  if (user && isDisabledDashboardRoute(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    const redirectResponse = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie)
    })
    return redirectResponse
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
