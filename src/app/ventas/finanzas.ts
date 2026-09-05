import { endOfMonth, startOfMonth } from "date-fns";
import { supabase } from "@/lib/supabase";
import { obtenerCostosFijos } from "@/app/ventas/data";
import type { ConceptoReparto } from "@/lib/validations";

export type CostosFijos = { costo_mano_obra: number; costo_empaque: number; costo_pago_hermana: number };

export type FilaReparto = { concepto: ConceptoReparto; devengado: number; entregado: number; saldo: number };

export type PnLMes = {
  mes: string; // "YYYY-MM"
  ingresos: number;
  unidades: number;
  costoMateriales: number;
  costosProduccion: { nombre: string; monto: number }[];
  costosProduccionTotal: number;
  gastosPorTipo: { nombre: string; monto: number }[];
  gastosTotal: number;
  utilidadNeta: number;
};

function rangoMes(mesRef: Date) {
  const inicio = startOfMonth(mesRef);
  const fin = endOfMonth(mesRef);
  return { inicio, fin, inicioStr: inicio.toISOString().slice(0, 10), finStr: fin.toISOString().slice(0, 10) };
}

/**
 * Reparto del dinero de un mes. Sobre la base disponible se cubren primero los
 * costos por pieza (mano de obra, empaque y el pago fijo a Gaby); de lo que
 * sobra, 15% es de Arie y el resto se divide en partes iguales entre
 * reinversión y Gaby.
 *
 * La base es el dinero COBRADO, no el facturado: no se puede repartir dinero
 * que todavía no entra (ventas a crédito y consignación se cobran en partes).
 */
export function calcularReparto(base: number, unidades: number, costosFijos: CostosFijos) {
  const manoObra = costosFijos.costo_mano_obra * unidades;
  const empaque = costosFijos.costo_empaque * unidades;
  const gabyFijo = costosFijos.costo_pago_hermana * unidades;

  const restante = Math.max(0, base - (manoObra + empaque + gabyFijo));
  const arie = restante * 0.15;
  const mitadSobrante = (restante - arie) * 0.5;

  return {
    base,
    unidades,
    montos: {
      "Mano de obra": manoObra,
      Empaque: empaque,
      Gaby: gabyFijo + mitadSobrante,
      Arie: arie,
      Reinversión: mitadSobrante,
    } as Record<ConceptoReparto, number>,
  };
}

/**
 * P&L devengado: los ingresos facturados del mes menos todo lo que el negocio
 * tiene que pagar por ellos — materiales comprados, los costos por pieza
 * (mano de obra, empaque, pago a Gaby) y los gastos operativos registrados.
 *
 * Los costos por pieza se calculan sobre las unidades vendidas aunque todavía
 * no se hayan pagado, así que no deben registrarse además como gasto operativo
 * (se contarían dos veces). El dinero realmente entregado se lleva en `entregas`.
 */
export async function obtenerPnLMes(mesRef: Date = new Date()): Promise<PnLMes> {
  const { inicio, fin, inicioStr, finStr } = rangoMes(mesRef);

  const [{ data: ventasMes }, { data: comprasMes }, { data: gastosMes }, costosFijos] = await Promise.all([
    supabase
      .from("ventas")
      .select("total, detalle:venta_detalle(cantidad)")
      .gte("fecha_hora", inicio.toISOString())
      .lte("fecha_hora", fin.toISOString())
      .returns<{ total: string; detalle: { cantidad: number }[] }[]>(),
    supabase.from("compras").select("total").gte("fecha", inicioStr).lte("fecha", finStr),
    supabase
      .from("gastos")
      .select("monto, tipo:tipos_gasto(nombre)")
      .gte("fecha", inicioStr)
      .lte("fecha", finStr)
      .returns<{ monto: string; tipo: { nombre: string } | null }[]>(),
    obtenerCostosFijos(),
  ]);

  const ingresos = (ventasMes ?? []).reduce((s, v) => s + Number(v.total), 0);
  const unidades = (ventasMes ?? []).reduce((s, v) => s + v.detalle.reduce((u, d) => u + Number(d.cantidad), 0), 0);
  const costoMateriales = (comprasMes ?? []).reduce((s, c) => s + Number(c.total), 0);

  const costosProduccion = [
    { nombre: "Mano de obra", monto: costosFijos.costo_mano_obra * unidades },
    { nombre: "Empaque", monto: costosFijos.costo_empaque * unidades },
    { nombre: "Pago a Gaby", monto: costosFijos.costo_pago_hermana * unidades },
  ].filter((c) => c.monto > 0);
  const costosProduccionTotal = costosProduccion.reduce((s, c) => s + c.monto, 0);

  const gastosMap = new Map<string, number>();
  for (const g of gastosMes ?? []) {
    const nombre = g.tipo?.nombre ?? "Otro";
    gastosMap.set(nombre, (gastosMap.get(nombre) ?? 0) + Number(g.monto));
  }
  const gastosPorTipo = Array.from(gastosMap.entries()).map(([nombre, monto]) => ({ nombre, monto }));
  const gastosTotal = gastosPorTipo.reduce((s, g) => s + g.monto, 0);

  return {
    mes: `${mesRef.getFullYear()}-${String(mesRef.getMonth() + 1).padStart(2, "0")}`,
    ingresos,
    unidades,
    costoMateriales,
    costosProduccion,
    costosProduccionTotal,
    gastosPorTipo,
    gastosTotal,
    utilidadNeta: ingresos - costoMateriales - costosProduccionTotal - gastosTotal,
  };
}

