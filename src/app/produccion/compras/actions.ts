"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import { compraFormSchema, empleadoFormSchema, type CompraFormValues } from "@/lib/validations";
import { requerirAdmin } from "@/lib/auth";

export async function crearCompra(values: CompraFormValues) {
  await requerirAdmin();

  const data = compraFormSchema.parse(values);
  const total = data.lineas.reduce((suma, l) => suma + l.cantidad * l.costo_unit, 0);

  const { error } = await supabase.rpc("crear_compra", {
    p_ticket: data.ticket || null,
    p_fecha: data.fecha,
    p_id_proveedor: data.id_proveedor ?? null,
    p_id_metodo: data.id_metodo ?? null,
    p_id_empleado: data.id_empleado ?? null,
    p_total: total,
    p_detalle: data.lineas.map((l) => ({ id_material: l.id_material, cantidad: l.cantidad, costo_unit: l.costo_unit })),
  });
  if (error) throw new Error(error.message);

  revalidatePath("/produccion/compras");
  revalidatePath("/");
  return { ok: true as const };
}

export async function actualizarCompra(id_compra: number, values: CompraFormValues) {
  await requerirAdmin();

  const data = compraFormSchema.parse(values);
  const total = data.lineas.reduce((suma, l) => suma + l.cantidad * l.costo_unit, 0);

  const { error } = await supabase.rpc("actualizar_compra", {
    p_id_compra: id_compra,
    p_ticket: data.ticket || null,
    p_fecha: data.fecha,
    p_id_proveedor: data.id_proveedor ?? null,
    p_id_metodo: data.id_metodo ?? null,
    p_id_empleado: data.id_empleado ?? null,
    p_total: total,
    p_detalle: data.lineas.map((l) => ({ id_material: l.id_material, cantidad: l.cantidad, costo_unit: l.costo_unit })),
  });
  if (error) throw new Error(error.message);

  revalidatePath("/produccion/compras");
  revalidatePath("/");
  return { ok: true as const };
}

export async function eliminarCompra(id_compra: number) {
  await requerirAdmin();

  const { error: detalleError } = await supabase.from("compra_detalle").delete().eq("id_compra", id_compra);
  if (detalleError) throw new Error(detalleError.message);

  const { error } = await supabase.from("compras").delete().eq("id_compra", id_compra);
  if (error) throw new Error(error.message);

  revalidatePath("/produccion/compras");
  revalidatePath("/");
  return { ok: true as const };
}

export async function crearEmpleado(nombre: string) {
  await requerirAdmin();

  const data = empleadoFormSchema.parse({ nombre });
  const { data: empleado, error } = await supabase.from("empleados").insert(data).select().single();
  if (error) throw new Error(error.message);
  revalidatePath("/produccion/compras");
  return { ok: true as const, empleado };
}
