"use server"
import { revalidatePath, revalidateTag as nextRevalidateTag } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function getCompanyId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single()
  return profile?.company_id ?? null
}

export async function revalidateEmployees() {
  const companyId = await getCompanyId()
  if (companyId) nextRevalidateTag(`employees-${companyId}`, "default")
  revalidatePath("/admin/empleados")
  revalidatePath("/empleados", "layout") 
}

export async function revalidateDepartments() {
  const companyId = await getCompanyId()
  if (companyId) nextRevalidateTag(`departments-${companyId}`, "default")
  revalidatePath("/admin/areas")
  revalidatePath("/admin/empleados")
}

export async function revalidateOvertime(userId?: string) {
  const companyId = await getCompanyId()
  if (companyId) nextRevalidateTag(`overtime-${companyId}`, "default")
  if (userId) nextRevalidateTag(`overtime-${userId}`, "default")
  revalidatePath("/admin/horas-extras")
  revalidatePath("/empleados")
}

export async function revalidateVacations(userId?: string) {
  const companyId = await getCompanyId()
  if (companyId) nextRevalidateTag(`vacations-${companyId}`, "default")
  if (userId) nextRevalidateTag(`vacations-${userId}`, "default")
  revalidatePath("/admin/vacaciones")
  revalidatePath("/empleados")
}

export async function revalidateAttendance(userId: string) {
  nextRevalidateTag(`attendance-${userId}`, "default")
  revalidatePath("/empleados")
}

export async function revalidateJornada() {
  const companyId = await getCompanyId()
  if (companyId) nextRevalidateTag(`jornada-${companyId}`, "default")
  revalidatePath("/admin/jornada")
}