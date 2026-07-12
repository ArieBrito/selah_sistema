import { endOfMonth, startOfMonth } from "date-fns";
import { supabase } from "@/lib/supabase";
import { calcularCostoCargado, calcularCostoMateriales } from "@/lib/pricing";

export async function obtenerContextoVentas() {
  const [{ data: canales }, { data: metodos }, { data: clientes }, { data: productos }] = await Promise.all([
    supabase.from("canal_venta").select("id_canal, nombre").order("nombre"),
    supabase.from("metodos_pago").select("id_metodo, nombre").order("nombre"),
    supabase.from("clientes").select("id_cliente, nombre, apellido, es_revendedor").order("nombre"),
    supabase
      .from("productos")
      .select("id_producto, nombre, precio, stock_piezas")
      .eq("activo", true)
      .order("nombre"),
  ]);

  return {
    canales: (canales ?? []).map((c) => ({ id: c.id_canal, nombre: c.nombre })),
    metodos: (metodos ?? []).map((m) => ({ id: m.id_metodo, nombre: m.nombre })),
    clientes: (clientes ?? []).map((c) => ({ id: c.id_cliente, nombre: c.nombre, apellido: c.apellido, es_revendedor: c.es_revendedor })),
    productos: (productos ?? []).map((p) => ({ id_producto: p.id_producto, nombre: p.nombre, precio: Number(p.precio), stock_piezas: Number(p.stock_piezas) })),
  };
}

type VentaQueryRow = {
  id_venta: number;
  fecha_hora: string;
  id_cliente: number | null;
  cliente: { nombre: string; apellido: string | null } | null;
  tipo_venta: string;
  id_canal: number | null;
  canal: { nombre: string } | null;
  id_metodo: number | null;
  metodo: { nombre: string } | null;
  descuento: string;
  total: string;
  pago_recibido: string;
  detalle: {
    id_producto: string;
    cantidad: number;
    precio_unit: string;
    costo_unit_snap: string;
    producto: { nombre: string } | null;
  }[];
};

export async function listarVentas() {
  const { data: ventas } = await supabase
    .from("ventas")
    .select(
      "id_venta, fecha_hora, id_cliente, cliente:clientes(nombre, apellido), tipo_venta, id_canal, canal:canal_venta(nombre), id_metodo, metodo:metodos_pago(nombre), descuento, total, pago_recibido, detalle:venta_detalle(id_producto, cantidad, precio_unit, costo_unit_snap, producto:productos(nombre))"
    )
    .order("fecha_hora", { ascending: false })
    .returns<VentaQueryRow[]>();

  return (ventas ?? []).map((v) => ({
    id_venta: v.id_venta,
    fecha_hora: v.fecha_hora,
    id_cliente: v.id_cliente,
    clienteNombre: v.cliente ? [v.cliente.nombre, v.cliente.apellido].filter(Boolean).join(" ") : null,
    tipo_venta: v.tipo_venta,
    id_canal: v.id_canal,
    canalNombre: v.canal?.nombre ?? null,
    id_metodo: v.id_metodo,
    metodoNombre: v.metodo?.nombre ?? null,
    descuento: Number(v.descuento),
    total: Number(v.total),
    pago_recibido: Number(v.pago_recibido),
    lineas: v.detalle.map((d) => ({
      id_producto: d.id_producto,
      nombre: d.producto?.nombre ?? d.id_producto,
      cantidad: Number(d.cantidad),
      precio_unit: Number(d.precio_unit),
      costo_unit_snap: Number(d.costo_unit_snap),
    })),
  }));
}

type ProductoCostoRow = {
  id_producto: string;
  costo_mano_obra: string;
  tipo_hilo: { costo: string } | null;
  materiales: { cantidad: string; material: { costo_unitario: string | null } }[];
};

