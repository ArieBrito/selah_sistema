"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import { registroProduccionFormSchema, type RegistroProduccionFormValues } from "@/lib/validations";

export async function crearRegistroProduccion(values: RegistroProduccionFormValues) {
  const data = registroProduccionFormSchema.parse(values);

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
  const { error } = await supabase.from("produccion").delete().eq("id_produccion", id_produccion);
  if (error) throw new Error(error.message);

  revalidatePath("/registro-pulseras");
  return { ok: true as const };
}
