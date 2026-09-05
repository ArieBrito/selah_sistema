import { endOfMonth, startOfMonth } from "date-fns";
import { supabase } from "@/lib/supabase";
import { calcularCostoCargado, calcularCostoMateriales, calcularMargenReal } from "@/lib/pricing";

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
    id_producto: string | null;
    nombre_manual: string | null;
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
      "id_venta, fecha_hora, id_cliente, cliente:clientes(nombre, apellido), tipo_venta, id_canal, canal:canal_venta(nombre), id_metodo, metodo:metodos_pago(nombre), descuento, total, pago_recibido, detalle:venta_detalle(id_producto, nombre_manual, cantidad, precio_unit, costo_unit_snap, producto:productos(nombre))"
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
      nombre: d.producto?.nombre ?? d.nombre_manual ?? "Producto",
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
  detalle: { cantidad: number; precio_unit: string; costo_unit_snap: string }[];
};

export type CanalKpi = { id_canal: number | null; nombre: string; unidades: number; total: number; numVentas: number };
export type SemanaKpi = { semana: number; rango: string; unidades: number };
export type DiaKpi = { dia: number; unidades: number; total: number };

export async function obtenerCostosFijos() {
  const { data: configuracion } = await supabase
    .from("configuracion")
    .upsert({ id: 1 })
    .select("costo_mano_obra, costo_empaque, costo_pago_hermana")
    .single();

  return {
    costo_mano_obra: Number(configuracion?.costo_mano_obra ?? 0),
    costo_empaque: Number(configuracion?.costo_empaque ?? 0),
    costo_pago_hermana: Number(configuracion?.costo_pago_hermana ?? 0),
  };
}

export async function obtenerKpisVentas(mesRef: Date = new Date()) {
  const inicioMes = startOfMonth(mesRef);
  const finMes = endOfMonth(mesRef);

  const { data } = await supabase
    .from("ventas")
    .select("fecha_hora, id_canal, canal:canal_venta(nombre), detalle:venta_detalle(cantidad, precio_unit, costo_unit_snap)")
    .gte("fecha_hora", inicioMes.toISOString())
    .lte("fecha_hora", finMes.toISOString())
    .returns<VentaMesRow[]>();

  const ventas = data ?? [];

  const unidadesMes = ventas.reduce((suma, v) => suma + v.detalle.reduce((s, d) => s + Number(d.cantidad), 0), 0);
  const numVentasMes = ventas.length;
  const ingresoMes = ventas.reduce(
    (suma, v) => suma + v.detalle.reduce((s, d) => s + Number(d.cantidad) * Number(d.precio_unit), 0),
    0
  );
  const costoMesNeto = ventas.reduce(
    (suma, v) => suma + v.detalle.reduce((s, d) => s + Number(d.cantidad) * Number(d.costo_unit_snap), 0),
    0
  );

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

  const porDiaMap = new Map<number, DiaKpi>();
  for (const v of ventas) {
    const dia = new Date(v.fecha_hora).getDate();
    const unidades = v.detalle.reduce((s, d) => s + Number(d.cantidad), 0);
    const total = v.detalle.reduce((s, d) => s + Number(d.cantidad) * Number(d.precio_unit), 0);
    const actual = porDiaMap.get(dia) ?? { dia, unidades: 0, total: 0 };
    porDiaMap.set(dia, { dia, unidades: actual.unidades + unidades, total: actual.total + total });
  }
  const porDia = Array.from(porDiaMap.values()).sort((a, b) => a.dia - b.dia);

  const canalMap = new Map<string, CanalKpi>();
  for (const v of ventas) {
    const key = v.id_canal?.toString() ?? "sin-canal";
    const unidades = v.detalle.reduce((s, d) => s + Number(d.cantidad), 0);
    const total = v.detalle.reduce((s, d) => s + Number(d.cantidad) * Number(d.precio_unit), 0);
    const actual = canalMap.get(key) ?? {
      id_canal: v.id_canal,
      nombre: v.canal?.nombre ?? "Sin canal",
      unidades: 0,
      total: 0,
      numVentas: 0,
    };
    canalMap.set(key, { ...actual, unidades: actual.unidades + unidades, total: actual.total + total, numVentas: actual.numVentas + 1 });
  }
  const porCanal = Array.from(canalMap.values()).sort((a, b) => b.total - a.total);

  return { unidadesMes, semanas, porDia, porCanal, numVentasMes, ingresoMes, costoMesNeto };
}

/**
 * Clientes que compraron en el mes, separados en nuevos (su primera compra fue
 * este mes) y recurrentes (ya tenían compras antes del mes).
 */
