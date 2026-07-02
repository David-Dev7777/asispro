"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidateEmployees } from "@/lib/actions/revalidate"
import { employeeSchema } from "@/lib/schemas"
import { z } from "zod"

const idSchema = z.string().uuid("ID inválido")

export async function getEmployees() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("employees")
    .select("*, departments(id, name), overtime_requests(hours, status)")
    .order("last_name")
  if (error) throw error
  return data
}

export async function createEmployee(form: {
  first_name: string
  last_name: string
  rut: string
  address: string
  position: string
  department_id: string | null
  hire_date?: string | null
  vacation_days?: number
}) {
  const parsed = employeeSchema.safeParse(form)
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
    .from("employees")
    .insert({ ...parsed.data, company_id: profile.company_id })

  if (error) return { success: false, error: error.message }
  await revalidateEmployees()
  return { success: true }
}

export async function updateEmployee(id: string, form: {
  first_name?: string
  last_name?: string
  rut?: string
  address?: string
  position?: string
  department_id?: string | null
  hire_date?: string | null
  vacation_days?: number
}) {
  const idParsed = idSchema.safeParse(id)
  if (!idParsed.success) return { success: false, error: "ID inválido" }

  const parsed = employeeSchema.partial().safeParse(form)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await supabase
    .from("employees")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id)

  if (error) return { success: false, error: error.message }
  await revalidateEmployees()
  return { success: true }
}

export async function getOvertimeAprobado() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("overtime_requests")
    .select("employee_id, hours, status")
    .eq("status", "approved")
  if (error) throw error
  return data ?? []
}

export async function deleteEmployee(id: string) {
  const idParsed = idSchema.safeParse(id)
  if (!idParsed.success) return { success: false, error: "ID inválido" }

  const supabase = await createClient()
  const { error } = await supabase
    .from("employees")
    .delete()
    .eq("id", id)

  if (error) return { success: false, error: error.message }
  await revalidateEmployees()
  return { success: true }
}