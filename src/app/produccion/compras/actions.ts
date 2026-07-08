"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { compraFormSchema, empleadoFormSchema, type CompraFormValues } from "@/lib/validations";

export async function crearCompra(values: CompraFormValues) {
  const data = compraFormSchema.parse(values);
  const total = data.lineas.reduce((suma, l) => suma + l.cantidad * l.costo_unit, 0);

  await prisma.compra.create({
    data: {
      ticket: data.ticket || null,
      fecha: new Date(data.fecha),
      id_proveedor: data.id_proveedor ?? null,
      id_metodo: data.id_metodo ?? null,
      id_empleado: data.id_empleado ?? null,
      total,
      detalle: {
        createMany: {
          data: data.lineas.map((l) => ({ id_material: l.id_material, cantidad: l.cantidad, costo_unit: l.costo_unit })),
        },
      },
    },
  });

  revalidatePath("/produccion/compras");
  return { ok: true as const };
}

export async function actualizarCompra(id_compra: number, values: CompraFormValues) {
  const data = compraFormSchema.parse(values);
  const total = data.lineas.reduce((suma, l) => suma + l.cantidad * l.costo_unit, 0);

  await prisma.$transaction(async (tx) => {
    await tx.compra.update({
      where: { id_compra },
      data: {
        ticket: data.ticket || null,
        fecha: new Date(data.fecha),
        id_proveedor: data.id_proveedor ?? null,
        id_metodo: data.id_metodo ?? null,
        id_empleado: data.id_empleado ?? null,
        total,
      },
    });
    await tx.compraDetalle.deleteMany({ where: { id_compra } });
    await tx.compraDetalle.createMany({
      data: data.lineas.map((l) => ({ id_compra, id_material: l.id_material, cantidad: l.cantidad, costo_unit: l.costo_unit })),
    });
  });

  revalidatePath("/produccion/compras");
  return { ok: true as const };
}

export async function eliminarCompra(id_compra: number) {
  await prisma.compra.delete({ where: { id_compra } });
  revalidatePath("/produccion/compras");
  return { ok: true as const };
}

export async function crearEmpleado(nombre: string) {
  const data = empleadoFormSchema.parse({ nombre });
  const empleado = await prisma.empleado.create({ data });
  revalidatePath("/produccion/compras");
  return { ok: true as const, empleado };
}
