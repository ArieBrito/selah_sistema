"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

function isForeignKeyViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: string }).code === "P2003";
}

export async function eliminarProducto(id_producto: number) {
  try {
    await prisma.producto.delete({ where: { id_producto } });
  } catch (error) {
    if (isForeignKeyViolation(error)) {
      const producciones = await prisma.produccion.count({ where: { id_producto } });
      return {
        ok: false as const,
        error:
          producciones > 0
            ? `Este producto tiene ${producciones} registro${producciones === 1 ? "" : "s"} de producción, no se puede eliminar. Puedes desactivarlo.`
            : "No se puede eliminar este producto porque está en uso.",
      };
    }
    throw error;
  }

  revalidatePath("/produccion/productos");
  revalidatePath("/produccion/calculadora");
  return { ok: true as const };
}

export async function cambiarActivoProducto(id_producto: number, activo: boolean) {
  await prisma.producto.update({ where: { id_producto }, data: { activo } });
  revalidatePath("/produccion/productos");
  revalidatePath("/produccion/calculadora");
  return { ok: true as const };
}
