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

  revalidatePath("/empleados")
  return { success: true }
}