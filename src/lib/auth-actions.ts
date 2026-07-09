"use server";

import { redirect } from "next/navigation";
import { loginFormSchema, type LoginFormValues } from "@/lib/validations";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function login(values: LoginFormValues) {
  const data = loginFormSchema.parse(values);
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) {
    return { ok: false as const, error: "Correo o contraseña incorrectos." };
  }

  return { ok: true as const };
}

export async function logout() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
