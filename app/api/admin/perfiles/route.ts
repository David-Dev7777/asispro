import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const ALLOWED_ROLES = ["employee", "admin"] as const
type AllowedRole = (typeof ALLOWED_ROLES)[number]

export async function POST(request: Request) {
  try {
    // 1. Verificar que quien llama es admin
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, company_id")
      .eq("id", user.id)
      .single()

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    // 2. Datos del formulario
    const { email, password, role } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email y contraseña son obligatorios" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 })
    }

    // Nunca confiar en el rol tal cual viene del cliente: validar contra la whitelist.
    // Esto evita que alguien mande un rol arbitrario (ej. "superadmin") manipulando el request.
    if (!ALLOWED_ROLES.includes(role)) {
      return NextResponse.json({ error: "Rol inválido" }, { status: 400 })
    }
    const safeRole: AllowedRole = role

    // 3. Crear usuario con service role — el trigger crea el perfil automáticamente
    const { data: newUser, error: authError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: safeRole,
        company_id: profile.company_id,
      },
    })

    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

    return NextResponse.json({ success: true, user_id: newUser.user.id })
  } catch {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}