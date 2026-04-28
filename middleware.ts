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

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    const role = profile?.role
    const isAdminLike = role === 'admin' || role === 'superadmin'

    // Login veya ana sayfaya gelince role göre yönlendir
    if (pathname === '/' || pathname === '/login') {
      if (isAdminLike) return NextResponse.redirect(new URL('/dashboard', request.url))
      if (role === 'teacher') return NextResponse.redirect(new URL('/teacher-panel', request.url))
      if (role === 'student') return NextResponse.redirect(new URL('/student-panel', request.url))
      if (role === 'parent') return NextResponse.redirect(new URL('/parent-panel', request.url))
    }

    // Öğrenci sayfası — sadece student
    if (pathname.startsWith('/student-panel') && role !== 'student' && !isAdminLike) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Öğretmen sayfası — sadece teacher
    if (pathname.startsWith('/teacher-panel') && role !== 'teacher' && !isAdminLike) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Veli sayfası — sadece parent
    if (pathname.startsWith('/parent-panel') && role !== 'parent' && !isAdminLike) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Superadmin sayfası — sadece superadmin
    if (pathname.startsWith('/superadmin') && role !== 'superadmin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Admin sayfaları — sadece admin ve superadmin
    const adminPaths = [
      '/dashboard', '/candidates', '/students', '/branches', '/branch-report', '/schools', '/subjects', '/topics', '/teachers', '/parents', '/parent-match',
      '/scheduler', '/conflicts', '/makeup',
      '/books', '/risk', '/coordinator', '/guidance', '/outcomes',
      '/reports', '/swot', '/exams', '/prediction', '/scenario',
      '/institution', '/parentreport', '/goals', '/daily-tasks',
      '/performance', '/exam-analytics', '/notifications',
      '/questions', '/studyplan', '/teacherdecision', '/profile',
      '/accessibility',
    ]
    const isAdminPath = adminPaths.some(p => pathname.startsWith(p))
    if (isAdminPath && !isAdminLike) {
      if (role === 'student') return NextResponse.redirect(new URL('/student-panel', request.url))
      if (role === 'teacher') return NextResponse.redirect(new URL('/teacher-panel', request.url))
      if (role === 'parent') return NextResponse.redirect(new URL('/parent-panel', request.url))
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon|sw.js|manifest.json).*)'],
}