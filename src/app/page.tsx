import Image from "next/image";
import { obtenerResumenInicio } from "./data";

function formatoMoneda(valor: number) {
  return `$${valor.toFixed(2)}`;
}

export default async function Home() {
  const { ventasMesTotal, stockTotal, dineroEnCaja } = await obtenerResumenInicio();

  const tarjetas = [
    { label: "Ventas", valor: formatoMoneda(ventasMesTotal) },
    { label: "Stock", valor: `${stockTotal} pulseras` },
    { label: "Dinero en caja", valor: formatoMoneda(dineroEnCaja) },
  ];

  return (
    <div className="mx-auto flex max-w-6xl flex-col items-center gap-10 px-4 py-10 sm:px-6">
      <Image src="/logotipo.png" alt="Selah" width={360} height={110} priority className="h-auto w-64 sm:w-80" />

      <div className="grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
        {tarjetas.map((t) => (
          <div key={t.label} className="overflow-hidden rounded-xl border border-border">
            <div className="bg-primary px-4 py-2 text-center text-xs font-semibold tracking-wide text-primary-foreground uppercase">
              {t.label}
            </div>
            <div className="flex h-24 items-center justify-center bg-primary/10 px-4">
              <span className="text-2xl font-semibold text-foreground">{t.valor}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
