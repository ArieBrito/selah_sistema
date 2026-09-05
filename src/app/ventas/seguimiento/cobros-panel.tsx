"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { VentaPorCobrar } from "@/app/ventas/finanzas";
import type { MetodoOption } from "@/app/ventas/types";
import { registrarCobro, eliminarCobro } from "./actions";

export function CobrosPanel({ ventas, metodos }: { ventas: VentaPorCobrar[]; metodos: MetodoOption[] }) {
  const router = useRouter();
  const [expandida, setExpandida] = useState<number | null>(null);
  const [venta, setVenta] = useState<VentaPorCobrar | null>(null);
  const [campos, setCampos] = useState({ fecha: "", monto: "", idMetodo: null as number | null, nota: "" });
  const [guardando, setGuardando] = useState(false);

  const totalPorCobrar = ventas.reduce((s, v) => s + v.saldo, 0);

  function abrirCobro(v: VentaPorCobrar) {
    setVenta(v);
    setCampos({ fecha: format(new Date(), "yyyy-MM-dd"), monto: v.saldo.toFixed(2), idMetodo: null, nota: "" });
  }

  async function guardar() {
    if (!venta) return;
    const monto = Number(campos.monto);
    if (!campos.fecha) return toast.error("La fecha es obligatoria.");
    if (!Number.isFinite(monto) || monto <= 0) return toast.error("El monto debe ser mayor a 0.");
    if (monto > venta.saldo + 0.005) return toast.error(`El cobro no puede superar el saldo de $${venta.saldo.toFixed(2)}.`);

    setGuardando(true);
    try {
      await registrarCobro({
        id_venta: venta.id_venta,
        fecha: campos.fecha,
        monto,
        id_metodo: campos.idMetodo,
        nota: campos.nota,
      });
      toast.success("Cobro registrado");
      setVenta(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo registrar el cobro.");
    } finally {
      setGuardando(false);
    }
  }

  async function borrarCobro(id_cobro: number) {
    try {
      await eliminarCobro(id_cobro);
      toast.success("Cobro eliminado");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar el cobro.");
    }
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-8" />
              <TableHead>Fecha</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Canal / tipo</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Cobrado</TableHead>
              <TableHead className="text-right">Falta</TableHead>
              <TableHead className="w-28" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {ventas.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  No hay ventas pendientes de cobro.
                </TableCell>
              </TableRow>
            )}
            {ventas.map((v) => {
              const abierta = expandida === v.id_venta;
              return (
                <Fragment key={v.id_venta}>
                  <TableRow className="cursor-pointer" onClick={() => setExpandida(abierta ? null : v.id_venta)}>
                    <TableCell className="text-muted-foreground">
                      {abierta ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{format(new Date(v.fecha_hora), "dd/MM/yyyy")}</TableCell>
                    <TableCell className="font-medium text-foreground">{v.clienteNombre ?? "Cliente general"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {v.canalNombre ?? "Sin canal"} · {v.tipo_venta}
                    </TableCell>
                    <TableCell className="text-right text-foreground">${v.total.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">${v.cobrado.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-semibold text-destructive">${v.saldo.toFixed(2)}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          abrirCobro(v);
                        }}
                      >
                        Cobrar
                      </Button>
                    </TableCell>
                  </TableRow>

                  {abierta && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell />
                      <TableCell colSpan={7} className="py-2">
                        {v.cobros.length === 0 ? (
                          <p className="py-2 text-sm text-muted-foreground">Sin cobros registrados todavía.</p>
                        ) : (
                          <div className="space-y-1">
                            {v.cobros.map((c) => (
                              <div key={c.id_cobro} className="flex items-center justify-between gap-3 text-sm">
                                <span className="text-muted-foreground">
                                  {c.fecha} · ${c.monto.toFixed(2)}
                                  {c.metodoNombre ? ` · ${c.metodoNombre}` : ""}
                                  {c.nota ? ` · ${c.nota}` : ""}
                                </span>
                                <Button size="icon" variant="ghost" onClick={() => borrarCobro(c.id_cobro)}>
                                  <Trash2 className="size-3.5 text-destructive" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {ventas.length > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm">
          <span className="text-muted-foreground">Total por cobrar</span>
          <span className="font-semibold text-foreground">${totalPorCobrar.toFixed(2)}</span>
        </div>
      )}

      <Dialog open={venta !== null} onOpenChange={(open) => !open && setVenta(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar cobro</DialogTitle>
          </DialogHeader>

          {venta && (
            <div className="space-y-3">
              <div className="rounded-lg bg-muted px-3 py-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>{venta.clienteNombre ?? "Cliente general"}</span>
                  <span>Total ${venta.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-medium text-foreground">
                  <span>Saldo pendiente</span>
                  <span>${venta.saldo.toFixed(2)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="cobro_fecha">Fecha *</Label>
                  <Input
                    id="cobro_fecha"
                    type="date"
                    value={campos.fecha}
                    onChange={(e) => setCampos((prev) => ({ ...prev, fecha: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cobro_monto">Monto *</Label>
                  <Input
                    id="cobro_monto"
                    type="number"
                    min="0"
                    step="any"
                    value={campos.monto}
                    onChange={(e) => setCampos((prev) => ({ ...prev, monto: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Método de pago</Label>
                <Select
                  value={campos.idMetodo?.toString() ?? ""}
                  onValueChange={(v) => setCampos((prev) => ({ ...prev, idMetodo: Number(v) }))}
                  items={Object.fromEntries(metodos.map((m) => [m.id.toString(), m.nombre]))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Elige un método" />
                  </SelectTrigger>
                  <SelectContent>
                    {metodos.map((m) => (
                      <SelectItem key={m.id} value={m.id.toString()}>
                        {m.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cobro_nota">Nota</Label>
                <Input
                  id="cobro_nota"
                  placeholder="Ej. primer abono de la consignación"
                  value={campos.nota}
                  onChange={(e) => setCampos((prev) => ({ ...prev, nota: e.target.value }))}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setVenta(null)}>
              Cancelar
            </Button>
            <Button type="button" onClick={guardar} loading={guardando}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
