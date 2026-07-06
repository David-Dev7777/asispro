// app/auth/confirm/route.ts
import { type EmailOtpType } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const next = searchParams.get("next") ?? "/reset-password"

  const supabase = await createClient()

  // Supabase puede mandar el link con "code" (PKCE, lo más común hoy)
  // o con "token_hash" + "type" (flujo OTP clásico). Soportamos ambos.
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) redirect(next)
  } else if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })
    if (!error) redirect(next)
  }

  redirect("/forgot-password?error=link_invalido")
}