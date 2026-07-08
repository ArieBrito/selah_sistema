"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

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
  await prisma.configuracion.upsert({
    where: { id: 1 },
    update: data,
    create: { id: 1, ...data },
  });
  revalidatePath("/produccion/configuracion");
  revalidatePath("/produccion/calculadora");
  return { ok: true as const };
}

export async function crearTipoHilo(values: z.infer<typeof tipoHiloSchema>) {
  const data = tipoHiloSchema.parse(values);
  await prisma.tipoHilo.create({ data });
  revalidatePath("/produccion/configuracion");
  revalidatePath("/produccion/calculadora");
  return { ok: true as const };
}

export async function actualizarTipoHilo(id: number, values: z.infer<typeof tipoHiloSchema>) {
  const data = tipoHiloSchema.parse(values);
  await prisma.tipoHilo.update({ where: { id_tipo_hilo: id }, data });
  revalidatePath("/produccion/configuracion");
  revalidatePath("/produccion/calculadora");
  return { ok: true as const };
}
