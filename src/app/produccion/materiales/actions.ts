"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { materialFormSchema, proveedorFormSchema, type MaterialFormValues } from "@/lib/validations";

function isForeignKeyViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: string }).code === "P2003";
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: string }).code === "P2002";
}

function calcularCostoUnitario(data: MaterialFormValues): number | null {
  if (!data.piezas_por_tira) return null;
  return data.costo_tira / data.piezas_por_tira;
}

export async function crearMaterial(values: MaterialFormValues) {
  const data = materialFormSchema.parse(values);
  const costo_unitario = calcularCostoUnitario(data);

  try {
    await prisma.material.create({
      data: {
        id_material: data.id_material,
        nombre: data.nombre || null,
        descripcion: data.descripcion || null,
        largo_mm: data.largo_mm ?? null,
        ancho_mm: data.ancho_mm ?? null,
        costo_tira: data.costo_tira,
        piezas_por_tira: data.piezas_por_tira ?? null,
        costo_unitario,
        stock_piezas: data.stock_piezas,
        id_proveedor: data.id_proveedor ?? null,
      },
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { ok: false as const, error: `Ya existe un material con el código "${data.id_material}".` };
    }
    throw error;
  }

  revalidatePath("/produccion/materiales");
  revalidatePath("/produccion/calculadora");
  return { ok: true as const };
}

export async function actualizarMaterial(id_material: string, values: MaterialFormValues) {
  const data = materialFormSchema.parse(values);
  const costo_unitario = calcularCostoUnitario(data);

  await prisma.material.update({
    where: { id_material },
    data: {
      nombre: data.nombre || null,
      descripcion: data.descripcion || null,
      largo_mm: data.largo_mm ?? null,
      ancho_mm: data.ancho_mm ?? null,
      costo_tira: data.costo_tira,
      piezas_por_tira: data.piezas_por_tira ?? null,
      costo_unitario,
      stock_piezas: data.stock_piezas,
      id_proveedor: data.id_proveedor ?? null,
    },
  });

  revalidatePath("/produccion/materiales");
  revalidatePath("/produccion/calculadora");
  return { ok: true as const };
}

export async function eliminarMaterial(id_material: string) {
  try {
    await prisma.material.delete({ where: { id_material } });
  } catch (error) {
    if (isForeignKeyViolation(error)) {
      const [enDisenos, enCompras] = await Promise.all([
        prisma.productoMaterial.count({ where: { id_material } }),
        prisma.compraDetalle.count({ where: { id_material } }),
      ]);
      const usos: string[] = [];
      if (enDisenos > 0) usos.push(`${enDisenos} diseño${enDisenos === 1 ? "" : "s"}`);
      if (enCompras > 0) usos.push(`${enCompras} compra${enCompras === 1 ? "" : "s"}`);
      return {
        ok: false as const,
        error: `Este material se usa en ${usos.join(" y ")}, no se puede eliminar.`,
      };
    }
    throw error;
  }

  revalidatePath("/produccion/materiales");
  revalidatePath("/produccion/calculadora");
  return { ok: true as const };
}

export async function crearProveedor(nombre: string) {
  const data = proveedorFormSchema.parse({ nombre });
  const proveedor = await prisma.proveedor.create({ data });
  revalidatePath("/produccion/materiales");
  revalidatePath("/produccion/compras");
  return { ok: true as const, proveedor };
}