export async function obtenerClientesNuevosVsRecurrentesMes(mesRef: Date = new Date()) {
  const inicioMes = startOfMonth(mesRef);
  const finMes = endOfMonth(mesRef);

  const { data: ventasMes } = await supabase
    .from("ventas")
    .select("id_cliente")
    .not("id_cliente", "is", null)
    .gte("fecha_hora", inicioMes.toISOString())
    .lte("fecha_hora", finMes.toISOString());

  const idsMes = Array.from(new Set((ventasMes ?? []).map((v) => v.id_cliente as number)));
  if (idsMes.length === 0) return { totalClientes: 0, nuevos: 0, recurrentes: 0, pctRecurrentes: 0 };

  const { data: previas } = await supabase
    .from("ventas")
    .select("id_cliente")
    .in("id_cliente", idsMes)
    .lt("fecha_hora", inicioMes.toISOString());

  const conPrevias = new Set((previas ?? []).map((v) => v.id_cliente as number));
  const recurrentes = idsMes.filter((id) => conPrevias.has(id)).length;
  const nuevos = idsMes.length - recurrentes;

  return { totalClientes: idsMes.length, nuevos, recurrentes, pctRecurrentes: (recurrentes / idsMes.length) * 100 };
}

/** % de clientes (de toda la historia) que han comprado más de una vez. */
export async function obtenerTasaRecompra() {
  const { data } = await supabase.from("ventas").select("id_cliente").not("id_cliente", "is", null);

  const conteo = new Map<number, number>();
  for (const v of data ?? []) {
    const id = v.id_cliente as number;
    conteo.set(id, (conteo.get(id) ?? 0) + 1);
  }
  const totalClientes = conteo.size;
  const conRecompra = Array.from(conteo.values()).filter((c) => c >= 2).length;

  return { totalClientes, conRecompra, tasaRecompra: totalClientes > 0 ? (conRecompra / totalClientes) * 100 : 0 };
}

/** Ingreso histórico total (todas las ventas registradas, sin filtro de fecha). */
export async function obtenerIngresoAcumulado() {
  const { data } = await supabase.from("ventas").select("total");
  return (data ?? []).reduce((s, v) => s + Number(v.total), 0);
}

type DetalleCategoriaRow = { cantidad: number; producto: { categoria: { nombre: string } | null } | null };
type VentaCategoriaMesRow = { detalle: DetalleCategoriaRow[] };

export async function obtenerUnidadesPorCategoriaMes(mesRef: Date = new Date()) {
  const inicioMes = startOfMonth(mesRef);
  const finMes = endOfMonth(mesRef);

  const { data } = await supabase
    .from("ventas")
    .select("detalle:venta_detalle(cantidad, producto:productos(categoria:categorias(nombre)))")
    .gte("fecha_hora", inicioMes.toISOString())
    .lte("fecha_hora", finMes.toISOString())
    .returns<VentaCategoriaMesRow[]>();

  const mapa = new Map<string, number>();
  for (const v of data ?? []) {
    for (const d of v.detalle) {
      const nombre = d.producto?.categoria?.nombre ?? "Sin categoría";
      mapa.set(nombre, (mapa.get(nombre) ?? 0) + Number(d.cantidad));
    }
  }
  return Array.from(mapa.entries())
    .map(([nombre, unidades]) => ({ nombre, unidades }))
    .sort((a, b) => b.unidades - a.unidades);
}

export async function obtenerStockPorCategoria() {
  const { data } = await supabase
    .from("productos")
    .select("stock_piezas, categoria:categorias(nombre)")
    .eq("activo", true)
    .returns<{ stock_piezas: string; categoria: { nombre: string } | null }[]>();

  const mapa = new Map<string, number>();
  for (const p of data ?? []) {
    const nombre = p.categoria?.nombre ?? "Sin categoría";
    mapa.set(nombre, (mapa.get(nombre) ?? 0) + Number(p.stock_piezas));
  }
  return Array.from(mapa.entries())
    .map(([nombre, stock]) => ({ nombre, stock }))
    .sort((a, b) => b.stock - a.stock);
}

function variacionPct(actual: number, previo: number): number | null {
  return previo > 0 ? ((actual - previo) / previo) * 100 : null;
}

