"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidateEmployees } from "@/lib/actions/revalidate"

type CreateEmployeeResult =
  | { success: true }
  | { success: false; error: string };

export async function createEmployee(
  formData: FormData
): Promise<CreateEmployeeResult> {
  const supabase = await createClient();

  const { data: companyId } = await supabase.rpc("get_user_company");

  if (!companyId) {
    return { success: false, error: "No se pudo identificar la empresa." };
  }

  const firstName = formData.get("first_name") as string;
  const lastName = formData.get("last_name") as string;
  const rut = formData.get("rut") as string;
  const address = formData.get("address") as string;
  const position = formData.get("position") as string;
  const departmentId = formData.get("department_id") as string;
  const hourRate = formData.get("hour_rate") as string;

  // Validación básica en servidor (nunca confíes solo en validación del cliente)
  if (!firstName || !lastName || !rut || !address) {
    return { success: false, error: "Faltan campos obligatorios." };
  }

  const { error } = await supabase.from("employees").insert({
    company_id: companyId,
    first_name: firstName,
    last_name: lastName,
    rut: rut,
    address: address,
    position: position || null,
    department_id: departmentId || null,
    hour_rate: hourRate ? Number(hourRate) : null,
  });

  if (error) {
    // RUT duplicado, por ejemplo, si tienes una constraint UNIQUE
    if (error.code === "23505") {
      return { success: false, error: "Ya existe un empleado con ese RUT." };
    }
    return { success: false, error: error.message };
  }

  await revalidateEmployees(); // Revalida la caché de empleados después de crear uno nuevo
  return { success: true };
}