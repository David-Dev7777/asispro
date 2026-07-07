"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createOnboardingEmployee(form: {
  first_name: string
  last_name: string
  rut: string
  address: string
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "No autenticado" }

  // Obtener company_id desde profiles
  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single()

  if (!profile) return { success: false, error: "Perfil no encontrado" }

  // Crear registro en employees
  const { error } = await supabase
    .from("employees")
    .insert({
      user_id: user.id,
      company_id: profile.company_id,
      first_name: form.first_name,
      last_name: form.last_name,
      rut: form.rut,
      address: form.address,
    })

  if (error) {
    if (error.code === "23505") return { success: false, error: "Ya existe un empleado con ese RUT" }
    return { success: false, error: error.message }
  }

  // Marca el onboarding como completo a nivel de perfil también.
  // No bloqueamos el éxito si esto falla por algún motivo raro: el registro
  // de employees ya se creó, que es lo que realmente gatilla la salida
  // del onboarding para empleados en el middleware.
  await supabase
    .from("profiles")
    .update({ onboarding_completed: true })
    .eq("id", user.id)

  revalidatePath("/empleados")
  return { success: true }
}

export async function completeAdminOnboarding(form: {
  full_name: string
  avatar_url?: string | null
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "No autenticado" }

  if (!form.full_name.trim()) {
    return { success: false, error: "El nombre es obligatorio" }
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: form.full_name.trim(),
      avatar_url: form.avatar_url ?? null,
      onboarding_completed: true,
    })
    .eq("id", user.id)

  if (error) return { success: false, error: error.message }

  revalidatePath("/admin")
  return { success: true }
}