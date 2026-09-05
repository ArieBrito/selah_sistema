"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import { gastoFormSchema, type GastoFormValues } from "@/lib/validations";
import { requerirAdmin } from "@/lib/auth";

export async function crearGasto(values: GastoFormValues) {
  await requerirAdmin();

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
  await requerirAdmin();

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
  await requerirAdmin();

  const { error } = await supabase.from("gastos").delete().eq("id_gasto", id_gasto);
  if (error) throw new Error(error.message);

  revalidatePath("/produccion/gastos");
  revalidatePath("/ventas/seguimiento");
  return { ok: true as const };
}
