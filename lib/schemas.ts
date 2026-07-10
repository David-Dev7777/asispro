import { z } from "zod"

// ─── Company Settings ─────────────────────────────────────────────────────────
export const companySettingsSchema = z.object({
  geo_lat:                z.number().min(-90).max(90).nullable(),
  geo_lng:                z.number().min(-180).max(180).nullable(),
  geo_radius_m:           z.number().min(50, "Radio mínimo 50m").max(5000, "Radio máximo 5000m"),
  vacation_days:          z.number().min(1).max(365),
  work_hours_day:         z.number().min(1).max(24),
  work_start_time:        z.string().regex(/^\d{2}:\d{2}$/, "Formato de hora inválido"),
  work_end_time:          z.string().regex(/^\d{2}:\d{2}$/, "Formato de hora inválido"),
  work_days:              z.array(z.enum(["monday","tuesday","wednesday","thursday","friday","saturday","sunday"])).min(1, "Selecciona al menos un día"),
  late_tolerance_minutes: z.number().min(0).max(60),
}).refine(d => d.work_start_time < d.work_end_time, {
  message: "La hora de entrada debe ser anterior a la de salida",
  path: ["work_end_time"],
})

// ─── Attendance ───────────────────────────────────────────────────────────────
export const attendanceSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
})

// ─── Overtime ─────────────────────────────────────────────────────────────────
export const overtimeSchema = z.object({
  date:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  hours:  z.number().min(0.5, "Mínimo 0.5 horas").max(12, "Máximo 12 horas"),
  reason: z.string().min(1, "El motivo es obligatorio").max(500, "Motivo demasiado largo"),
})

// ─── Vacation ─────────────────────────────────────────────────────────────────
export const vacationSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  end_date:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  notes:      z.string().max(500, "Nota demasiado larga").optional(),
}).refine(d => d.start_date <= d.end_date, {
  message: "La fecha de inicio debe ser anterior a la de término",
  path: ["end_date"],
}).refine(d => d.start_date >= new Date().toISOString().slice(0, 10), {
  message: "No puedes solicitar vacaciones en fechas pasadas",
  path: ["start_date"],
})
// ─── Work Schedule ───────────────────────────────────────────────────────────

export const workScheduleSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  work_start_time: z.string().min(1, "La hora de entrada es obligatoria"),
  work_end_time: z.string().min(1, "La hora de salida es obligatoria"),
  work_days: z.array(z.string()).min(1, "Selecciona al menos un día"),
  late_tolerance_minutes: z.number().int().min(0).max(60),
})
 

// ─── Department ───────────────────────────────────────────────────────────────
export const departmentSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(100, "Nombre demasiado largo").trim(),
})

// ─── Employee ─────────────────────────────────────────────────────────────────
export const employeeSchema = z.object({
  first_name:    z.string().min(1, "El nombre es obligatorio").max(100).trim(),
  last_name:     z.string().min(1, "El apellido es obligatorio").max(100).trim(),
  rut:           z.string().min(1, "El RUT es obligatorio").max(20).trim(),
  address:       z.string().min(1, "La dirección es obligatoria").max(200).trim(),
  position:      z.string().max(100).optional(),
  department_id: z.string().uuid().nullable().optional(),
  hire_date:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida").nullable().optional(),
  vacation_days: z.number().int().min(0).nullable().optional(),
})

// ─── Onboarding ───────────────────────────────────────────────────────────────
export const onboardingSchema = z.object({
  first_name: z.string().min(1, "El nombre es obligatorio").max(100).trim(),
  last_name:  z.string().min(1, "El apellido es obligatorio").max(100).trim(),
  rut:        z.string().min(1, "El RUT es obligatorio").max(20).trim(),
  address:    z.string().min(1, "La dirección es obligatoria").max(200).trim(),
})

// ─── Profile (crear acceso) ───────────────────────────────────────────────────
export const createProfileSchema = z.object({
  email:    z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email("Correo inválido"),
})
 
export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })
 
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

// ─── Profile (actualizar datos) ─────────────────────────────────────────────
 
export const updateEmailSchema = z.object({
  email: z.string().email("Correo inválido"),
})
 
export const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Ingresa tu contraseña actual"),
    newPassword: z.string().min(8, "La nueva contraseña debe tener al menos 8 caracteres"),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmNewPassword"],
  })
 
export const updateAdminProfileSchema = z.object({
  full_name: z.string().min(1, "El nombre es obligatorio"),
})
 
export const updateEmployeeProfileSchema = z.object({
  first_name: z.string().min(1, "El nombre es obligatorio"),
  last_name: z.string().min(1, "El apellido es obligatorio"),
  rut: z.string().min(1, "El RUT es obligatorio"),
  address: z.string().min(1, "La dirección es obligatoria"),
})
 
