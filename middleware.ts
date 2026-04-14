import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value },
        set(name: string, value: string, options: any) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  const isPublic = (
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/landing') ||
    pathname === '/'
  )

  // Giriş yapmamış → login'e yönlendir
  if (!user && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Giriş yapmış → role bazlı yönlendirme
  if (user && (pathname === '/' || pathname === '/dashboard')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_super_admin')
      .eq('user_id', user.id)
      .single()

    if (profile) {
      if (profile.is_super_admin) {
        if (pathname === '/') return NextResponse.redirect(new URL('/dashboard', request.url))
      } else if (profile.role === 'student') {
        return NextResponse.redirect(new URL('/student-panel', request.url))
      } else if (profile.role === 'teacher') {
        return NextResponse.redirect(new URL('/teacher-panel', request.url))
      } else if (profile.role === 'parent') {
        return NextResponse.redirect(new URL('/parent-panel', request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}