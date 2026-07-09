"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
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

  const [contexto, { data: materialesUsados }, { data: categoriaPulsera }, { data: productoExistente }] = await Promise.all([
    obtenerContextoPrecios(),
    supabase
      .from("materiales")
      .select("id_material, costo_unitario")
      .in("id_material", data.lineas.map((l) => l.id_material)),
    supabase.from("categorias").select("id_categoria").eq("nombre", "Pulsera").maybeSingle(),
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

  const precioFinal = calcularPrecioFinal(precioEscalera, productoExistente ? Number(productoExistente.precio) : undefined);
  const costoFijoTotal = contexto.fijos.costo_mano_obra + contexto.fijos.costo_empaque + contexto.fijos.costo_pago_hermana;

  const { data: id_producto, error } = await supabase.rpc("guardar_diseno", {
    p_id_producto: data.id ?? null,
    p_nombre: data.nombre,
    p_id_categoria: categoriaPulsera?.id_categoria ?? null,
    p_id_clasif: id_clasif,
    p_id_tipo_hilo: data.id_tipo_hilo,
    p_precio: precioFinal,
    p_costo_mano_obra: costoFijoTotal,
    p_lineas: data.lineas.map((l) => ({ id_material: l.id_material, cantidad: l.cantidad })),
  });
  if (error) throw new Error(error.message);

  revalidatePath("/produccion/calculadora");
  return { ok: true as const, id: id_producto as number };
}
