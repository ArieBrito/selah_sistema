import { supabase } from "@/lib/supabase";
import { calcularCostoCargado, calcularCostoMateriales, calcularMargenReal, type NivelClasificacion } from "@/lib/pricing";

export async function obtenerContextoPrecios() {
  const [{ data: configuracion }, { data: clasificaciones }, { data: tiposHilo }, { data: materiales }] = await Promise.all([
    supabase.from("configuracion").upsert({ id: 1 }).select().single(),
    supabase.from("clasificaciones").select("id_clasif, precio_tarifa, costo_max").order("precio_tarifa"),
    supabase.from("tipos_hilo").select("id_tipo_hilo, nombre, costo").order("nombre"),
    supabase
      .from("materiales")
      .select("id_material, nombre, costo_unitario")
      .eq("categoria", "ingrediente")
      .not("costo_unitario", "is", null)
      .order("id_material"),
  ]);

  return {
    fijos: {
      costo_mano_obra: Number(configuracion!.costo_mano_obra),
      costo_empaque: Number(configuracion!.costo_empaque),
      costo_pago_hermana: Number(configuracion!.costo_pago_hermana),
    },
    niveles: (clasificaciones ?? []).map((c) => ({
      id_clasif: c.id_clasif,
      precio_tarifa: Number(c.precio_tarifa),
      costo_max: c.costo_max === null ? null : Number(c.costo_max),
    })) satisfies NivelClasificacion[],
    tiposHilo: (tiposHilo ?? []).map((t) => ({ id: t.id_tipo_hilo, nombre: t.nombre, costo: Number(t.costo) })),
    materiales: (materiales ?? []).map((m) => ({
      id_material: m.id_material,
      nombre: m.nombre ?? m.id_material,
      costoUnitario: Number(m.costo_unitario),
    })),
  };
}

type ProductoDisenoRow = {
  id_producto: number;
  nombre: string;
  precio: string;
  id_clasif: string | null;
  materiales: { cantidad: string; material: { costo_unitario: string | null } }[];
  tipo_hilo: { costo: string } | null;
};

export async function listarDisenos() {
  const [{ data: productos }, contexto] = await Promise.all([
    supabase
      .from("productos")
      .select(
        "id_producto, nombre, precio, id_clasif, materiales:producto_materiales(cantidad, material:materiales(costo_unitario)), tipo_hilo:tipos_hilo(costo)"
      )
      .order("nombre")
      .returns<ProductoDisenoRow[]>(),
    obtenerContextoPrecios(),
  ]);

  return (productos ?? []).map((p) => {
    const costoMateriales = calcularCostoMateriales(
      p.materiales.map((pm) => ({ cantidad: Number(pm.cantidad), costoUnitario: Number(pm.material.costo_unitario ?? 0) }))
    );
    const costoHilo = Number(p.tipo_hilo?.costo ?? 0);
    const costoCargado = calcularCostoCargado(costoMateriales, costoHilo, contexto.fijos);
    const precio = Number(p.precio);
    return {
      id: p.id_producto,
      nombre: p.nombre,
      precio,
      id_clasif: p.id_clasif,
      margenReal: calcularMargenReal(precio, costoCargado),
    };
  });
}

export async function obtenerDisenoParaEditar(id: number) {
  const { data: producto } = await supabase
    .from("productos")
    .select("id_producto, nombre, id_tipo_hilo, precio, materiales:producto_materiales(id_material, cantidad)")
    .eq("id_producto", id)
    .maybeSingle();
  if (!producto) return null;

  return {
    id: producto.id_producto,
    nombre: producto.nombre,
    id_tipo_hilo: producto.id_tipo_hilo,
    precioActual: Number(producto.precio),
    lineas: producto.materiales.map((pm) => ({ id_material: pm.id_material, cantidad: Number(pm.cantidad) })),
  };
}
