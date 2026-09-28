import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { NOMBRES_MES, formatoMes, parsearMes } from "@/lib/mes";
import {
  obtenerClientesNuevosVsRecurrentesMes,
  obtenerComparativoVentas,
  obtenerContextoVentas,
  obtenerKpisVentas,
  obtenerStockPorCategoria,
  obtenerTasaRecompra,
} from "@/app/ventas/data";
import {
  filasCuadreCaja,
  obtenerCobradoMes,
  obtenerCuentasPorCobrar,
  obtenerFlujoEfectivo,
  obtenerPnLMes,
  obtenerRepartoMes,
} from "@/app/ventas/finanzas";
import { ExportarPnLButton } from "./pnl-export-button";
import { ExportarCuadreButton } from "./cuadre-export-button";
import { RepartoPanel } from "./reparto-panel";
import { CobrosPanel } from "./cobros-panel";

const ACCESOS = [
  { href: "/ventas", label: "Ventas" },
  { href: "/produccion/compras", label: "Compras" },
  { href: "/produccion/gastos", label: "Gastos" },
  { href: "/produccion/materiales", label: "Materiales" },
  { href: "/produccion/productos", label: "Productos" },
  { href: "/produccion/configuracion", label: "Costos fijos" },
  { href: "/registro-pulseras", label: "Producción" },
];

function pct(valor: number, total: number) {
  return total > 0 ? (valor / total) * 100 : 0;
}

function variacionTexto(variacion: number | null) {
  if (variacion === null) return "sin datos del periodo anterior";
  const signo = variacion >= 0 ? "+" : "";
  return `${signo}${variacion.toFixed(1)}% vs. este mes`;
}

