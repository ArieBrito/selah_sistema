"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import { clienteFormSchema, ventaFormSchema, type ClienteFormValues, type VentaFormValues } from "@/lib/validations";
import { obtenerCostosProductos } from "./data";

async function construirDetalle(lineas: VentaFormValues["lineas"]) {
  const idsProducto = lineas.filter((l): l is typeof l & { id_producto: string } => l.id_producto !== null).map((l) => l.id_producto);
  const costos = await obtenerCostosProductos(idsProducto);
  return lineas.map((l) => ({
    id_producto: l.id_producto,
    nombre_manual: l.id_producto ? null : l.nombre,
    cantidad: l.cantidad,
    precio_unit: l.precio_unit,
    costo_unit_snap: l.id_producto ? costos.get(l.id_producto) ?? 0 : l.costo_unit ?? 0,
  }));
}

function calcularTotales(lineas: VentaFormValues["lineas"], descuentoPct: number) {
  const subtotal = lineas.reduce((suma, l) => suma + l.cantidad * l.precio_unit, 0);
  const descuento = subtotal * (descuentoPct / 100);
  return { descuento, total: subtotal - descuento };
}

export async function crearVenta(values: VentaFormValues) {
  const data = ventaFormSchema.parse(values);
  const { descuento, total } = calcularTotales(data.lineas, data.descuento_pct);
  const detalle = await construirDetalle(data.lineas);

  const { error } = await supabase.rpc("crear_venta", {
    p_fecha_hora: data.fecha_hora,
    p_id_cliente: data.id_cliente ?? null,
    p_tipo_venta: data.tipo_venta,
    p_id_canal: data.id_canal,
    p_id_metodo: data.id_metodo,
    p_descuento: descuento,
    p_total: total,
    p_pago_recibido: data.pago_recibido,
    p_detalle: detalle,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/ventas");
  revalidatePath("/dashboard");
  revalidatePath("/");
  return { ok: true as const };
}

export async function actualizarVenta(id_venta: number, values: VentaFormValues) {
  const data = ventaFormSchema.parse(values);
  const { descuento, total } = calcularTotales(data.lineas, data.descuento_pct);
  const detalle = await construirDetalle(data.lineas);

  const { error } = await supabase.rpc("actualizar_venta", {
    p_id_venta: id_venta,
    p_fecha_hora: data.fecha_hora,
    p_id_cliente: data.id_cliente ?? null,
    p_tipo_venta: data.tipo_venta,
    p_id_canal: data.id_canal,
    p_id_metodo: data.id_metodo,
    p_descuento: descuento,
    p_total: total,
    p_pago_recibido: data.pago_recibido,
    p_detalle: detalle,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/ventas");
  revalidatePath("/dashboard");
  revalidatePath("/");
  return { ok: true as const };
}

export async function eliminarVenta(id_venta: number) {
  const { error: detalleError } = await supabase.from("venta_detalle").delete().eq("id_venta", id_venta);
  if (detalleError) throw new Error(detalleError.message);

  const { error } = await supabase.from("ventas").delete().eq("id_venta", id_venta);
  if (error) throw new Error(error.message);

  revalidatePath("/ventas");
  revalidatePath("/dashboard");
  revalidatePath("/");
  return { ok: true as const };
}

export async function crearCliente(values: ClienteFormValues) {
  const data = clienteFormSchema.parse(values);
  const { data: cliente, error } = await supabase
    .from("clientes")
    .insert({
      nombre: data.nombre,
      apellido: data.apellido || null,
      telefono: data.telefono || null,
      es_revendedor: data.es_revendedor,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);

  revalidatePath("/ventas");
  return { ok: true as const, cliente };
}
