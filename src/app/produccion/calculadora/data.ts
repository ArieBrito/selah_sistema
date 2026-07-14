import { supabase } from "@/lib/supabase";
import type { NivelClasificacion } from "@/lib/pricing";

export async function obtenerContextoPrecios() {
  const [{ data: configuracion }, { data: clasificaciones }, { data: tiposHilo }, { data: materiales }, { data: categorias }, { data: tamanos }] =
    await Promise.all([
      supabase.from("configuracion").upsert({ id: 1 }).select().single(),
      supabase.from("clasificaciones").select("id_clasif, precio_tarifa, costo_max").order("precio_tarifa"),
      supabase.from("tipos_hilo").select("id_tipo_hilo, nombre, costo").order("nombre"),
      supabase
        .from("materiales")
        .select("id_material, nombre, costo_unitario")
        .eq("categoria", "ingrediente")
        .not("costo_unitario", "is", null)
        .order("id_material"),
      supabase.from("categorias").select("id_categoria, nombre").order("nombre"),
      supabase.from("tamanos").select("id_tamano, nombre, cm").order("id_tamano"),
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
    categorias: (categorias ?? []).map((c) => ({ id_categoria: c.id_categoria, nombre: c.nombre })),
    tamanos: (tamanos ?? []).map((t) => ({ id_tamano: t.id_tamano, nombre: t.nombre, cm: t.cm === null ? null : Number(t.cm) })),
  };
}

export async function obtenerDisenoParaEditar(id: string) {
  const { data: producto } = await supabase
    .from("productos")
    .select(
      "id_producto, nombre, descripcion, id_categoria, id_tipo_hilo, id_tamano, stock_piezas, precio, materiales:producto_materiales(id_material, cantidad)"
    )
    .eq("id_producto", id)
    .maybeSingle();
  if (!producto) return null;

  const { data: hermanos } = await supabase
    .from("productos")
    .select("id_producto, id_tamano, stock_piezas")
    .eq("nombre", producto.nombre)
    .neq("id_producto", id);

  return {
    id: producto.id_producto,
    nombre: producto.nombre,
    descripcion: producto.descripcion,
    id_categoria: producto.id_categoria,
    id_tipo_hilo: producto.id_tipo_hilo,
    id_tamano: producto.id_tamano,
    stockPiezas: producto.stock_piezas,
    precioActual: Number(producto.precio),
    lineas: producto.materiales.map((pm) => ({ id_material: pm.id_material, cantidad: Number(pm.cantidad) })),
    otrasTallas: (hermanos ?? []).map((h) => ({
      id_producto: h.id_producto,
      id_tamano: h.id_tamano,
      stockPiezas: h.stock_piezas,
    })),
  };
}