/** Compara el mes de referencia contra el mes anterior y el mismo mes del año anterior. */
export async function obtenerComparativoVentas(mesRef: Date = new Date()) {
  const mesAnterior = new Date(mesRef.getFullYear(), mesRef.getMonth() - 1, 1);
  const mismoMesAnioAnterior = new Date(mesRef.getFullYear() - 1, mesRef.getMonth(), 1);

  const [actual, anterior, anioAnterior] = await Promise.all([
    obtenerKpisVentas(mesRef),
    obtenerKpisVentas(mesAnterior),
    obtenerKpisVentas(mismoMesAnioAnterior),
  ]);

  return {
    actual: { ingreso: actual.ingresoMes, unidades: actual.unidadesMes },
    mesAnterior: {
      ingreso: anterior.ingresoMes,
      unidades: anterior.unidadesMes,
      variacionIngreso: variacionPct(actual.ingresoMes, anterior.ingresoMes),
    },
    mismoMesAnioAnterior: {
      ingreso: anioAnterior.ingresoMes,
      unidades: anioAnterior.unidadesMes,
      variacionIngreso: variacionPct(actual.ingresoMes, anioAnterior.ingresoMes),
    },
  };
}

type VentaProductoMesRow = {
  detalle: {
    id_producto: string | null;
    cantidad: number;
    precio_unit: string;
    costo_unit_snap: string;
    producto: { nombre: string; stock_piezas: string; categoria: { nombre: string } | null } | null;
  }[];
};

export type ProductoKpi = {
  id_producto: string;
  nombre: string;
  lineaNombre: string | null;
  unidadesMes: number;
  ingresoMes: number;
  margenNetoPct: number;
  stockActual: number;
  rotacionMes: number | null;
  vendidoHistorico: number;
  pctVendidoVsProducido: number | null;
};

/**
 * KPIs por diseño para el mes. `pctVendidoVsProducido` y `rotacionMes` son aproximados:
 * no hay registro de piezas producidas ni histórico de stock, así que se estima
 * "producido" como stock actual + vendido histórico (asume que no hay merma ni piezas regaladas).
 */
export async function obtenerKpisProductosMes(mesRef: Date = new Date()): Promise<ProductoKpi[]> {
  const inicioMes = startOfMonth(mesRef);
  const finMes = endOfMonth(mesRef);

  const [{ data: ventasMes }, { data: detalleHistorico }] = await Promise.all([
    supabase
      .from("ventas")
      .select(
        "detalle:venta_detalle(id_producto, cantidad, precio_unit, costo_unit_snap, producto:productos(nombre, stock_piezas, categoria:categorias(nombre)))"
      )
      .gte("fecha_hora", inicioMes.toISOString())
      .lte("fecha_hora", finMes.toISOString())
      .returns<VentaProductoMesRow[]>(),
    supabase.from("venta_detalle").select("id_producto, cantidad").not("id_producto", "is", null),
  ]);

  const vendidoHistoricoMap = new Map<string, number>();
  for (const d of detalleHistorico ?? []) {
    const id = d.id_producto as string;
    vendidoHistoricoMap.set(id, (vendidoHistoricoMap.get(id) ?? 0) + Number(d.cantidad));
  }

  type Acumulado = {
    id_producto: string;
    nombre: string;
    lineaNombre: string | null;
    stockActual: number;
    unidadesMes: number;
    ingresoMes: number;
    costoMes: number;
  };

  const acumulado = new Map<string, Acumulado>();
  for (const v of ventasMes ?? []) {
    for (const d of v.detalle) {
      if (!d.id_producto || !d.producto) continue;
      const cantidad = Number(d.cantidad);
      const actual: Acumulado = acumulado.get(d.id_producto) ?? {
        id_producto: d.id_producto,
        nombre: d.producto.nombre,
        lineaNombre: d.producto.categoria?.nombre ?? null,
        stockActual: Number(d.producto.stock_piezas),
        unidadesMes: 0,
        ingresoMes: 0,
        costoMes: 0,
      };
      actual.unidadesMes += cantidad;
      actual.ingresoMes += cantidad * Number(d.precio_unit);
      actual.costoMes += cantidad * Number(d.costo_unit_snap);
      acumulado.set(d.id_producto, actual);
    }
  }

  return Array.from(acumulado.values())
    .map((a) => {
      const vendidoHistorico = vendidoHistoricoMap.get(a.id_producto) ?? 0;
      const producidoAprox = vendidoHistorico + a.stockActual;
      return {
        id_producto: a.id_producto,
        nombre: a.nombre,
        lineaNombre: a.lineaNombre,
        unidadesMes: a.unidadesMes,
        ingresoMes: a.ingresoMes,
        margenNetoPct: calcularMargenReal(a.ingresoMes, a.costoMes) * 100,
        stockActual: a.stockActual,
        rotacionMes: a.stockActual > 0 ? a.unidadesMes / a.stockActual : null,
        vendidoHistorico,
        pctVendidoVsProducido: producidoAprox > 0 ? (vendidoHistorico / producidoAprox) * 100 : null,
      };
    })
    .sort((a, b) => b.ingresoMes - a.ingresoMes);
}