/** Dinero realmente recibido en el mes, contando los cobros parciales. */
export async function obtenerCobradoMes(mesRef: Date = new Date()) {
  const { inicioStr, finStr } = rangoMes(mesRef);

  const { data } = await supabase
    .from("cobros")
    .select("monto, fecha, id_metodo, metodo:metodos_pago(nombre)")
    .gte("fecha", inicioStr)
    .lte("fecha", finStr)
    .returns<{ monto: string; fecha: string; id_metodo: number | null; metodo: { nombre: string } | null }[]>();

  const cobros = data ?? [];
  const total = cobros.reduce((s, c) => s + Number(c.monto), 0);

  const porMetodo = new Map<string, number>();
  for (const c of cobros) {
    const nombre = c.metodo?.nombre ?? "Sin método";
    porMetodo.set(nombre, (porMetodo.get(nombre) ?? 0) + Number(c.monto));
  }

  return {
    total,
    numCobros: cobros.length,
    porMetodo: Array.from(porMetodo.entries())
      .map(([nombre, monto]) => ({ nombre, monto }))
      .sort((a, b) => b.monto - a.monto),
  };
}

export type VentaPorCobrar = {
  id_venta: number;
  fecha_hora: string;
  clienteNombre: string | null;
  canalNombre: string | null;
  tipo_venta: string;
  total: number;
  cobrado: number;
  saldo: number;
  cobros: { id_cobro: number; fecha: string; monto: number; metodoNombre: string | null; nota: string | null }[];
};

/** Ventas cuyo total todavía no se ha cobrado por completo, con su historial de cobros. */
export async function obtenerCuentasPorCobrar(): Promise<VentaPorCobrar[]> {
  const { data } = await supabase
    .from("ventas")
    .select(
      "id_venta, fecha_hora, tipo_venta, total, pago_recibido, cliente:clientes(nombre, apellido), canal:canal_venta(nombre), cobros(id_cobro, fecha, monto, nota, metodo:metodos_pago(nombre))"
    )
    .order("fecha_hora", { ascending: false })
    .returns<
      {
        id_venta: number;
        fecha_hora: string;
        tipo_venta: string;
        total: string;
        pago_recibido: string;
        cliente: { nombre: string; apellido: string | null } | null;
        canal: { nombre: string } | null;
        cobros: { id_cobro: number; fecha: string; monto: string; nota: string | null; metodo: { nombre: string } | null }[];
      }[]
    >();

  return (data ?? [])
    .map((v) => {
      const total = Number(v.total);
      const cobrado = Number(v.pago_recibido);
      return {
        id_venta: v.id_venta,
        fecha_hora: v.fecha_hora,
        clienteNombre: v.cliente ? [v.cliente.nombre, v.cliente.apellido].filter(Boolean).join(" ") : null,
        canalNombre: v.canal?.nombre ?? null,
        tipo_venta: v.tipo_venta,
        total,
        cobrado,
        saldo: total - cobrado,
        cobros: v.cobros
          .map((c) => ({
            id_cobro: c.id_cobro,
            fecha: c.fecha,
            monto: Number(c.monto),
            metodoNombre: c.metodo?.nombre ?? null,
            nota: c.nota,
          }))
          .sort((a, b) => a.fecha.localeCompare(b.fecha)),
      };
    })
    .filter((v) => v.saldo > 0.005)
    .sort((a, b) => b.saldo - a.saldo);
}

