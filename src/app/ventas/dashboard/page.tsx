import { obtenerKpisVentas } from "../data";

const META_ARRANQUE = { min: 150, max: 200 };
const META_FINAL = { min: 546, max: 682 };

const COLOR_CANAL: Record<string, string> = {
  Personal: "#2f8f5e",
  Bazar: "#d99a10",
  WhatsApp: "#e8602a",
  Redes: "#d94f6b",
  Consignación: "#7a3f8a",
  Referidos: "#1173a6",
};
const COLOR_SIN_CANAL = "#9a9890";

function pct(valor: number, total: number) {
  return total > 0 ? (valor / total) * 100 : 0;
}

export default async function DashboardVentasPage() {
  const { unidadesMes, semanas, porCanal } = await obtenerKpisVentas();

  const escalaMax = Math.max(META_FINAL.max, unidadesMes) * 1.05;
  const totalCanales = porCanal.reduce((s, c) => s + c.total, 0);
  const maxSemana = Math.max(1, ...semanas.map((s) => s.unidades));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Indicadores clave del mes en curso.</p>
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
    </div>
  );
}
