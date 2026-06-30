"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidateDepartments } from "@/lib/actions/revalidate"
import { departmentSchema } from "@/lib/schemas"
import { z } from "zod"

const idSchema = z.string().uuid("ID inválido")

export async function getDepartments() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("departments")
    .select("*")
    .order("name")
  if (error) throw error
  return data
}

export async function createDepartment(name: string) {
  const parsed = departmentSchema.safeParse({ name })
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "No autenticado" }

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single()
  if (!profile) return { success: false, error: "Perfil no encontrado" }

  const { error } = await supabase
    .from("departments")
    .insert({ name: parsed.data.name, company_id: profile.company_id })

  if (error) return { success: false, error: error.message }
  await revalidateDepartments()
  return { success: true }
}

export async function updateDepartment(id: string, name: string) {
  const idParsed = idSchema.safeParse(id)
  if (!idParsed.success) return { success: false, error: "ID inválido" }

  const parsed = departmentSchema.safeParse({ name })
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await supabase
    .from("departments")
    .update({ name: parsed.data.name })
    .eq("id", id)

  if (error) return { success: false, error: error.message }
  await revalidateDepartments()
  return { success: true }
}

export async function deleteDepartment(id: string) {
  const idParsed = idSchema.safeParse(id)
  if (!idParsed.success) return { success: false, error: "ID inválido" }

  const supabase = await createClient()
  const { error } = await supabase
    .from("departments")
    .delete()
    .eq("id", id)

  if (error) return { success: false, error: error.message }
  await revalidateDepartments()
  return { success: true }
}