"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { supabase } from "@/lib/supabase";

const costosFijosSchema = z.object({
  costo_mano_obra: z.coerce.number().min(0),
  costo_empaque: z.coerce.number().min(0),
  costo_pago_hermana: z.coerce.number().min(0),
});

const tipoHiloSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  costo: z.coerce.number().min(0, "No puede ser negativo"),
});

export async function actualizarCostosFijos(values: z.infer<typeof costosFijosSchema>) {
  const data = costosFijosSchema.parse(values);
  const { error } = await supabase.from("configuracion").upsert({ id: 1, ...data });
  if (error) throw new Error(error.message);
  revalidatePath("/produccion/configuracion");
  revalidatePath("/produccion/calculadora");
  return { ok: true as const };
}

export async function crearTipoHilo(values: z.infer<typeof tipoHiloSchema>) {
  const data = tipoHiloSchema.parse(values);
  const { error } = await supabase.from("tipos_hilo").insert(data);
  if (error) throw new Error(error.message);
  revalidatePath("/produccion/configuracion");
  revalidatePath("/produccion/calculadora");
  return { ok: true as const };
}

export async function actualizarTipoHilo(id: number, values: z.infer<typeof tipoHiloSchema>) {
  const data = tipoHiloSchema.parse(values);
  const { error } = await supabase.from("tipos_hilo").update(data).eq("id_tipo_hilo", id);
  if (error) throw new Error(error.message);
  revalidatePath("/produccion/configuracion");
  revalidatePath("/produccion/calculadora");
  return { ok: true as const };
}
