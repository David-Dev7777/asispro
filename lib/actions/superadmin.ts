"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const SUPERADMIN_EMAIL = process.env.EMAIL_SUPERADMIN; 

type CreateCompanyResult =
  | { success: true }
  | { success: false; error: string };

export async function createCompanyWithAdmin(
  formData: FormData
): Promise<CreateCompanyResult> {
  // 1. Verificar que quien llama esto eres tú
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== SUPERADMIN_EMAIL) {
    return { success: false, error: "No autorizado." };
  }

  const companyName = formData.get("company_name") as string;
  const adminFullName = formData.get("admin_full_name") as string;
  const adminEmail = formData.get("admin_email") as string;
  const adminPassword = formData.get("admin_password") as string;

  if (!companyName || !adminFullName || !adminEmail || !adminPassword) {
    return { success: false, error: "Completa todos los campos." };
  }

  const admin = createAdminClient();

  // 2. Crear el usuario admin de la nueva empresa
  const { data: authData, error: authError } =
    await admin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true, // lo damos por confirmado, tú lo estás creando a mano
    });

  if (authError || !authData.user) {
    return {
      success: false,
      error: authError?.message ?? "No se pudo crear el usuario.",
    };
  }

  // 3. Crear la empresa
  const { data: company, error: companyError } = await admin
    .from("companies")
    .insert({ name: companyName })
    .select("id")
    .single();

  if (companyError || !company) {
    // si esto falla, el usuario de auth quedó huérfano — lo limpiamos
    await admin.auth.admin.deleteUser(authData.user.id);
    return { success: false, error: "No se pudo crear la empresa." };
  }

  // 4. Crear el profile, vinculando todo, como admin de esa empresa
  const { error: profileError } = await admin.from("profiles").insert({
    id: authData.user.id,
    company_id: company.id,
    full_name: adminFullName,
    role: "admin",
  });

  if (profileError) {
    // rollback manual: limpiamos lo que alcanzamos a crear
    await admin.auth.admin.deleteUser(authData.user.id);
    await admin.from("companies").delete().eq("id", company.id);
    return { success: false, error: "No se pudo crear el perfil del admin." };
  }

  return { success: true };
}