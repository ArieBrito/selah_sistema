"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import { registroProduccionFormSchema, type RegistroProduccionFormValues } from "@/lib/validations";
import { requerirSesion } from "@/lib/auth";

/** El administrador captura por cualquiera; el usuario, solo por sí mismo. */
async function exigirEmpleadoPropio(idEmpleado: number) {
  const sesion = await requerirSesion();
  if (sesion.rol === "admin") return;
  if (sesion.idEmpleado === null || sesion.idEmpleado !== idEmpleado) {
    throw new Error("Solo puedes registrar tus propias pulseras.");
  }
}

/** Verifica que el registro que se va a tocar sea del propio usuario. */
async function exigirRegistroPropio(id_produccion: number) {
  const { data: registro } = await supabase
    .from("produccion")
    .select("id_empleado")
    .eq("id_produccion", id_produccion)
    .maybeSingle();
  if (!registro) throw new Error("El registro ya no existe.");
  await exigirEmpleadoPropio(registro.id_empleado);
}

export async function crearRegistroProduccion(values: RegistroProduccionFormValues) {
  const data = registroProduccionFormSchema.parse(values);
  await exigirEmpleadoPropio(data.id_empleado);

  const { data: configuracion } = await supabase.from("configuracion").upsert({ id: 1 }).select("costo_mano_obra").single();
  const costoManoObra = Number(configuracion?.costo_mano_obra ?? 0);

  const { error } = await supabase.from("produccion").insert({
    fecha: data.fecha,
    id_empleado: data.id_empleado,
    id_producto: data.id_producto,
    cantidad: data.cantidad,
    minutos: data.minutos ?? null,
    costo_mo_lote: data.cantidad * costoManoObra,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/registro-pulseras");
  return { ok: true as const };
}

export async function actualizarRegistroProduccion(id_produccion: number, values: RegistroProduccionFormValues) {
  const data = registroProduccionFormSchema.parse(values);
  await exigirRegistroPropio(id_produccion);
  await exigirEmpleadoPropio(data.id_empleado);

  const { data: configuracion } = await supabase.from("configuracion").upsert({ id: 1 }).select("costo_mano_obra").single();
  const costoManoObra = Number(configuracion?.costo_mano_obra ?? 0);

  const { error } = await supabase
    .from("produccion")
    .update({
      fecha: data.fecha,
      id_empleado: data.id_empleado,
      id_producto: data.id_producto,
      cantidad: data.cantidad,
      minutos: data.minutos ?? null,
      costo_mo_lote: data.cantidad * costoManoObra,
    })
    .eq("id_produccion", id_produccion);
  if (error) throw new Error(error.message);

  revalidatePath("/registro-pulseras");
  return { ok: true as const };
}

export async function eliminarRegistroProduccion(id_produccion: number) {
  await exigirRegistroPropio(id_produccion);

  const { error } = await supabase.from("produccion").delete().eq("id_produccion", id_produccion);
  if (error) throw new Error(error.message);

  revalidatePath("/registro-pulseras");
  return { ok: true as const };
}
