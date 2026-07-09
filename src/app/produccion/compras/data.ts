import { supabase } from "@/lib/supabase";

export async function obtenerContextoCompras() {
  const [{ data: proveedores }, { data: metodos }, { data: empleados }, { data: materiales }] = await Promise.all([
    supabase.from("proveedores").select("id_proveedor, nombre").order("nombre"),
    supabase.from("metodos_pago").select("id_metodo, nombre").order("nombre"),
    supabase.from("empleados").select("id_empleado, nombre").eq("activo", true).order("nombre"),
    supabase.from("materiales").select("id_material, nombre").order("id_material"),
  ]);

  return {
    proveedores: (proveedores ?? []).map((p) => ({ id: p.id_proveedor, nombre: p.nombre })),
    metodos: (metodos ?? []).map((m) => ({ id: m.id_metodo, nombre: m.nombre })),
    empleados: (empleados ?? []).map((e) => ({ id: e.id_empleado, nombre: e.nombre })),
    materiales: (materiales ?? []).map((m) => ({ id_material: m.id_material, nombre: m.nombre ?? m.id_material })),
  };
}

type CompraRow = {
  id_compra: number;
  ticket: string | null;
  fecha: string;
  id_proveedor: number | null;
  proveedor: { nombre: string } | null;
  id_metodo: number | null;
  metodo: { nombre: string } | null;
  id_empleado: number | null;
  empleado: { nombre: string } | null;
  total: string;
  detalle: {
    id_material: string;
    cantidad: string;
    costo_unit: string;
    material: { nombre: string | null; id_material: string };
  }[];
};

export async function listarCompras() {
  const { data: compras } = await supabase
    .from("compras")
    .select(
      "id_compra, ticket, fecha, id_proveedor, proveedor:proveedores(nombre), id_metodo, metodo:metodos_pago(nombre), id_empleado, empleado:empleados(nombre), total, detalle:compra_detalle(id_material, cantidad, costo_unit, material:materiales(nombre, id_material))"
    )
    .order("fecha", { ascending: false })
    .returns<CompraRow[]>();

  return (compras ?? []).map((c) => ({
    id_compra: c.id_compra,
    ticket: c.ticket,
    fecha: c.fecha,
    id_proveedor: c.id_proveedor,
    proveedorNombre: c.proveedor?.nombre ?? null,
    id_metodo: c.id_metodo,
    metodoNombre: c.metodo?.nombre ?? null,
    id_empleado: c.id_empleado,
    empleadoNombre: c.empleado?.nombre ?? null,
    total: Number(c.total),
    lineas: c.detalle.map((d) => ({
      id_material: d.id_material,
      nombre: d.material.nombre ?? d.material.id_material,
      cantidad: Number(d.cantidad),
      costo_unit: Number(d.costo_unit),
    })),
  }));
}
