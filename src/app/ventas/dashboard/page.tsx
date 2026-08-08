import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { obtenerCostosFijos, obtenerKpisVentas } from "../data";

const META_ARRANQUE = { min: 150, max: 200 };
const META_FINAL = { min: 546, max: 682 };

const NOMBRES_MES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function formatoMes(fecha: Date) {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
}

/** Parsea "YYYY-MM" a un Date del día 1 de ese mes; si no es válido, usa el mes en curso. */
function parsearMes(mes: string | undefined): Date {
  const match = mes?.match(/^(\d{4})-(\d{2})$/);
  if (!match) return new Date();
  const [, anio, mesNum] = match;
  return new Date(Number(anio), Number(mesNum) - 1, 1);
}

const COLOR_CANAL: Record<string, string> = {
  Personal: "#2f8f5e",
  Bazar: "#d99a10",
  WhatsApp: "#e8602a",
  Redes: "#d94f6b",
  Consignación: "#7a3f8a",
  Referidos: "#1173a6",
};
const COLOR_SIN_CANAL = "#9a9890";

const COLOR_REPARTO: Record<string, string> = {
  "Mano de obra": "#a8c9b8",
  Empaque: "#f0c05a",
  Gaby: "#f5b8b0",
  Arie: "#5f9c7d",
  Reinversión: "#f2a05c",
};

function pct(valor: number, total: number) {
  return total > 0 ? (valor / total) * 100 : 0;
}

