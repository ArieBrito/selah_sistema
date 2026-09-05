"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import { cobroFormSchema, entregaFormSchema, type CobroFormValues, type EntregaFormValues } from "@/lib/validations";
import { requerirAdmin } from "@/lib/auth";

function revalidar() {
  revalidatePath("/ventas/seguimiento");
  revalidatePath("/ventas");
  revalidatePath("/dashboard");
}

export async function registrarCobro(values: CobroFormValues) {
  await requerirAdmin();

  const data = cobroFormSchema.parse(values);

  const { error } = await supabase.from("cobros").insert({
    id_venta: data.id_venta,
    fecha: data.fecha,
    monto: data.monto,
    id_metodo: data.id_metodo ?? null,
    nota: data.nota || null,
  });
  if (error) throw new Error(error.message);

  revalidar();
  return { ok: true as const };
}

export async function eliminarCobro(id_cobro: number) {
  await requerirAdmin();

  const { error } = await supabase.from("cobros").delete().eq("id_cobro", id_cobro);
  if (error) throw new Error(error.message);

  revalidar();
  return { ok: true as const };
}

export async function guardarEntrega(values: EntregaFormValues) {
  await requerirAdmin();

  const data = entregaFormSchema.parse(values);
  const fila = {
    fecha: data.fecha,
    concepto: data.concepto,
    monto: data.monto,
    nota: data.nota || null,
  };

  const { error } = data.id
    ? await supabase.from("entregas").update(fila).eq("id_entrega", data.id)
    : await supabase.from("entregas").insert(fila);
  if (error) throw new Error(error.message);

  revalidar();
  return { ok: true as const };
}

export async function eliminarEntrega(id_entrega: number) {
  await requerirAdmin();

  const { error } = await supabase.from("entregas").delete().eq("id_entrega", id_entrega);
  if (error) throw new Error(error.message);

  revalidar();
  return { ok: true as const };
}
