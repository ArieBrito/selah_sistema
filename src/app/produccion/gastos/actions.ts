"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import { gastoFormSchema, type GastoFormValues } from "@/lib/validations";

export async function crearGasto(values: GastoFormValues) {
  const data = gastoFormSchema.parse(values);

  const { error } = await supabase.from("gastos").insert({
    fecha: data.fecha,
    id_tipo_gasto: data.id_tipo_gasto,
    descripcion: data.descripcion || null,
    monto: data.monto,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/produccion/gastos");
  revalidatePath("/ventas/seguimiento");
  return { ok: true as const };
}

export async function actualizarGasto(id_gasto: number, values: GastoFormValues) {
  const data = gastoFormSchema.parse(values);

  const { error } = await supabase
    .from("gastos")
    .update({
      fecha: data.fecha,
      id_tipo_gasto: data.id_tipo_gasto,
      descripcion: data.descripcion || null,
      monto: data.monto,
    })
    .eq("id_gasto", id_gasto);
  if (error) throw new Error(error.message);

  revalidatePath("/produccion/gastos");
  revalidatePath("/ventas/seguimiento");
  return { ok: true as const };
}

export async function eliminarGasto(id_gasto: number) {
  const { error } = await supabase.from("gastos").delete().eq("id_gasto", id_gasto);
  if (error) throw new Error(error.message);

  revalidatePath("/produccion/gastos");
  revalidatePath("/ventas/seguimiento");
  return { ok: true as const };
}
