"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { conceptosReparto, type ConceptoReparto } from "@/lib/validations";
import type { EntregaRow, FilaReparto } from "@/app/ventas/finanzas";
import { guardarEntrega, eliminarEntrega } from "./actions";

type Campos = { fecha: string; concepto: ConceptoReparto; monto: string; nota: string };

function camposIniciales(entrega: EntregaRow | null, concepto: ConceptoReparto, montoSugerido: number): Campos {
  if (entrega) {
    return { fecha: entrega.fecha, concepto: entrega.concepto, monto: String(entrega.monto), nota: entrega.nota ?? "" };
  }
  return {
    fecha: format(new Date(), "yyyy-MM-dd"),
    concepto,
    monto: montoSugerido > 0 ? montoSugerido.toFixed(2) : "",
    nota: "",
  };
}

export function RepartoPanel({
  filas,
  entregas,
  base,
  unidades,
}: {
  filas: FilaReparto[];
  entregas: EntregaRow[];
  base: number;
  unidades: number;
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [editando, setEditando] = useState<EntregaRow | null>(null);
  const [campos, setCampos] = useState<Campos>(() => camposIniciales(null, "Gaby", 0));
  const [guardando, setGuardando] = useState(false);
  const [aEliminar, setAEliminar] = useState<EntregaRow | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const totalDevengado = filas.reduce((s, f) => s + f.devengado, 0);
  const totalEntregado = filas.reduce((s, f) => s + f.entregado, 0);
  const totalSaldo = totalDevengado - totalEntregado;

  function abrirNueva(concepto: ConceptoReparto, montoSugerido: number) {
    setEditando(null);
    setCampos(camposIniciales(null, concepto, montoSugerido));
    setAbierto(true);
  }

  function abrirEdicion(entrega: EntregaRow) {
    setEditando(entrega);
    setCampos(camposIniciales(entrega, entrega.concepto, 0));
    setAbierto(true);
  }

  async function guardar() {
    const monto = Number(campos.monto);
    if (!campos.fecha) return toast.error("La fecha es obligatoria.");
    if (!Number.isFinite(monto) || monto <= 0) return toast.error("El monto debe ser mayor a 0.");

    setGuardando(true);
    try {
      await guardarEntrega({
        id: editando?.id_entrega,
        fecha: campos.fecha,
        concepto: campos.concepto,
        monto,
        nota: campos.nota,
      });
      toast.success(editando ? "Entrega actualizada" : "Entrega registrada");
      setAbierto(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar la entrega.");
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarEliminar() {
    if (!aEliminar) return;
    setEliminando(true);
    try {
      await eliminarEntrega(aEliminar.id_entrega);
      toast.success("Entrega eliminada");
      setAEliminar(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar la entrega.");
    } finally {
      setEliminando(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Concepto</TableHead>
              <TableHead className="text-right">Le toca</TableHead>
              <TableHead className="text-right">Ya entregado</TableHead>
              <TableHead className="text-right">Saldo pendiente</TableHead>
              <TableHead className="w-32" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filas.map((f) => (
              <TableRow key={f.concepto} className="hover:bg-transparent">
                <TableCell className="font-medium text-foreground">{f.concepto}</TableCell>
                <TableCell className="text-right text-foreground">${f.devengado.toFixed(2)}</TableCell>
                <TableCell className="text-right text-muted-foreground">${f.entregado.toFixed(2)}</TableCell>
                <TableCell
                  className={`text-right font-semibold ${
                    f.saldo > 0.005 ? "text-destructive" : f.saldo < -0.005 ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  ${f.saldo.toFixed(2)}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1 text-muted-foreground"
                    onClick={() => abrirNueva(f.concepto, Math.max(0, f.saldo))}
                  >
                    <Plus className="size-3.5" /> Entrega
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="border-t-2 border-border bg-muted/40 hover:bg-muted/40">
              <TableCell className="font-semibold text-foreground">Total</TableCell>
              <TableCell className="text-right font-semibold text-foreground">${totalDevengado.toFixed(2)}</TableCell>
              <TableCell className="text-right font-semibold text-foreground">${totalEntregado.toFixed(2)}</TableCell>
              <TableCell className="text-right font-semibold text-foreground">${totalSaldo.toFixed(2)}</TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        Se reparte el dinero cobrado en el mes (${base.toFixed(2)}). Primero se cubren los costos por pieza de las {unidades}{" "}
        pieza{unidades === 1 ? "" : "s"} vendidas; de lo que sobra, 15% es de Arie y el resto se divide mitad reinversión y mitad
        Gaby.
      </p>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Entregas registradas este mes</h3>
        <Button size="sm" onClick={() => abrirNueva("Gaby", 0)} className="gap-1.5">
          <Plus className="size-3.5" /> Registrar entrega
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Fecha</TableHead>
              <TableHead>A quién / concepto</TableHead>
              <TableHead>Nota</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {entregas.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  Todavía no has registrado entregas este mes.
                </TableCell>
              </TableRow>
            )}
            {entregas.map((e) => (
              <TableRow key={e.id_entrega} className="group cursor-pointer" onClick={() => abrirEdicion(e)}>
                <TableCell className="text-muted-foreground">{e.fecha}</TableCell>
                <TableCell className="font-medium text-foreground">{e.concepto}</TableCell>
                <TableCell className="text-muted-foreground">{e.nota || "—"}</TableCell>
                <TableCell className="text-right font-semibold text-foreground">${e.monto.toFixed(2)}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100 max-sm:opacity-100">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        abrirEdicion(e);
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        setAEliminar(e);
                      }}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar entrega" : "Registrar entrega"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="entrega_fecha">Fecha *</Label>
                <Input
                  id="entrega_fecha"
                  type="date"
                  value={campos.fecha}
                  onChange={(e) => setCampos((prev) => ({ ...prev, fecha: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="entrega_monto">Monto *</Label>
                <Input
                  id="entrega_monto"
                  type="number"
                  min="0"
                  step="any"
                  value={campos.monto}
                  onChange={(e) => setCampos((prev) => ({ ...prev, monto: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>A quién / concepto *</Label>
              <Select
                value={campos.concepto}
                onValueChange={(v) => setCampos((prev) => ({ ...prev, concepto: v as ConceptoReparto }))}
                items={Object.fromEntries(conceptosReparto.map((c) => [c, c]))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {conceptosReparto.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="entrega_nota">Nota</Label>
              <Input
                id="entrega_nota"
                placeholder="Ej. pago a Wanda por 12 piezas"
                value={campos.nota}
                onChange={(e) => setCampos((prev) => ({ ...prev, nota: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setAbierto(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={guardar} loading={guardando}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={aEliminar !== null} onOpenChange={(open) => !open && setAEliminar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta entrega?</AlertDialogTitle>
            <AlertDialogDescription>
              El saldo del concepto volverá a subir. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarEliminar} loading={eliminando} className="bg-destructive hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
