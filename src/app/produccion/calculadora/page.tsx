import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BadgeClasificacion } from "@/components/badge-clasificacion";
import { listarDisenos } from "./data";

export default async function CalculadoraPage() {
  const disenos = await listarDisenos();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Calculadora de precios</h1>
          <p className="text-sm text-muted-foreground">Arma un diseño con tus materiales y obtén el precio sugerido.</p>
        </div>
        <Link href="/produccion/calculadora/nuevo" className={buttonVariants({ size: "lg", className: "gap-2" })}>
          <Plus className="size-4" /> Nuevo diseño
        </Link>
      </div>

      {disenos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
          Aún no tienes diseños. Crea el primero con &quot;+ Nuevo diseño&quot;.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {disenos.map((d) => (
            <Link key={d.id} href={`/produccion/calculadora/${d.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="space-y-3 pt-6">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-medium text-foreground">{d.nombre}</h2>
                    <BadgeClasificacion clasif={d.id_clasif} />
                  </div>
                  <div className="text-3xl font-semibold text-foreground">${d.precio.toFixed(2)}</div>
                  <div
                    className={`text-sm font-medium ${d.margenReal >= 0.3 ? "text-primary" : "text-destructive"}`}
                  >
                    Margen real: {(d.margenReal * 100).toFixed(1)}%
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
