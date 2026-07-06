"use server"

import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { forgotPasswordSchema } from "@/lib/schemas"

export type ForgotPasswordState = {
  error?: string
  success?: boolean
  message?: string
}

export async function forgotPassword(
  _prevState: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const originHeader = (await headers()).get("origin")
  const origin = originHeader ?? process.env.NEXT_PUBLIC_SITE_URL ?? ""

  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/confirm?next=/reset-password`,
  })

  // Importante: no revelar si el correo existe o no (evita enumeración de usuarios).
  // Por eso siempre devolvemos el mismo mensaje de éxito, exista o no el email.
  return {
    success: true,
    message: "Si el correo está registrado, te enviamos un enlace para recuperar tu contraseña.",
  }
}