export type EntregaRow = {
  id_entrega: number;
  fecha: string;
  concepto: ConceptoReparto;
  monto: number;
  nota: string | null;
};

export async function listarEntregas(mesRef?: Date): Promise<EntregaRow[]> {
  let consulta = supabase.from("entregas").select("id_entrega, fecha, concepto, monto, nota");

  if (mesRef) {
    const { inicioStr, finStr } = rangoMes(mesRef);
    consulta = consulta.gte("fecha", inicioStr).lte("fecha", finStr);
  }

  const { data } = await consulta
    .order("fecha", { ascending: false })
    .returns<{ id_entrega: number; fecha: string; concepto: ConceptoReparto; monto: string; nota: string | null }[]>();

  return (data ?? []).map((e) => ({ ...e, monto: Number(e.monto) }));
}

/**
 * Reparto del mes contra lo que ya se entregó, para saber cuánto se le debe a
 * cada quien. La base es el dinero cobrado en el mes y las unidades son las
 * piezas vendidas en ese mismo mes.
 */
export async function obtenerRepartoMes(mesRef: Date = new Date()) {
  const [cobrado, pnl, costosFijos, entregas] = await Promise.all([
    obtenerCobradoMes(mesRef),
    obtenerPnLMes(mesRef),
    obtenerCostosFijos(),
    listarEntregas(mesRef),
  ]);

  const { montos } = calcularReparto(cobrado.total, pnl.unidades, costosFijos);

  const entregadoPorConcepto = new Map<string, number>();
  for (const e of entregas) {
    entregadoPorConcepto.set(e.concepto, (entregadoPorConcepto.get(e.concepto) ?? 0) + e.monto);
  }

  const filas: FilaReparto[] = (Object.keys(montos) as ConceptoReparto[]).map((concepto) => {
    const devengado = montos[concepto];
    const entregado = entregadoPorConcepto.get(concepto) ?? 0;
    return { concepto, devengado, entregado, saldo: devengado - entregado };
  });

  return {
    base: cobrado.total,
    unidades: pnl.unidades,
    filas,
    totalDevengado: filas.reduce((s, f) => s + f.devengado, 0),
    totalEntregado: filas.reduce((s, f) => s + f.entregado, 0),
    entregas,
  };
}

/**
 * Saldo real del negocio: todo lo cobrado menos las compras de materiales, los
 * gastos operativos y el dinero ya entregado a cada quien. Es el efectivo que
 * queda disponible, con una proyección usando la utilidad de los últimos meses.
 */
export async function obtenerFlujoEfectivo(mesRef: Date = new Date()) {
  const [{ data: cobros }, { data: compras }, { data: gastos }, { data: entregas }] = await Promise.all([
    supabase.from("cobros").select("monto"),
    supabase.from("compras").select("total"),
    supabase.from("gastos").select("monto"),
    supabase.from("entregas").select("monto"),
  ]);

  const cobradoHistorico = (cobros ?? []).reduce((s, c) => s + Number(c.monto), 0);
  const comprasHistoricas = (compras ?? []).reduce((s, c) => s + Number(c.total), 0);
  const gastosHistoricos = (gastos ?? []).reduce((s, g) => s + Number(g.monto), 0);
  const entregadoHistorico = (entregas ?? []).reduce((s, e) => s + Number(e.monto), 0);
  const efectivoDisponible = cobradoHistorico - comprasHistoricas - gastosHistoricos - entregadoHistorico;

  const ultimos3Meses = [0, 1, 2].map((i) => new Date(mesRef.getFullYear(), mesRef.getMonth() - i, 1));
  const pnlUltimos3 = await Promise.all(ultimos3Meses.map((m) => obtenerPnLMes(m)));
  const flujoNetoPromedio = pnlUltimos3.reduce((s, p) => s + p.utilidadNeta, 0) / pnlUltimos3.length;

  return {
    cobradoHistorico,
    comprasHistoricas,
    gastosHistoricos,
    entregadoHistorico,
    efectivoDisponible,
    flujoNetoPromedio,
    proyeccion30: efectivoDisponible + flujoNetoPromedio,
    proyeccion60: efectivoDisponible + flujoNetoPromedio * 2,
  };
}
