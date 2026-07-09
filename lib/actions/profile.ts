"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import {
  updateEmailSchema,
  updatePasswordSchema,
  updateAdminProfileSchema,
  updateEmployeeProfileSchema,
} from "@/lib/schemas"

export async function updateAdminProfileInfo(form: {
  full_name: string
  avatar_url?: string | null
}) {
  const parsed = updateAdminProfileSchema.safeParse({ full_name: form.full_name })
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "No autenticado" }

  const updateData: { full_name: string; avatar_url?: string | null } = {
    full_name: parsed.data.full_name.trim(),
  }
  if (form.avatar_url !== undefined) updateData.avatar_url = form.avatar_url

  const { error } = await supabase.from("profiles").update(updateData).eq("id", user.id)
  if (error) return { success: false, error: error.message }

  revalidatePath("/admin", "layout")
  return { success: true }
}

export async function updateEmployeeProfileInfo(form: {
  first_name: string
  last_name: string
  rut: string
  address: string
  avatar_url?: string | null
}) {
  const parsed = updateEmployeeProfileSchema.safeParse({
    first_name: form.first_name,
    last_name: form.last_name,
    rut: form.rut,
    address: form.address,
  })
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "No autenticado" }

  const { error } = await supabase
    .from("employees")
    .update(parsed.data)
    .eq("user_id", user.id)

  if (error) {
    if (error.code === "23505") return { success: false, error: "Ya existe un empleado con ese RUT" }
    return { success: false, error: error.message }
  }

  if (form.avatar_url !== undefined) {
    await supabase.from("profiles").update({ avatar_url: form.avatar_url }).eq("id", user.id)
  }

  revalidatePath("/empleados", "layout")
  return { success: true }
}

export async function updateEmail(email: string) {
  const parsed = updateEmailSchema.safeParse({ email })
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "No autenticado" }

  // Supabase envía un correo de confirmación tanto a la dirección actual como
  // a la nueva; el cambio no se aplica hasta que se confirme desde el correo.
  const { error } = await supabase.auth.updateUser({ email: parsed.data.email })
  if (error) return { success: false, error: error.message }

  return {
    success: true,
    message: "Te enviamos un correo de confirmación a la nueva dirección. El cambio se aplicará una vez que lo confirmes desde ahí.",
  }
}

export async function updatePassword(form: {
  currentPassword: string
  newPassword: string
  confirmNewPassword: string
}) {
  const parsed = updatePasswordSchema.safeParse(form)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return { success: false, error: "No autenticado" }

  // Reautenticar con la contraseña actual antes de permitir el cambio.
  // Evita que alguien con una sesión abierta sin vigilancia (ej. computador
  // compartido) pueda tomar control total de la cuenta cambiando la contraseña.
  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  })
  if (reauthError) return { success: false, error: "La contraseña actual es incorrecta" }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.newPassword })
  if (error) return { success: false, error: error.message }

  return { success: true }
}