export default async function AdministracionPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const { mes } = await searchParams;
  const mesRef = parsearMes(mes);
  const mesAnterior = new Date(mesRef.getFullYear(), mesRef.getMonth() - 1, 1);
  const mesSiguiente = new Date(mesRef.getFullYear(), mesRef.getMonth() + 1, 1);
  const etiquetaMes = `${NOMBRES_MES[mesRef.getMonth()]} ${mesRef.getFullYear()}`;

  const [
    cobrado,
    reparto,
    cuentasPorCobrar,
    pnlMes,
    flujoEfectivo,
    contexto,
    kpisVentas,
    comparativo,
    stockPorCategoria,
    clientesMes,
    tasaRecompra,
  ] = await Promise.all([
    obtenerCobradoMes(mesRef),
    obtenerRepartoMes(mesRef),
    obtenerCuentasPorCobrar(),
    obtenerPnLMes(mesRef),
    obtenerFlujoEfectivo(),
    obtenerContextoVentas(),
    obtenerKpisVentas(mesRef),
    obtenerComparativoVentas(mesRef),
    obtenerStockPorCategoria(),
    obtenerClientesNuevosVsRecurrentesMes(mesRef),
    obtenerTasaRecompra(),
  ]);

  const totalPorCobrar = cuentasPorCobrar.reduce((s, v) => s + v.saldo, 0);
  const ticketPromedioPorCliente = clientesMes.totalClientes > 0 ? kpisVentas.ingresoMes / clientesMes.totalClientes : 0;
  const maxStockCategoria = Math.max(1, ...stockPorCategoria.map((c) => c.stock));

  const filasPnL = [
    { concepto: "Ingresos por ventas", monto: pnlMes.ingresos },
    { concepto: "Costo de materiales (compras)", monto: -pnlMes.costoMateriales },
    ...pnlMes.costosProduccion.map((c) => ({ concepto: `${c.nombre} (${pnlMes.unidades} pz)`, monto: -c.monto })),
    ...pnlMes.gastosPorTipo.map((g) => ({ concepto: `Gasto: ${g.nombre}`, monto: -g.monto })),
    { concepto: "Utilidad neta", monto: pnlMes.utilidadNeta },
  ];

  const cuadre = reparto.cuadreCaja;
  const superavit = cuadre.resultado >= -0.005;
  const filasCuadre = filasCuadreCaja(cuadre);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Administración</h1>
          <p className="text-sm text-muted-foreground">
            Elige el mes con las flechas: todo lo de esta página se calcula para ese mes, salvo lo marcado como histórico.
          </p>
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

      <div className="flex flex-wrap gap-2">
        {ACCESOS.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            {a.label}
          </Link>
        ))}
      </div>

      {/* 2 — Dinero recibido */}
      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Dinero recibido</h2>
          <p className="text-xs text-muted-foreground">
            El dinero que realmente entró este mes, comparado con lo que se vendió y con lo que todavía te deben.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-xs font-medium text-muted-foreground">Recibido este mes</h3>
            <p className="text-2xl font-semibold text-primary">${cobrado.total.toFixed(2)}</p>
            <p className="mt-1 text-[10px] text-muted-foreground/70">
              {cobrado.numCobros} cobro{cobrado.numCobros === 1 ? "" : "s"} registrado{cobrado.numCobros === 1 ? "" : "s"}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-xs font-medium text-muted-foreground">Vendido este mes</h3>
            <p className="text-2xl font-semibold text-foreground">${pnlMes.ingresos.toFixed(2)}</p>
            <p className="mt-1 text-[10px] text-muted-foreground/70">facturado, se haya cobrado o no</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-xs font-medium text-muted-foreground">Falta por cobrar</h3>
            <p className="text-2xl font-semibold text-destructive">${totalPorCobrar.toFixed(2)}</p>
            <p className="mt-1 text-[10px] text-muted-foreground/70">
              {cuentasPorCobrar.length} venta{cuentasPorCobrar.length === 1 ? "" : "s"}, histórico
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-xs font-medium text-muted-foreground">Saldo en caja</h3>
            <p className="text-2xl font-semibold text-foreground">${flujoEfectivo.efectivoDisponible.toFixed(2)}</p>
            <p className="mt-1 text-[10px] text-muted-foreground/70">cobrado − compras − gastos − entregas</p>
          </div>
        </div>

        {cobrado.porMetodo.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-2 text-xs font-medium text-muted-foreground">Cómo entró el dinero este mes</h3>
            <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-sm">
              {cobrado.porMetodo.map((m) => (
                <span key={m.nombre} className="text-muted-foreground">
                  {m.nombre} <span className="font-medium text-foreground">${m.monto.toFixed(2)}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 3 y 4 — Reparto del dinero y entregas registradas */}
      <RepartoPanel
        filas={reparto.filas}
        entregas={reparto.entregas}
        base={reparto.base}
        unidades={reparto.unidades}
        etiquetaMes={etiquetaMes}
      />

      {/* 5 — Cuadre de caja */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Cuadre de caja</h2>
            <p className="text-xs text-muted-foreground">
              Lo que de verdad queda en caja después de lo que ya se pagó, y si alcanza para entregar lo que falta del reparto.
            </p>
          </div>
          <ExportarCuadreButton anio={mesRef.getFullYear()} />
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
              {filasCuadre.map((f) => (
                <tr key={f.concepto} className="border-b border-border/60 last:border-0">
                  <td className={`px-4 py-2 text-foreground ${f.total ? "font-semibold" : ""}`}>{f.concepto}</td>
                  <td className={`px-4 py-2 text-right ${f.total ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                    ${f.monto.toFixed(2)}
                  </td>
                </tr>
              ))}
              <tr className={superavit ? "bg-primary/10" : "bg-destructive/10"}>
                <td className={`px-4 py-2 font-semibold ${superavit ? "text-primary" : "text-destructive"}`}>
                  {superavit ? "Superávit" : "Déficit"}
                </td>
                <td className={`px-4 py-2 text-right font-semibold ${superavit ? "text-primary" : "text-destructive"}`}>
                  ${cuadre.resultado.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">
          {superavit
            ? "Aun entregando todo lo pendiente del reparto (reinversión incluida), sobra dinero de lo cobrado en el mes (normalmente abonos de ventas de meses anteriores)."
            : "Lo que queda en caja no alcanza para entregar todo lo pendiente del reparto (reinversión incluida). Normalmente es porque parte de lo vendido aún no se cobra: revisa las cuentas por cobrar antes de entregar el saldo pendiente."}
        </p>
      </section>

      {/* 6 — Cuentas por cobrar */}
      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Cuentas por cobrar</h2>
          <p className="text-xs text-muted-foreground">
            Ventas a crédito y consignaciones que se cobran en partes. Cada abono que registres entra al dinero recibido del mes
            en que lo cobraste.
          </p>
        </div>
        <CobrosPanel ventas={cuentasPorCobrar} metodos={contexto.metodos} />
      </section>

      {/* 7 — P&L */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">P&amp;L — {etiquetaMes}</h2>
            <p className="text-xs text-muted-foreground">
              Estado de resultados: lo que se vendió menos lo que costó producirlo. Dice si el mes dejó ganancia o pérdida.
            </p>
          </div>
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
        <p className="text-xs text-muted-foreground">
          La mano de obra, el empaque y el pago a Gaby se descuentan por pieza vendida aunque todavía no los hayas pagado. No los
          registres además como gasto en{" "}
          <Link href="/produccion/gastos" className="text-primary underline-offset-2 hover:underline">
            Gastos
          </Link>{" "}
          o se contarían dos veces.
        </p>
      </section>

      {/* 8 — Indicadores de venta */}
      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Indicadores de venta</h2>
          <p className="text-xs text-muted-foreground">Cuánto y cómo se vendió este mes: piezas, días, semanas y canales.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-xs font-medium text-muted-foreground">Ticket promedio por cliente</h3>
            <p className="text-2xl font-semibold text-foreground">${ticketPromedioPorCliente.toFixed(2)}</p>
            <p className="mt-1 text-[10px] text-muted-foreground/70">ingresos del mes / clientes únicos del mes</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-xs font-medium text-muted-foreground">Unidades vendidas</h3>
            <p className="text-2xl font-semibold text-foreground">{kpisVentas.unidadesMes}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-xs font-medium text-muted-foreground">Vs. mes anterior</h3>
            <p className="text-2xl font-semibold text-foreground">${comparativo.mesAnterior.ingreso.toFixed(2)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{variacionTexto(comparativo.mesAnterior.variacionIngreso)}</p>
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
      </section>

      {/* 9 — Inventario y clientes */}
      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Inventario y clientes</h2>
          <p className="text-xs text-muted-foreground">
            Las piezas que tienes listas para vender y qué tanto regresan tus clientas a comprar.
          </p>
        </div>

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
        </div>

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
    </div>
  );
}
