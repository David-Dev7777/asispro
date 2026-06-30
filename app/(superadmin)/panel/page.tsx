import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NewCompanyForm } from "./new-company-form";

const SUPERADMIN_EMAIL = process.env.EMAIL_SUPERADMIN; // 👈 mismo email que arriba

export default async function SuperadminPanel() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== SUPERADMIN_EMAIL) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-lg py-16 px-6">
      <h1 className="font-serif text-2xl">Nueva empresa</h1>
      <p className="mt-1 text-sm text-[#78716C]">
        Crea una empresa nueva y su primer usuario admin.
      </p>
      <NewCompanyForm />
    </div>
  );
}