export default async function DashboardVentasPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes } = await searchParams;
  const mesRef = parsearMes(mes);

  const [{ unidadesMes, semanas, porCanal }, costosFijos] = await Promise.all([
    obtenerKpisVentas(mesRef),
    obtenerCostosFijos(),
  ]);

  const mesAnterior = new Date(mesRef.getFullYear(), mesRef.getMonth() - 1, 1);
  const mesSiguiente = new Date(mesRef.getFullYear(), mesRef.getMonth() + 1, 1);
  const etiquetaMes = `${NOMBRES_MES[mesRef.getMonth()]} ${mesRef.getFullYear()}`;

  const escalaMax = Math.max(META_FINAL.max, unidadesMes) * 1.05;
  const totalCanales = porCanal.reduce((s, c) => s + c.total, 0);
  const maxSemana = Math.max(1, ...semanas.map((s) => s.unidades));

  // Reparto del dinero: por cada pieza vendida se separan primero los costos fijos
  // (mano de obra, empaque, pago a Gaby); de lo que queda, 10% es para Arie y el
  // resto se divide en partes iguales entre reinversión y Gaby.
  const costoFijoUnitario = costosFijos.costo_mano_obra + costosFijos.costo_empaque + costosFijos.costo_pago_hermana;
  const manoObraTotal = costosFijos.costo_mano_obra * unidadesMes;
  const empaqueTotal = costosFijos.costo_empaque * unidadesMes;
  const gabyFijoTotal = costosFijos.costo_pago_hermana * unidadesMes;
  const costoFijoTotal = manoObraTotal + empaqueTotal + gabyFijoTotal;
  const restante = Math.max(0, totalCanales - costoFijoTotal);
  const arieTotal = restante * 0.1;
  const reinversionTotal = (restante - arieTotal) * 0.5;
  const gabyTotal = gabyFijoTotal + (restante - arieTotal) * 0.5;
  const escalaReparto = Math.max(totalCanales, costoFijoTotal, 1);
  const reparto = [
    { nombre: "Mano de obra", total: manoObraTotal },
    { nombre: "Empaque", total: empaqueTotal },
    { nombre: "Gaby", total: gabyTotal },
    { nombre: "Arie", total: arieTotal },
    { nombre: "Reinversión", total: reinversionTotal },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Indicadores clave del mes seleccionado.</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
          <Link
            href={`/ventas/dashboard?mes=${formatoMes(mesAnterior)}`}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="size-4" />
          </Link>
          <span className="w-32 text-center text-sm font-medium text-foreground">{etiquetaMes}</span>
          <Link
            href={`/ventas/dashboard?mes=${formatoMes(mesSiguiente)}`}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="size-4" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* KPI 1.1 — Unidades vendidas / mes */}
        <div className="space-y-5 rounded-xl border border-border bg-card p-5">
          <div>
            <h2 className="text-sm font-medium text-muted-foreground">Unidades vendidas / mes</h2>
            <p className="text-3xl font-semibold text-foreground">{unidadesMes}</p>
          </div>

          <div className="space-y-2">
            <div className="relative h-3 rounded-full bg-muted">
              <div
                className="absolute inset-y-0 rounded-full bg-secondary"
                style={{ left: `${pct(META_ARRANQUE.min, escalaMax)}%`, width: `${pct(META_ARRANQUE.max - META_ARRANQUE.min, escalaMax)}%` }}
                title={`Meta de arranque: ${META_ARRANQUE.min}–${META_ARRANQUE.max}`}
              />
              <div
                className="absolute inset-y-0 rounded-full bg-accent"
                style={{ left: `${pct(META_FINAL.min, escalaMax)}%`, width: `${pct(META_FINAL.max - META_FINAL.min, escalaMax)}%` }}
                title={`Meta final: ${META_FINAL.min}–${META_FINAL.max}`}
              />
              <div
                className="absolute inset-y-0 rounded-full bg-primary"
                style={{ width: `${Math.min(pct(unidadesMes, escalaMax), 100)}%` }}
              />
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-secondary" /> Arranque {META_ARRANQUE.min}–{META_ARRANQUE.max}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-accent" /> Meta final {META_FINAL.min}–{META_FINAL.max}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground">Corte semanal</h3>
            <div className="space-y-1.5">
              {semanas.map((s) => (
                <div key={s.semana} className="flex items-center gap-2 text-sm">
                  <span className="w-24 shrink-0 text-muted-foreground">{s.rango}</span>
                  <div className="h-2.5 flex-1 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary/70"
                      style={{ width: `${(s.unidades / maxSemana) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right font-medium text-foreground">{s.unidades}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* KPI 1.2 — Ventas por canal */}
        <div className="space-y-4 rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-medium text-muted-foreground">Ventas por canal</h2>

          {porCanal.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Sin ventas registradas este mes.</p>
          ) : (
            <div className="space-y-3">
              {porCanal.map((c) => {
                const color = COLOR_CANAL[c.nombre] ?? COLOR_SIN_CANAL;
                const ancho = pct(c.total, totalCanales);
                return (
                  <div key={c.id_canal ?? "sin-canal"} className="space-y-1">
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="font-medium text-foreground">{c.nombre}</span>
                      <span className="text-muted-foreground">
                        ${c.total.toFixed(2)} · {c.unidades} pieza{c.unidades === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-muted">
                      <div className="h-full rounded-full" style={{ width: `${ancho}%`, backgroundColor: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* KPI 1.3 — Reparto del dinero */}
      <div className="space-y-4 rounded-xl border border-border bg-card p-5">
        <div>
          <h2 className="text-sm font-medium text-muted-foreground">Reparto del dinero</h2>
          <p className="text-xs text-muted-foreground">
            Por pieza vendida: ${costosFijos.costo_mano_obra.toFixed(2)} mano de obra + ${costosFijos.costo_pago_hermana.toFixed(2)} Gaby
            + ${costosFijos.costo_empaque.toFixed(2)} empaque (${costoFijoUnitario.toFixed(2)} fijo). De lo que sobra: 10% Arie, el
            resto se reparte mitad reinversión y mitad Gaby.
          </p>
        </div>

        {unidadesMes === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Sin ventas registradas este mes.</p>
        ) : (
          <div className="space-y-3">
            {reparto.map((r) => (
              <div key={r.nombre} className="space-y-1">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-medium text-foreground">{r.nombre}</span>
                  <span className="text-muted-foreground">${r.total.toFixed(2)}</span>
                </div>
                <div className="h-2.5 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct(r.total, escalaReparto)}%`, backgroundColor: COLOR_REPARTO[r.nombre] }}
                  />
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm">
              <span className="text-muted-foreground">Ingresos del mes</span>
              <span className="font-semibold text-foreground">${totalCanales.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
