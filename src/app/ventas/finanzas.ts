import { endOfMonth, startOfMonth } from "date-fns";
import { supabase } from "@/lib/supabase";

export type PnLMes = {
  mes: string; // "YYYY-MM"
  ingresos: number;
  costoMateriales: number;
  gastosPorTipo: { nombre: string; monto: number }[];
  gastosTotal: number;
  utilidadNeta: number;
};

/**
 * P&L de caja (no de costeo por unidad): ingresos reales del mes menos compras
 * de materiales y gastos operativos reales registrados en ese mes.
 */
export async function obtenerPnLMes(mesRef: Date = new Date()): Promise<PnLMes> {
  const inicioMes = startOfMonth(mesRef);
  const finMes = endOfMonth(mesRef);
  const inicioStr = inicioMes.toISOString().slice(0, 10);
  const finStr = finMes.toISOString().slice(0, 10);

  const [{ data: ventasMes }, { data: comprasMes }, { data: gastosMes }] = await Promise.all([
    supabase.from("ventas").select("total").gte("fecha_hora", inicioMes.toISOString()).lte("fecha_hora", finMes.toISOString()),
    supabase.from("compras").select("total").gte("fecha", inicioStr).lte("fecha", finStr),
    supabase
      .from("gastos")
      .select("monto, tipo:tipos_gasto(nombre)")
      .gte("fecha", inicioStr)
      .lte("fecha", finStr)
      .returns<{ monto: string; tipo: { nombre: string } | null }[]>(),
  ]);

  const ingresos = (ventasMes ?? []).reduce((s, v) => s + Number(v.total), 0);
  const costoMateriales = (comprasMes ?? []).reduce((s, c) => s + Number(c.total), 0);

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
    costoMateriales,
    gastosPorTipo,
    gastosTotal,
    utilidadNeta: ingresos - costoMateriales - gastosTotal,
  };
}

/**
 * Efectivo disponible (histórico: pagos recibidos − compras − gastos) y una
 * proyección a 30/60 días usando el flujo neto promedio de los últimos 3 meses.
 */
export async function obtenerFlujoEfectivo(mesRef: Date = new Date()) {
  const [{ data: pagos }, { data: compras }, { data: gastos }] = await Promise.all([
    supabase.from("ventas").select("pago_recibido"),
    supabase.from("compras").select("total"),
    supabase.from("gastos").select("monto"),
  ]);

  const ingresosHistoricos = (pagos ?? []).reduce((s, v) => s + Number(v.pago_recibido), 0);
  const comprasHistoricas = (compras ?? []).reduce((s, c) => s + Number(c.total), 0);
  const gastosHistoricos = (gastos ?? []).reduce((s, g) => s + Number(g.monto), 0);
  const efectivoDisponible = ingresosHistoricos - comprasHistoricas - gastosHistoricos;

  const ultimos3Meses = [0, 1, 2].map((i) => new Date(mesRef.getFullYear(), mesRef.getMonth() - i, 1));
  const pnlUltimos3 = await Promise.all(ultimos3Meses.map((m) => obtenerPnLMes(m)));
  const flujoNetoPromedio = pnlUltimos3.reduce((s, p) => s + p.utilidadNeta, 0) / pnlUltimos3.length;

  return {
    efectivoDisponible,
    flujoNetoPromedio,
    proyeccion30: efectivoDisponible + flujoNetoPromedio,
    proyeccion60: efectivoDisponible + flujoNetoPromedio * 2,
  };
}
