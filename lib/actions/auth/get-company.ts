import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function getCompanyId() {
  const supabase = await createClient();

  const { data: companyId, error } = await supabase.rpc("get_user_company");

  if (error || !companyId) {
    redirect("/login");
  }

  return companyId;
}