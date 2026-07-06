"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { resetPasswordSchema } from "@/lib/schemas"

export type ResetPasswordState = {
  error?: string
}

export async function resetPassword(
  _prevState: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()

  // Requiere que exista una sesión de recuperación válida (creada en /auth/confirm)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "El enlace expiró o no es válido. Solicita uno nuevo." }
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error) {
    return { error: error.message }
  }

  // Cerramos la sesión de recuperación para forzar login limpio con la nueva contraseña.
  await supabase.auth.signOut()
  redirect("/login?message=Contraseña actualizada. Inicia sesión con tu nueva contraseña.")
}