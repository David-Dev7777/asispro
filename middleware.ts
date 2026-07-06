import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/app/types/database.types'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
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
  const pathname = request.nextUrl.pathname

  // Rutas de "invitado": si ya hay sesión, no tiene sentido verlas → se redirige al dashboard
  const guestOnlyRoutes = ['/login', '/signup', '/forgot-password']
  const isGuestOnlyRoute = guestOnlyRoutes.some(r => pathname.startsWith(r))

  // Rutas del flujo de recuperación: deben ser accesibles SIEMPRE,
  // con o sin sesión, y sin pasar por chequeos de rol/onboarding.
  // /reset-password se visita con una sesión temporal creada por Supabase
  // tras hacer clic en el link del correo, así que "user" puede existir acá
  // sin que signifique que el usuario terminó de loguearse normalmente.
  const authFlowRoutes = ['/reset-password', '/auth/confirm']
  const isAuthFlowRoute = authFlowRoutes.some(r => pathname.startsWith(r))

  const isPublicRoute = isGuestOnlyRoute || isAuthFlowRoute

  if (isAuthFlowRoute) {
    return supabaseResponse
  }

  // No autenticado en ruta privada → login
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Autenticado → obtener perfil una sola vez
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role

    // Autenticado en ruta de invitado (login/signup/forgot-password) → a su dashboard
    if (isGuestOnlyRoute) {
      const url = request.nextUrl.clone()
      if (role === 'admin') {
        url.pathname = '/admin'
        return NextResponse.redirect(url)
      }
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user.id)
        .single()
      url.pathname = employee ? '/empleados' : '/onboarding'
      return NextResponse.redirect(url)
    }

    // Proteger /admin → solo admin
    if (pathname.startsWith('/admin') && role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/empleados'
      return NextResponse.redirect(url)
    }

    // Proteger /empleados → solo employee
    if (pathname.startsWith('/empleados') && role !== 'employee') {
      const url = request.nextUrl.clone()
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    }

    // Verificar onboarding para empleados
    if (role === 'employee' && !pathname.startsWith('/onboarding')) {
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!employee) {
        const url = request.nextUrl.clone()
        url.pathname = '/onboarding'
        return NextResponse.redirect(url)
      }
    }

    // Si ya completó onboarding y trata de volver a /onboarding
    if (pathname.startsWith('/onboarding')) {
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (employee) {
        const url = request.nextUrl.clone()
        url.pathname = '/empleados/inicio'
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}