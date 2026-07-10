"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import { materialFormSchema, proveedorFormSchema, type MaterialFormValues } from "@/lib/validations";

function calcularCostoUnitario(data: MaterialFormValues): number | null {
  if (!data.piezas_por_tira) return null;
  return data.costo_tira / data.piezas_por_tira;
}

export async function crearMaterial(values: MaterialFormValues) {
  const data = materialFormSchema.parse(values);
  const costo_unitario = calcularCostoUnitario(data);

  const { error } = await supabase.from("materiales").insert({
    id_material: data.id_material,
    nombre: data.nombre || null,
    categoria: data.categoria,
    descripcion: data.descripcion || null,
    largo_mm: data.largo_mm ?? null,
    ancho_mm: data.ancho_mm ?? null,
    costo_tira: data.costo_tira,
    piezas_por_tira: data.piezas_por_tira ?? null,
    costo_unitario,
    stock_piezas: data.stock_piezas,
    id_proveedor: data.id_proveedor ?? null,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false as const, error: `Ya existe un material con el código "${data.id_material}".` };
    }
    throw new Error(error.message);
  }

  revalidatePath("/produccion/materiales");
  revalidatePath("/produccion/calculadora");
  revalidatePath("/produccion/calculadora/nuevo");
  revalidatePath("/produccion/calculadora/[id]", "page");
  return { ok: true as const };
}

export async function actualizarMaterial(id_material: string, values: MaterialFormValues) {
  const data = materialFormSchema.parse(values);
  const costo_unitario = calcularCostoUnitario(data);

  const { error } = await supabase
    .from("materiales")
    .update({
      nombre: data.nombre || null,
      categoria: data.categoria,
      descripcion: data.descripcion || null,
      largo_mm: data.largo_mm ?? null,
      ancho_mm: data.ancho_mm ?? null,
      costo_tira: data.costo_tira,
      piezas_por_tira: data.piezas_por_tira ?? null,
      costo_unitario,
      stock_piezas: data.stock_piezas,
      id_proveedor: data.id_proveedor ?? null,
    })
    .eq("id_material", id_material);

  if (error) throw new Error(error.message);

  revalidatePath("/produccion/materiales");
  revalidatePath("/produccion/calculadora");
  revalidatePath("/produccion/calculadora/nuevo");
  revalidatePath("/produccion/calculadora/[id]", "page");
  return { ok: true as const };
}

export async function eliminarMaterial(id_material: string) {
  const { error } = await supabase.from("materiales").delete().eq("id_material", id_material);

  if (error) {
    if (error.code === "23503") {
      const [{ count: enDisenos }, { count: enCompras }] = await Promise.all([
        supabase.from("producto_materiales").select("*", { count: "exact", head: true }).eq("id_material", id_material),
        supabase.from("compra_detalle").select("*", { count: "exact", head: true }).eq("id_material", id_material),
      ]);
      const usos: string[] = [];
      if ((enDisenos ?? 0) > 0) usos.push(`${enDisenos} diseño${enDisenos === 1 ? "" : "s"}`);
      if ((enCompras ?? 0) > 0) usos.push(`${enCompras} compra${enCompras === 1 ? "" : "s"}`);
      return {
        ok: false as const,
        error: `Este material se usa en ${usos.join(" y ")}, no se puede eliminar.`,
      };
    }
    throw new Error(error.message);
  }

  revalidatePath("/produccion/materiales");
  revalidatePath("/produccion/calculadora");
  revalidatePath("/produccion/calculadora/nuevo");
  revalidatePath("/produccion/calculadora/[id]", "page");
  return { ok: true as const };
}

export async function crearProveedor(nombre: string) {
  const data = proveedorFormSchema.parse({ nombre });
  const { data: proveedor, error } = await supabase.from("proveedores").insert(data).select().single();
  if (error) throw new Error(error.message);
  revalidatePath("/produccion/materiales");
  revalidatePath("/produccion/compras");
  return { ok: true as const, proveedor };
}
