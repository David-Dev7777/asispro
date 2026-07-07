// app/(auth)/onboarding/page.tsx
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { OnboardingEmployeeForm } from "./onboarding-employee-form"
import { OnboardingAdminForm } from "./onboarding-admin-form"

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, onboarding_completed")
    .eq("id", user.id)
    .single()

  if (!profile) redirect("/login")

  // Si ya completó el onboarding, no debería estar acá (el middleware ya lo
  // cubre, pero esta es una segunda barrera por si alguien entra directo a la URL)
  if (profile.onboarding_completed) {
    redirect(profile.role === "admin" ? "/admin" : "/empleados")
  }

  return profile.role === "admin" ? <OnboardingAdminForm /> : <OnboardingEmployeeForm />
}