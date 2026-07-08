"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { buscarClasificacion, calcularCostoCargado, calcularCostoMateriales, calcularPrecioFinal } from "@/lib/pricing";
import { obtenerContextoPrecios } from "./data";

const disenoSchema = z.object({
  id: z.number().int().positive().optional(),
  nombre: z.string().trim().min(1, "El nombre del diseño es obligatorio"),
  id_tipo_hilo: z.number().int().positive(),
  lineas: z
    .array(z.object({ id_material: z.string().min(1), cantidad: z.coerce.number().positive() }))
    .min(1, "Agrega al menos un material"),
  precioManual: z.coerce.number().min(0).optional(),
});

export type DisenoInput = z.infer<typeof disenoSchema>;

export async function guardarDiseno(input: DisenoInput) {
  const data = disenoSchema.parse(input);

  const [contexto, materialesUsados, categoriaPulsera, productoExistente] = await Promise.all([
    obtenerContextoPrecios(),
    prisma.material.findMany({ where: { id_material: { in: data.lineas.map((l) => l.id_material) } } }),
    prisma.categoria.findFirst({ where: { nombre: "Pulsera" } }),
    data.id ? prisma.producto.findUnique({ where: { id_producto: data.id } }) : null,
  ]);

  const tipoHilo = contexto.tiposHilo.find((t) => t.id === data.id_tipo_hilo);
  if (!tipoHilo) return { ok: false as const, error: "Selecciona un tipo de hilo válido." };

  const lineasConCosto = data.lineas.map((l) => {
    const material = materialesUsados.find((m) => m.id_material === l.id_material)!;
    return { ...l, costoUnitario: material.costo_unitario?.toNumber() ?? 0 };
  });

  const costoMateriales = calcularCostoMateriales(
    lineasConCosto.map((l) => ({ cantidad: l.cantidad, costoUnitario: l.costoUnitario }))
  );
  const costoCargado = calcularCostoCargado(costoMateriales, tipoHilo.costo, contexto.fijos);
  const nivel = buscarClasificacion(costoCargado, contexto.niveles);

  let id_clasif: string;
  let precioEscalera: number;
  if (nivel) {
    id_clasif = nivel.id_clasif;
    precioEscalera = nivel.precio_tarifa;
  } else {
    if (data.precioManual === undefined) {
      return { ok: false as const, error: "Este diseño no cabe en la escalera estándar: define un precio manual." };
    }
    id_clasif = "M";
    precioEscalera = data.precioManual;
  }

  const precioFinal = calcularPrecioFinal(precioEscalera, productoExistente?.precio.toNumber());
  const costoFijoTotal = contexto.fijos.costo_mano_obra + contexto.fijos.costo_empaque + contexto.fijos.costo_pago_hermana;

  const producto = await prisma.$transaction(async (tx) => {
    const guardado = await tx.producto.upsert({
      where: { id_producto: data.id ?? 0 },
      update: {
        nombre: data.nombre,
        id_tipo_hilo: data.id_tipo_hilo,
        id_clasif,
        precio: precioFinal,
        costo_mano_obra: costoFijoTotal,
      },
      create: {
        nombre: data.nombre,
        id_tipo_hilo: data.id_tipo_hilo,
        id_categoria: categoriaPulsera?.id_categoria,
        id_clasif,
        precio: precioFinal,
        costo_mano_obra: costoFijoTotal,
      },
    });

    await tx.productoMaterial.deleteMany({ where: { id_producto: guardado.id_producto } });
    await tx.productoMaterial.createMany({
      data: data.lineas.map((l) => ({ id_producto: guardado.id_producto, id_material: l.id_material, cantidad: l.cantidad })),
    });

    return guardado;
  });

  revalidatePath("/produccion/calculadora");
  return { ok: true as const, id: producto.id_producto };
}
