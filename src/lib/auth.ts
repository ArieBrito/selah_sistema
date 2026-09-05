import { cache } from "react";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export type Rol = "admin" | "usuario";

export type Sesion = {
  userId: string;
  email: string;
  rol: Rol;
  /** Empleado con el que se capturan sus pulseras; null si nadie lo ligó todavía. */
  idEmpleado: number | null;
};

/**
 * Sesión activa con su rol. Se cachea por petición porque la consultan el
 * layout, la página y las acciones dentro del mismo render.
 */
export const obtenerSesion = cache(async (): Promise<Sesion | null> => {
  const cliente = await createSupabaseServerClient();
  const {
    data: { user },
  } = await cliente.auth.getUser();
  if (!user) return null;

  const { data: perfil } = await supabase.from("perfiles").select("rol, id_empleado").eq("id", user.id).maybeSingle();

  return {
    userId: user.id,
    email: user.email ?? "",
    rol: perfil?.rol === "admin" ? "admin" : "usuario",
    idEmpleado: perfil?.id_empleado ?? null,
  };
});

export async function esAdmin() {
  const sesion = await obtenerSesion();
  return sesion?.rol === "admin";
}

/**
 * Corta la ejecución si quien llama no es administrador. Va dentro de cada
 * acción de servidor sensible: el proxy solo filtra navegación, y las acciones
 * corren con la clave de servicio, que se salta RLS.
 */
export async function requerirAdmin(): Promise<Sesion> {
  const sesion = await obtenerSesion();
  if (!sesion) throw new Error("Necesitas iniciar sesión.");
  if (sesion.rol !== "admin") throw new Error("No tienes permiso para hacer esto.");
  return sesion;
}

/** Igual que `requerirAdmin`, pero para páginas: manda al área que sí le toca. */
export async function requerirAdminEnPagina(): Promise<Sesion> {
  const sesion = await obtenerSesion();
  if (!sesion) redirect("/login");
  if (sesion.rol !== "admin") redirect("/registro-pulseras");
  return sesion;
}

export async function requerirSesion(): Promise<Sesion> {
  const sesion = await obtenerSesion();
  if (!sesion) throw new Error("Necesitas iniciar sesión.");
  return sesion;
}
