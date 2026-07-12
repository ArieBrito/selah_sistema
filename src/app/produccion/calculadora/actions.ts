"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { buscarClasificacion, calcularCostoCargado, calcularCostoMateriales, calcularPrecioFinal } from "@/lib/pricing";
import { obtenerContextoPrecios } from "./data";

const disenoSchema = z
  .object({
    id: z.string().length(7).optional(),
    nombre: z.string().trim().min(1, "El nombre del diseño es obligatorio"),
    descripcion: z.string().trim().optional(),
    id_categoria: z.number().int().positive("Selecciona una categoría"),
    id_tipo_hilo: z.number().int().positive(),
    lineas: z
      .array(z.object({ id_material: z.string().min(1), cantidad: z.coerce.number().positive() }))
      .min(1, "Agrega al menos un material"),
    precioManual: z.coerce.number().min(0).optional(),
    id_tamano: z.number().int().min(1).max(4).optional(),
    stockPiezas: z.coerce.number().int().min(0).optional(),
    tallas: z
      .array(z.object({ id_tamano: z.number().int().min(1).max(4), stockPiezas: z.coerce.number().int().min(0) }))
      .optional(),
  })
  .refine((d) => (d.id ? d.id_tamano !== undefined && d.stockPiezas !== undefined : (d.tallas?.length ?? 0) >= 1), {
    message: "Selecciona al menos una talla",
  });

export type DisenoInput = z.infer<typeof disenoSchema>;

export async function guardarDiseno(input: DisenoInput) {
  const data = disenoSchema.parse(input);

  const [contexto, { data: materialesUsados }, { data: productoExistente }] = await Promise.all([
    obtenerContextoPrecios(),
    supabase
      .from("materiales")
      .select("id_material, costo_unitario")
      .in("id_material", data.lineas.map((l) => l.id_material)),
    data.id
      ? supabase.from("productos").select("precio").eq("id_producto", data.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const tipoHilo = contexto.tiposHilo.find((t) => t.id === data.id_tipo_hilo);
  if (!tipoHilo) return { ok: false as const, error: "Selecciona un tipo de hilo válido." };

  const lineasConCosto = data.lineas.map((l) => {
    const material = materialesUsados!.find((m) => m.id_material === l.id_material)!;
    return { ...l, costoUnitario: Number(material.costo_unitario ?? 0) };
  });

  const costoMateriales = calcularCostoMateriales(
    lineasConCosto.map((l) => ({ cantidad: l.cantidad, costoUnitario: l.costoUnitario }))
  );
  const costoCargado = calcularCostoCargado(costoMateriales, tipoHilo.costo, contexto.fijos);
  const nivel = buscarClasificacion(costoCargado, contexto.niveles);

  let id_clasif: string;
  let precioEscalera: number;
  if (data.precioManual !== undefined) {
    id_clasif = "M";
    precioEscalera = data.precioManual;
  } else if (nivel) {
    id_clasif = nivel.id_clasif;
    precioEscalera = nivel.precio_tarifa;
  } else {
    return { ok: false as const, error: "Este diseño no cabe en la escalera estándar: define un precio manual." };
  }

  const precioFinal = calcularPrecioFinal(precioEscalera, productoExistente ? Number(productoExistente.precio) : undefined);
  const costoFijoTotal = contexto.fijos.costo_mano_obra + contexto.fijos.costo_empaque + contexto.fijos.costo_pago_hermana;
  const lineasRpc = data.lineas.map((l) => ({ id_material: l.id_material, cantidad: l.cantidad }));

  if (data.id) {
    const { data: id_producto, error } = await supabase.rpc("guardar_diseno", {
      p_id_producto: data.id,
      p_nombre: data.nombre,
      p_id_categoria: data.id_categoria,
      p_id_clasif: id_clasif,
      p_id_tipo_hilo: data.id_tipo_hilo,
      p_id_tamano: data.id_tamano,
      p_stock_piezas: data.stockPiezas,
      p_precio: precioFinal,
      p_costo_mano_obra: costoFijoTotal,
      p_lineas: lineasRpc,
      p_descripcion: data.descripcion || null,
    });
    if (error) throw new Error(error.message);

    revalidatePath("/produccion/calculadora");
    revalidatePath("/produccion/productos");
    return { ok: true as const, ids: [id_producto as string] };
  }

  const { data: ids, error } = await supabase.rpc("crear_diseno_variantes", {
    p_nombre: data.nombre,
    p_id_categoria: data.id_categoria,
    p_id_clasif: id_clasif,
    p_id_tipo_hilo: data.id_tipo_hilo,
    p_precio: precioFinal,
    p_costo_mano_obra: costoFijoTotal,
    p_lineas: lineasRpc,
    p_tallas: data.tallas!.map((t) => ({ id_tamano: t.id_tamano, stock_piezas: t.stockPiezas })),
    p_descripcion: data.descripcion || null,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/produccion/calculadora");
  revalidatePath("/produccion/productos");
  return { ok: true as const, ids: ids as string[] };
}

export async function crearCategoria(nombre: string) {
  const nombreLimpio = nombre.trim();
  if (!nombreLimpio) throw new Error("El nombre de la categoría es obligatorio.");

  const { data, error } = await supabase
    .from("categorias")
    .insert({ nombre: nombreLimpio })
    .select("id_categoria, nombre")
    .single();
  if (error) throw new Error(error.message);

  return data;
}
