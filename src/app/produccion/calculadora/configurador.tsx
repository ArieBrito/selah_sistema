"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BadgeClasificacion } from "@/components/badge-clasificacion";
import { calcularMargenReal, calcularPrecioFinal, calcularResumen, margenToMarkup, type NivelClasificacion } from "@/lib/pricing";
import { guardarDiseno } from "./actions";
import { MaterialPicker, type MaterialOption } from "./material-picker";

type Linea = { id_material: string; nombre: string; costoUnitario: number; cantidad: number };

export function Configurador({
  contexto,
  disenoExistente,
}: {
  contexto: {
    fijos: { costo_mano_obra: number; costo_empaque: number; costo_pago_hermana: number };
    niveles: NivelClasificacion[];
    tiposHilo: { id: number; nombre: string; costo: number }[];
    materiales: MaterialOption[];
  };
  disenoExistente?: {
    id: number;
    nombre: string;
    id_tipo_hilo: number | null;
    precioActual: number;
    lineas: { id_material: string; cantidad: number }[];
  } | null;
}) {
  const router = useRouter();
  const [nombre, setNombre] = useState(disenoExistente?.nombre ?? "");
  const [idTipoHilo, setIdTipoHilo] = useState<number | null>(
    disenoExistente?.id_tipo_hilo ?? contexto.tiposHilo[0]?.id ?? null
  );
  const [lineas, setLineas] = useState<Linea[]>(() =>
    (disenoExistente?.lineas ?? []).map((l) => {
      const material = contexto.materiales.find((m) => m.id_material === l.id_material);
      return { id_material: l.id_material, nombre: material?.nombre ?? "Material", costoUnitario: material?.costoUnitario ?? 0, cantidad: l.cantidad };
    })
  );
  const [precioManual, setPrecioManual] = useState("");
  const [guardando, setGuardando] = useState(false);

  const costoHilo = contexto.tiposHilo.find((t) => t.id === idTipoHilo)?.costo ?? 0;

  const resumen = useMemo(
    () =>
      calcularResumen(
        lineas.map((l) => ({ cantidad: l.cantidad, costoUnitario: l.costoUnitario })),
        costoHilo,
        contexto.fijos,
        contexto.niveles,
        disenoExistente?.precioActual
      ),
    [lineas, costoHilo, contexto.fijos, contexto.niveles, disenoExistente?.precioActual]
  );

  const precioSugerido = resumen.nivel ? resumen.nivel.precio_tarifa : Number(precioManual) || 0;
  const precioFinal = calcularPrecioFinal(precioSugerido, disenoExistente?.precioActual);
  const margenReal = calcularMargenReal(precioFinal, resumen.costoCargado);
  const markupReal = margenToMarkup(Math.max(margenReal, 0));

  function agregarMaterial(material: MaterialOption) {
    setLineas((prev) => [...prev, { id_material: material.id_material, nombre: material.nombre, costoUnitario: material.costoUnitario, cantidad: 1 }]);
  }

  function quitarMaterial(id_material: string) {
    setLineas((prev) => prev.filter((l) => l.id_material !== id_material));
  }

  function actualizarCantidad(id_material: string, cantidad: number) {
    setLineas((prev) => prev.map((l) => (l.id_material === id_material ? { ...l, cantidad } : l)));
  }

  async function guardar() {
    if (!nombre.trim()) return toast.error("Ponle un nombre al diseño.");
    if (!idTipoHilo) return toast.error("Selecciona un tipo de hilo.");
    if (lineas.length === 0) return toast.error("Agrega al menos un material.");

    setGuardando(true);
    const resultado = await guardarDiseno({
      id: disenoExistente?.id,
      nombre: nombre.trim(),
      id_tipo_hilo: idTipoHilo,
      lineas: lineas.map((l) => ({ id_material: l.id_material, cantidad: l.cantidad })),
      precioManual: resumen.nivel ? undefined : Number(precioManual) || undefined,
    });
    setGuardando(false);

    if (!resultado.ok) {
      toast.error(resultado.error);
      return;
    }
    toast.success("Diseño guardado");
    router.push("/produccion/calculadora");
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div className="space-y-1.5">
          <Label htmlFor="nombre-diseno">Nombre del diseño</Label>
          <Input
            id="nombre-diseno"
            placeholder="Ej. Pulsera Amanecer"
            className="text-lg"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Tipo de hilo</Label>
          <div className="flex flex-wrap gap-2">
            {contexto.tiposHilo.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => setIdTipoHilo(h.id)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  idTipoHilo === h.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:border-primary"
                }`}
              >
                {h.nombre} · ${h.costo.toFixed(2)}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Materiales</Label>
            <MaterialPicker
              materiales={contexto.materiales}
              yaAgregados={lineas.map((l) => l.id_material)}
              onSeleccionar={agregarMaterial}
            />
          </div>

          {lineas.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
              Agrega materiales desde tu inventario.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/50 text-left text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Material</th>
                    <th className="px-3 py-2 font-medium">Cantidad</th>
                    <th className="px-3 py-2 font-medium">Costo unitario</th>
                    <th className="px-3 py-2 font-medium">Costo total</th>
                    <th className="w-10 px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {lineas.map((l) => (
                    <tr key={l.id_material} className="border-b border-border last:border-0">
                      <td className="px-3 py-2 text-foreground">{l.nombre}</td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          min="0"
                          step="any"
                          className="w-24"
                          value={l.cantidad}
                          onChange={(e) => actualizarCantidad(l.id_material, Number(e.target.value))}
                        />
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">${l.costoUnitario.toFixed(4)}</td>
                      <td className="px-3 py-2 font-medium text-foreground">${(l.cantidad * l.costoUnitario).toFixed(2)}</td>
                      <td className="px-3 py-2">
                        <Button size="icon" variant="ghost" onClick={() => quitarMaterial(l.id_material)}>
                          <X className="size-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="lg:col-span-1">
        <Card className="sticky top-24">
          <CardHeader>
            <CardTitle>Resumen de costos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Fila etiqueta="Costo materiales" valor={resumen.costoMateriales} />
            <Fila etiqueta="Costo hilo" valor={resumen.costoHilo} />
            <Fila
              etiqueta="Fijo (mano de obra + empaque + hermana)"
              valor={contexto.fijos.costo_mano_obra + contexto.fijos.costo_empaque + contexto.fijos.costo_pago_hermana}
            />
            <Separator />
            <Fila etiqueta="Costo cargado" valor={resumen.costoCargado} destacado />
            <Fila etiqueta="Precio mínimo (margen 30%)" valor={resumen.precioMinimo} />

            <Separator />

            {resumen.nivel ? (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Precio sugerido</span>
                <div className="flex items-center gap-2">
                  <BadgeClasificacion clasif={resumen.nivel.id_clasif} />
                  <span className="font-semibold text-foreground">${resumen.nivel.precio_tarifa.toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2 rounded-lg bg-accent/40 p-3">
                <p className="text-sm text-accent-foreground">
                  Este diseño supera la escalera estándar (costo &gt; $280). Define un precio manual.
                </p>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  placeholder={`Sugerido: $${resumen.precioMinimo.toFixed(2)} o más`}
                  value={precioManual}
                  onChange={(e) => setPrecioManual(e.target.value)}
                />
              </div>
            )}

            {disenoExistente && precioFinal > precioSugerido && (
              <p className="text-xs text-muted-foreground">
                El precio no baja de ${disenoExistente.precioActual.toFixed(2)} (precio actual).
              </p>
            )}

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Precio final</span>
              <span className="text-2xl font-semibold text-foreground">${precioFinal.toFixed(2)}</span>
            </div>

            <div className={`flex items-center justify-between font-medium ${margenReal >= 0.3 ? "text-primary" : "text-destructive"}`}>
              <span>Margen real</span>
              <span>{(margenReal * 100).toFixed(1)}%</span>
            </div>
            {margenReal < 0.3 && (
              <p className="text-xs text-destructive">Advertencia: el margen queda por debajo del 30% objetivo.</p>
            )}
            <p className="text-xs text-muted-foreground">Markup equivalente: {(markupReal * 100).toFixed(1)}%</p>

            <Button size="lg" className="w-full" onClick={guardar} disabled={guardando}>
              Guardar diseño
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Fila({ etiqueta, valor, destacado }: { etiqueta: string; valor: number; destacado?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{etiqueta}</span>
      <span className={destacado ? "font-semibold text-foreground" : "text-foreground"}>${valor.toFixed(2)}</span>
    </div>
  );
}