/** Costo cargado de cada producto al momento de la venta, para guardarlo como costo_unit_snap. */
export async function obtenerCostosProductos(idsProducto: string[]): Promise<Map<string, number>> {
  if (idsProducto.length === 0) return new Map();

  const [{ data: productos }, { data: configuracion }] = await Promise.all([
    supabase
      .from("productos")
      .select(
        "id_producto, costo_mano_obra, tipo_hilo:tipos_hilo(costo), materiales:producto_materiales(cantidad, material:materiales(costo_unitario))"
      )
      .in("id_producto", idsProducto)
      .returns<ProductoCostoRow[]>(),
    supabase.from("configuracion").upsert({ id: 1 }).select("costo_mano_obra, costo_empaque, costo_pago_hermana").single(),
  ]);

  const fijos = {
    costo_mano_obra: Number(configuracion?.costo_mano_obra ?? 0),
    costo_empaque: Number(configuracion?.costo_empaque ?? 0),
    costo_pago_hermana: Number(configuracion?.costo_pago_hermana ?? 0),
  };

  const mapa = new Map<string, number>();
  for (const p of productos ?? []) {
    const costoMateriales = calcularCostoMateriales(
      p.materiales.map((pm) => ({ cantidad: Number(pm.cantidad), costoUnitario: Number(pm.material.costo_unitario ?? 0) }))
    );
    const costoHilo = Number(p.tipo_hilo?.costo ?? 0);
    mapa.set(p.id_producto, calcularCostoCargado(costoMateriales, costoHilo, fijos));
  }
  return mapa;
}

type VentaMesRow = {
  fecha_hora: string;
  id_canal: number | null;
  canal: { nombre: string } | null;
  detalle: { cantidad: number; precio_unit: string }[];
};

export type CanalKpi = { id_canal: number | null; nombre: string; unidades: number; total: number };
export type SemanaKpi = { semana: number; rango: string; unidades: number };

export async function obtenerKpisVentas() {
  const ahora = new Date();
  const inicioMes = startOfMonth(ahora);
  const finMes = endOfMonth(ahora);

  const { data } = await supabase
    .from("ventas")
    .select("fecha_hora, id_canal, canal:canal_venta(nombre), detalle:venta_detalle(cantidad, precio_unit)")
    .gte("fecha_hora", inicioMes.toISOString())
    .lte("fecha_hora", finMes.toISOString())
    .returns<VentaMesRow[]>();

  const ventas = data ?? [];

  const unidadesMes = ventas.reduce((suma, v) => suma + v.detalle.reduce((s, d) => s + Number(d.cantidad), 0), 0);

  const numSemanas = Math.ceil(finMes.getDate() / 7);
  const unidadesPorSemana = new Array(numSemanas).fill(0);
  for (const v of ventas) {
    const dia = new Date(v.fecha_hora).getDate();
    const semanaIdx = Math.min(Math.ceil(dia / 7), numSemanas) - 1;
    unidadesPorSemana[semanaIdx] += v.detalle.reduce((s, d) => s + Number(d.cantidad), 0);
  }
  const semanas: SemanaKpi[] = unidadesPorSemana.map((unidades, i) => ({
    semana: i + 1,
    rango: `Días ${i * 7 + 1}–${Math.min((i + 1) * 7, finMes.getDate())}`,
    unidades,
  }));

  const canalMap = new Map<string, CanalKpi>();
  for (const v of ventas) {
    const key = v.id_canal?.toString() ?? "sin-canal";
    const unidades = v.detalle.reduce((s, d) => s + Number(d.cantidad), 0);
    const total = v.detalle.reduce((s, d) => s + Number(d.cantidad) * Number(d.precio_unit), 0);
    const actual = canalMap.get(key) ?? { id_canal: v.id_canal, nombre: v.canal?.nombre ?? "Sin canal", unidades: 0, total: 0 };
    canalMap.set(key, { ...actual, unidades: actual.unidades + unidades, total: actual.total + total });
  }
  const porCanal = Array.from(canalMap.values()).sort((a, b) => b.total - a.total);

  return { unidadesMes, semanas, porCanal };
}
