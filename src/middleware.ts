import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const protectedPaths = ['/dashboard', '/profile', '/sos', '/contacts', '/hospitals', '/guides']
  const adminPaths = ['/admin']
  const authPaths = ['/auth/login', '/auth/signup']

  const isProtected = protectedPaths.some(p => request.nextUrl.pathname.startsWith(p))
  const isAdminPath = adminPaths.some(p => request.nextUrl.pathname.startsWith(p))
  const isAuth = authPaths.some(p => request.nextUrl.pathname.startsWith(p))

  // Unauthenticated → redirect to login
  if ((isProtected || isAdminPath) && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Already logged in → skip auth pages
  if (isAuth && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Pass the current pathname as a header so Server Components can read it
  // (needed for active nav highlighting without usePathname in RSC)
  supabaseResponse.headers.set('x-pathname', request.nextUrl.pathname)

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
