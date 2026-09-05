"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { crearGasto, actualizarGasto } from "./actions";
import type { GastoRow, TipoGastoOption } from "./types";

type Campos = {
  fecha: string;
  idTipoGasto: number | null;
  descripcion: string;
  monto: number;
};

function valoresIniciales(gasto: GastoRow | null): Campos {
  return {
    fecha: gasto?.fecha ?? new Date().toISOString().slice(0, 10),
    idTipoGasto: gasto?.id_tipo_gasto ?? null,
    descripcion: gasto?.descripcion ?? "",
    monto: gasto?.monto ?? 0,
  };
}

export function GastoForm({
  open,
  onOpenChange,
  gasto,
  tiposGasto,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gasto: GastoRow | null;
  tiposGasto: TipoGastoOption[];
}) {
  const router = useRouter();
  const esEdicion = gasto !== null;

  const [campos, setCampos] = useState<Campos>(() => valoresIniciales(gasto));
  const [guardando, setGuardando] = useState(false);

  const [openAnterior, setOpenAnterior] = useState(open);
  if (open !== openAnterior) {
    setOpenAnterior(open);
    if (open) setCampos(valoresIniciales(gasto));
  }

  const { fecha, idTipoGasto, descripcion, monto } = campos;

  async function handleGuardar() {
    if (!idTipoGasto) {
      toast.error("Elige un tipo de gasto.");
      return;
    }
    setGuardando(true);
    const payload = { fecha, id_tipo_gasto: idTipoGasto, descripcion, monto };
    const resultado = esEdicion ? await actualizarGasto(gasto!.id_gasto, payload) : await crearGasto(payload);
    setGuardando(false);

    if (!resultado.ok) {
      toast.error("error" in resultado ? String(resultado.error) : "No se pudo guardar el gasto.");
      return;
    }
    toast.success(esEdicion ? "Gasto actualizado" : "Gasto registrado");
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{esEdicion ? "Editar gasto" : "Nuevo gasto"}</DialogTitle>
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
              <Label>Tipo *</Label>
              <Select
                value={idTipoGasto?.toString() ?? ""}
                onValueChange={(v) => setCampos((prev) => ({ ...prev, idTipoGasto: Number(v) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Elige un tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tiposGasto.map((t) => (
                    <SelectItem key={t.id} value={t.id.toString()}>
                      {t.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="descripcion">Descripción</Label>
            <Input
              id="descripcion"
              placeholder="Ej. Renta de stand bazar septiembre"
              value={descripcion}
              onChange={(e) => setCampos((prev) => ({ ...prev, descripcion: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="monto">Monto *</Label>
            <Input
              id="monto"
              type="number"
              min="0"
              step="any"
              value={monto}
              onChange={(e) => setCampos((prev) => ({ ...prev, monto: Number(e.target.value) }))}
            />
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
