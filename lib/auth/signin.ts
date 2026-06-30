"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type LoginResult = { success: false; error: string } | never;

export async function login(formData: FormData): Promise<LoginResult> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, error: "Completa email y contraseña." };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, error: "Credenciales incorrectas." };
  }

  redirect("/empleados"); // o "/dashboard" según tu ruta principal
}