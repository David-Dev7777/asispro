"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { workScheduleSchema } from "@/lib/schemas"

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" as const }

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .single()

  if (!profile || !["admin", "superadmin"].includes(profile.role)) {
    return { error: "No autorizado" as const }
  }

  return { supabase, companyId: profile.company_id }
}

export async function getWorkSchedules() {
  const ctx = await requireAdmin()
  if ("error" in ctx) return []

  const { data } = await ctx.supabase
    .from("work_schedules")
    .select("*")
    .eq("company_id", ctx.companyId)
    .order("is_default", { ascending: false })
    .order("name")

  return data ?? []
}

export async function getDepartmentsForScheduling() {
  const ctx = await requireAdmin()
  if ("error" in ctx) return []

  const { data } = await ctx.supabase
    .from("departments")
    .select("id, name, schedule_id, work_schedules ( id, name )")
    .eq("company_id", ctx.companyId)
    .order("name")

  return data ?? []
}

type WorkScheduleForm = {
  name: string
  work_start_time: string
  work_end_time: string
  work_days: string[]
  late_tolerance_minutes: number
}

export async function createWorkSchedule(form: WorkScheduleForm) {
  const ctx = await requireAdmin()
  if ("error" in ctx) return { success: false, error: ctx.error }

  const parsed = workScheduleSchema.safeParse(form)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const { error } = await ctx.supabase
    .from("work_schedules")
    .insert({ ...parsed.data, company_id: ctx.companyId })

  if (error) return { success: false, error: error.message }

  revalidatePath("/admin/configuracion")
  return { success: true }
}

export async function updateWorkSchedule(id: string, form: WorkScheduleForm) {
  const ctx = await requireAdmin()
  if ("error" in ctx) return { success: false, error: ctx.error }

  const parsed = workScheduleSchema.safeParse(form)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const { error } = await ctx.supabase
    .from("work_schedules")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("company_id", ctx.companyId) // por si acaso, refuerza el aislamiento aunque RLS ya lo cubre

  if (error) return { success: false, error: error.message }

  revalidatePath("/admin/configuracion")
  return { success: true }
}

export async function deleteWorkSchedule(id: string) {
  const ctx = await requireAdmin()
  if ("error" in ctx) return { success: false, error: ctx.error }

  const { data: schedule } = await ctx.supabase
    .from("work_schedules")
    .select("is_default")
    .eq("id", id)
    .single()

  if (schedule?.is_default) {
    return { success: false, error: "No puedes eliminar la jornada por defecto" }
  }

  // Las áreas que usaban esta jornada quedan sin asignación (schedule_id null,
  // por el "on delete set null" del FK) y caen automáticamente a la jornada
  // por defecto de la empresa.
  const { error } = await ctx.supabase
    .from("work_schedules")
    .delete()
    .eq("id", id)
    .eq("company_id", ctx.companyId)

  if (error) return { success: false, error: error.message }

  revalidatePath("/admin/configuracion")
  return { success: true }
}

export async function assignDepartmentSchedule(departmentId: string, scheduleId: string | null) {
  const ctx = await requireAdmin()
  if ("error" in ctx) return { success: false, error: ctx.error }

  const { error } = await ctx.supabase
    .from("departments")
    .update({ schedule_id: scheduleId })
    .eq("id", departmentId)
    .eq("company_id", ctx.companyId)

  if (error) return { success: false, error: error.message }

  revalidatePath("/admin/configuracion")
  return { success: true }
}