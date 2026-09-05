"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { crearRegistroProduccion, actualizarRegistroProduccion } from "./actions";
import type { RegistroProduccionRow, EmpleadoOption, ProductoOption } from "./types";

type Campos = {
  fecha: string;
  idEmpleado: number | null;
  idProducto: string | null;
  cantidad: number;
  minutos: string;
};

function valoresIniciales(registro: RegistroProduccionRow | null): Campos {
  return {
    fecha: registro?.fecha ?? new Date().toISOString().slice(0, 10),
    idEmpleado: registro?.id_empleado ?? null,
    idProducto: registro?.id_producto ?? null,
    cantidad: registro?.cantidad ?? 1,
    minutos: registro?.minutos?.toString() ?? "",
  };
}

export function RegistroForm({
  open,
  onOpenChange,
  registro,
  empleados,
  pulseras,
  costoManoObra,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registro: RegistroProduccionRow | null;
  empleados: EmpleadoOption[];
  pulseras: ProductoOption[];
  costoManoObra: number;
}) {
  const router = useRouter();
  const esEdicion = registro !== null;

  const [campos, setCampos] = useState<Campos>(() => valoresIniciales(registro));
  const [guardando, setGuardando] = useState(false);

  const [openAnterior, setOpenAnterior] = useState(open);
  if (open !== openAnterior) {
    setOpenAnterior(open);
    if (open) setCampos(valoresIniciales(registro));
  }

  const { fecha, idEmpleado, idProducto, cantidad, minutos } = campos;
  const pagoEstimado = cantidad * costoManoObra;

  async function handleGuardar() {
    if (!idEmpleado) {
      toast.error("Elige un empleado.");
      return;
    }
    if (!idProducto) {
      toast.error("Elige un diseño.");
      return;
    }
    setGuardando(true);
    const payload = {
      fecha,
      id_empleado: idEmpleado,
      id_producto: idProducto,
      cantidad,
      minutos: minutos ? Number(minutos) : undefined,
    };
    const resultado = esEdicion ? await actualizarRegistroProduccion(registro!.id_produccion, payload) : await crearRegistroProduccion(payload);
    setGuardando(false);

    if (!resultado.ok) {
      toast.error("error" in resultado ? String(resultado.error) : "No se pudo guardar el registro.");
      return;
    }
    toast.success(esEdicion ? "Registro actualizado" : "Registro guardado");
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{esEdicion ? "Editar registro" : "Nuevo registro de producción"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="fecha">Fecha *</Label>
              <Input
                id="fecha"
                type="date"
                value={fecha}
                onChange={(e) => setCampos((prev) => ({ ...prev, fecha: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Empleado *</Label>
              <Select
                value={idEmpleado?.toString() ?? ""}
                onValueChange={(v) => setCampos((prev) => ({ ...prev, idEmpleado: Number(v) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Elige un empleado" />
                </SelectTrigger>
                <SelectContent>
                  {empleados.map((e) => (
                    <SelectItem key={e.id} value={e.id.toString()}>
                      {e.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Diseño *</Label>
            <Select value={idProducto ?? ""} onValueChange={(v) => setCampos((prev) => ({ ...prev, idProducto: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Elige una pulsera" />
              </SelectTrigger>
              <SelectContent>
                {pulseras.map((p) => (
                  <SelectItem key={p.id_producto} value={p.id_producto}>
                    {p.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cantidad">Piezas hechas *</Label>
              <Input
                id="cantidad"
                type="number"
                min="1"
                step="1"
                value={cantidad}
                onChange={(e) => setCampos((prev) => ({ ...prev, cantidad: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="minutos">Minutos (opcional)</Label>
              <Input
                id="minutos"
                type="number"
                min="1"
                step="1"
                placeholder="Ej. 45"
                value={minutos}
                onChange={(e) => setCampos((prev) => ({ ...prev, minutos: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm">
            <span className="text-muted-foreground">Pago por esta tanda</span>
            <span className="font-semibold text-foreground">${pagoEstimado.toFixed(2)}</span>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleGuardar} loading={guardando}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
