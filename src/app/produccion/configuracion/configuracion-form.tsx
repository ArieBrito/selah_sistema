"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { actualizarCostosFijos, actualizarTipoHilo, crearTipoHilo } from "./actions";

type Configuracion = { costo_mano_obra: number; costo_empaque: number; costo_pago_hermana: number };
type TipoHilo = { id: number; nombre: string; costo: number };
type Clasificacion = { id_clasif: string; descripcion: string | null; precio_tarifa: number; costo_max: number | null };

export function ConfiguracionForm({
  configuracion,
  tiposHilo,
  clasificaciones,
}: {
  configuracion: Configuracion;
  tiposHilo: TipoHilo[];
  clasificaciones: Clasificacion[];
}) {
  const router = useRouter();
  const [costos, setCostos] = useState(configuracion);
  const [guardandoCostos, setGuardandoCostos] = useState(false);
  const [hilos, setHilos] = useState(tiposHilo);
  const [nuevoHilo, setNuevoHilo] = useState({ nombre: "", costo: "" });

  const totalFijo = costos.costo_mano_obra + costos.costo_empaque + costos.costo_pago_hermana;

  async function guardarCostos() {
    setGuardandoCostos(true);
    const resultado = await actualizarCostosFijos(costos);
    setGuardandoCostos(false);
    if (resultado.ok) {
      toast.success("Costos fijos actualizados");
      router.refresh();
    }
  }

  async function guardarHilo(hilo: TipoHilo) {
    const resultado = await actualizarTipoHilo(hilo.id, { nombre: hilo.nombre, costo: hilo.costo });
    if (resultado.ok) toast.success(`${hilo.nombre} actualizado`);
  }

  async function agregarHilo() {
    if (!nuevoHilo.nombre.trim() || nuevoHilo.costo === "") return;
    const resultado = await crearTipoHilo({ nombre: nuevoHilo.nombre.trim(), costo: Number(nuevoHilo.costo) });
    if (resultado.ok) {
      toast.success("Tipo de hilo agregado");
      setNuevoHilo({ nombre: "", costo: "" });
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Configuración</h1>
        <p className="text-sm text-muted-foreground">Ajusta los costos fijos y los tipos de hilo que usa la calculadora.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Costos fijos</CardTitle>
          <CardDescription>Se suman a todos los diseños además del hilo y los materiales.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Mano de obra</Label>
              <Input
                type="number"
                step="any"
                min="0"
                value={costos.costo_mano_obra}
                onChange={(e) => setCostos((c) => ({ ...c, costo_mano_obra: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Empaque</Label>
              <Input
                type="number"
                step="any"
                min="0"
                value={costos.costo_empaque}
                onChange={(e) => setCostos((c) => ({ ...c, costo_empaque: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Pago a hermana</Label>
              <Input
                type="number"
                step="any"
                min="0"
                value={costos.costo_pago_hermana}
                onChange={(e) => setCostos((c) => ({ ...c, costo_pago_hermana: Number(e.target.value) }))}
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2">
            <span className="text-sm text-muted-foreground">Total fijo por diseño</span>
            <span className="font-semibold text-foreground">${totalFijo.toFixed(2)}</span>
          </div>
          <Button onClick={guardarCostos} disabled={guardandoCostos}>
            Guardar costos fijos
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tipos de hilo</CardTitle>
          <CardDescription>Disponibles al elegir el hilo de un diseño en la calculadora.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Costo</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {hilos.map((hilo, i) => (
                <TableRow key={hilo.id}>
                  <TableCell>
                    <Input
                      value={hilo.nombre}
                      onChange={(e) => setHilos((prev) => prev.map((h, j) => (j === i ? { ...h, nombre: e.target.value } : h)))}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="any"
                      min="0"
                      value={hilo.costo}
                      onChange={(e) =>
                        setHilos((prev) => prev.map((h, j) => (j === i ? { ...h, costo: Number(e.target.value) } : h)))
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="secondary" onClick={() => guardarHilo(hilo)}>
                      Guardar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell>
                  <Input
                    placeholder="Nombre del hilo"
                    value={nuevoHilo.nombre}
                    onChange={(e) => setNuevoHilo((n) => ({ ...n, nombre: e.target.value }))}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="Costo"
                    value={nuevoHilo.costo}
                    onChange={(e) => setNuevoHilo((n) => ({ ...n, costo: e.target.value }))}
                  />
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" className="gap-1" onClick={agregarHilo}>
                    <Plus className="size-3.5" /> Agregar
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Escalera de precios</CardTitle>
          <CardDescription>Solo lectura. Cada nivel garantiza un margen mínimo del 30%.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nivel</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Costo máximo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clasificaciones.map((c) => (
                <TableRow key={c.id_clasif}>
                  <TableCell className="font-semibold">{c.id_clasif}</TableCell>
                  <TableCell className="text-muted-foreground">{c.descripcion}</TableCell>
                  <TableCell>{c.precio_tarifa > 0 ? `$${c.precio_tarifa.toFixed(2)}` : "Manual"}</TableCell>
                  <TableCell>{c.costo_max !== null ? `$${c.costo_max.toFixed(2)}` : "Sin tope"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
