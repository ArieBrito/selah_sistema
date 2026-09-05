import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { NOMBRES_MES, formatoMes, parsearMes } from "@/lib/mes";
import {
  obtenerClientesNuevosVsRecurrentesMes,
  obtenerComparativoVentas,
  obtenerIngresoAcumulado,
  obtenerKpisVentas,
  obtenerStockPorCategoria,
  obtenerTasaRecompra,
  obtenerUnidadesPorCategoriaMes,
} from "@/app/ventas/data";
import { obtenerFlujoEfectivo, obtenerPnLMes } from "@/app/ventas/finanzas";
import { ExportarPnLButton } from "./pnl-export-button";

function pct(valor: number, total: number) {
  return total > 0 ? (valor / total) * 100 : 0;
}

function variacionTexto(variacion: number | null) {
  if (variacion === null) return "sin datos del periodo anterior";
  const signo = variacion >= 0 ? "+" : "";
  return `${signo}${variacion.toFixed(1)}% vs. este mes`;
}

export default async function SeguimientoVentasPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes } = await searchParams;
  const mesRef = parsearMes(mes);
  const mesAnterior = new Date(mesRef.getFullYear(), mesRef.getMonth() - 1, 1);
  const mesSiguiente = new Date(mesRef.getFullYear(), mesRef.getMonth() + 1, 1);
  const etiquetaMes = `${NOMBRES_MES[mesRef.getMonth()]} ${mesRef.getFullYear()}`;

  const [
    kpisVentas,
    comparativo,
    unidadesPorCategoria,
    stockPorCategoria,
    clientesMes,
    tasaRecompra,
    ingresoAcumulado,
    pnlMes,
    flujoEfectivo,
  ] = await Promise.all([
    obtenerKpisVentas(mesRef),
    obtenerComparativoVentas(mesRef),
    obtenerUnidadesPorCategoriaMes(mesRef),
    obtenerStockPorCategoria(),
    obtenerClientesNuevosVsRecurrentesMes(mesRef),
    obtenerTasaRecompra(),
    obtenerIngresoAcumulado(),
    obtenerPnLMes(mesRef),
    obtenerFlujoEfectivo(mesRef),
  ]);

  const ticketPromedioPorCliente = clientesMes.totalClientes > 0 ? kpisVentas.ingresoMes / clientesMes.totalClientes : 0;
  const maxUnidadesCategoria = Math.max(1, ...unidadesPorCategoria.map((c) => c.unidades));
  const maxStockCategoria = Math.max(1, ...stockPorCategoria.map((c) => c.stock));

  const filasPnL = [
    { concepto: "Ingresos por ventas", monto: pnlMes.ingresos },
    { concepto: "Costo de materiales (compras)", monto: -pnlMes.costoMateriales },
    ...pnlMes.gastosPorTipo.map((g) => ({ concepto: `Gasto: ${g.nombre}`, monto: -g.monto })),
    { concepto: "Utilidad neta", monto: pnlMes.utilidadNeta },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Seguimiento de ventas</h1>
          <p className="text-sm text-muted-foreground">Indicadores del mes seleccionado.</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
          <Link
            href={`/ventas/seguimiento?mes=${formatoMes(mesAnterior)}`}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="size-4" />
          </Link>
          <span className="w-32 text-center text-sm font-medium text-foreground">{etiquetaMes}</span>
          <Link
            href={`/ventas/seguimiento?mes=${formatoMes(mesSiguiente)}`}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="size-4" />
          </Link>
        </div>
      </div>

      {/* Ventas */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Ventas</h2>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-xs font-medium text-muted-foreground">Ingresos del mes</h3>
            <p className="text-2xl font-semibold text-foreground">${kpisVentas.ingresoMes.toFixed(2)}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-xs font-medium text-muted-foreground">Ingresos acumulados</h3>
            <p className="text-2xl font-semibold text-foreground">${ingresoAcumulado.toFixed(2)}</p>
            <p className="mt-1 text-[10px] text-muted-foreground/70">Histórico total, todas las ventas</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-xs font-medium text-muted-foreground">Ticket promedio por cliente</h3>
            <p className="text-2xl font-semibold text-foreground">${ticketPromedioPorCliente.toFixed(2)}</p>
            <p className="mt-1 text-[10px] text-muted-foreground/70">ingresos del mes / clientes únicos del mes</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-xs font-medium text-muted-foreground">Unidades vendidas</h3>
            <p className="text-2xl font-semibold text-foreground">{kpisVentas.unidadesMes}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-3 rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-medium text-muted-foreground">Corte semanal</h3>
            {kpisVentas.semanas.map((s) => (
              <div key={s.semana} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{s.rango}</span>
                <span className="font-medium text-foreground">{s.unidades} piezas</span>
              </div>
            ))}
          </div>

          <div className="space-y-3 rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-medium text-muted-foreground">Corte diario</h3>
            {kpisVentas.porDia.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Sin ventas registradas este mes.</p>
            ) : (
              <div className="max-h-48 space-y-1.5 overflow-y-auto pr-1">
                {kpisVentas.porDia.map((d) => (
                  <div key={d.dia} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Día {d.dia}</span>
                    <span className="font-medium text-foreground">
                      {d.unidades} pieza{d.unidades === 1 ? "" : "s"} · ${d.total.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-3 rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-medium text-muted-foreground">Unidades vendidas por categoría</h3>
            {unidadesPorCategoria.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Sin ventas registradas este mes.</p>
            ) : (
              <div className="space-y-2">
                {unidadesPorCategoria.map((c) => (
                  <div key={c.nombre} className="space-y-1">
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="font-medium text-foreground">{c.nombre}</span>
                      <span className="text-muted-foreground">{c.unidades} piezas</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${pct(c.unidades, maxUnidadesCategoria)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3 rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-medium text-muted-foreground">Ventas por canal</h3>
            {kpisVentas.porCanal.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Sin ventas registradas este mes.</p>
            ) : (
              <div className="space-y-2">
                {kpisVentas.porCanal.map((c) => (
                  <div key={c.id_canal ?? "sin-canal"} className="flex items-baseline justify-between text-sm">
                    <span className="font-medium text-foreground">{c.nombre}</span>
                    <span className="text-muted-foreground">
                      ${c.total.toFixed(2)} · {c.unidades} pieza{c.unidades === 1 ? "" : "s"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-xs font-medium text-muted-foreground">Vs. mes anterior</h3>
            <p className="text-2xl font-semibold text-foreground">${comparativo.mesAnterior.ingreso.toFixed(2)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{variacionTexto(comparativo.mesAnterior.variacionIngreso)}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-xs font-medium text-muted-foreground">Vs. mismo mes año anterior</h3>
            <p className="text-2xl font-semibold text-foreground">${comparativo.mismoMesAnioAnterior.ingreso.toFixed(2)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{variacionTexto(comparativo.mismoMesAnioAnterior.variacionIngreso)}</p>
          </div>
        </div>
      </section>

      {/* Inventario y producción */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Inventario y producción</h2>
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">Stock disponible por categoría</h3>
          {stockPorCategoria.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No hay productos activos.</p>
          ) : (
            <div className="space-y-2">
              {stockPorCategoria.map((c) => (
                <div key={c.nombre} className="space-y-1">
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-medium text-foreground">{c.nombre}</span>
                    <span className="text-muted-foreground">{c.stock} piezas</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div className="h-full rounded-full bg-secondary" style={{ width: `${pct(c.stock, maxStockCategoria)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Tiempo de producción por pieza: no se registra actualmente (no hay captura de piezas producidas ni de horas por
            empleado), así que no se muestra aquí.
          </p>
        </div>
      </section>

      {/* Clientes */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Clientes</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-xs font-medium text-muted-foreground">Clientes nuevos</h3>
            <p className="text-2xl font-semibold text-foreground">{clientesMes.nuevos}</p>
            <p className="mt-1 text-[10px] text-muted-foreground/70">primera compra este mes</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-xs font-medium text-muted-foreground">Clientes recurrentes</h3>
            <p className="text-2xl font-semibold text-foreground">{clientesMes.recurrentes}</p>
            <p className="mt-1 text-[10px] text-muted-foreground/70">ya habían comprado antes</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-xs font-medium text-muted-foreground">% recurrentes este mes</h3>
            <p className="text-2xl font-semibold text-foreground">{clientesMes.pctRecurrentes.toFixed(0)}%</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-xs font-medium text-muted-foreground">Tasa de recompra</h3>
            <p className="text-2xl font-semibold text-foreground">{tasaRecompra.tasaRecompra.toFixed(0)}%</p>
            <p className="mt-1 text-[10px] text-muted-foreground/70">
              {tasaRecompra.conRecompra} de {tasaRecompra.totalClientes} clientes, histórico, con ≥2 compras
            </p>
          </div>
        </div>
      </section>

      {/* Flujo de efectivo */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Flujo de efectivo</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-xs font-medium text-muted-foreground">Ingresos del mes</h3>
            <p className="text-2xl font-semibold text-foreground">${pnlMes.ingresos.toFixed(2)}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-xs font-medium text-muted-foreground">Egresos del mes</h3>
            <p className="text-2xl font-semibold text-foreground">${(pnlMes.costoMateriales + pnlMes.gastosTotal).toFixed(2)}</p>
            <p className="mt-1 text-[10px] text-muted-foreground/70">compras de materiales + gastos operativos</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-xs font-medium text-muted-foreground">Utilidad neta del mes</h3>
            <p className="text-2xl font-semibold text-foreground">${pnlMes.utilidadNeta.toFixed(2)}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-xs font-medium text-muted-foreground">Efectivo disponible</h3>
            <p className="text-2xl font-semibold text-foreground">${flujoEfectivo.efectivoDisponible.toFixed(2)}</p>
            <p className="mt-1 text-[10px] text-muted-foreground/70">histórico: cobrado − compras − gastos</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-xs font-medium text-muted-foreground">Proyección a 30 días</h3>
            <p className="text-2xl font-semibold text-foreground">${flujoEfectivo.proyeccion30.toFixed(2)}</p>
            <p className="mt-1 text-[10px] text-muted-foreground/70">
              efectivo disponible + flujo neto promedio de los últimos 3 meses (${flujoEfectivo.flujoNetoPromedio.toFixed(2)})
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-xs font-medium text-muted-foreground">Proyección a 60 días</h3>
            <p className="text-2xl font-semibold text-foreground">${flujoEfectivo.proyeccion60.toFixed(2)}</p>
            <p className="mt-1 text-[10px] text-muted-foreground/70">efectivo disponible + 2 × flujo neto promedio</p>
          </div>
        </div>
      </section>

      {/* P&L */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">P&amp;L — {etiquetaMes}</h2>
          <ExportarPnLButton mes={formatoMes(mesRef)} filas={filasPnL} />
        </div>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Concepto</th>
                <th className="px-4 py-2 text-right font-medium">Monto</th>
              </tr>
            </thead>
            <tbody>
              {filasPnL.map((f) => (
                <tr key={f.concepto} className="border-b border-border/60 last:border-0">
                  <td className={`px-4 py-2 ${f.concepto === "Utilidad neta" ? "font-semibold text-foreground" : "text-foreground"}`}>
                    {f.concepto}
                  </td>
                  <td
                    className={`px-4 py-2 text-right ${
                      f.concepto === "Utilidad neta" ? "font-semibold text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    ${f.monto.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
