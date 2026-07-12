"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { tiposVenta, type TipoVenta } from "@/lib/validations";
import { crearVenta, actualizarVenta, crearCliente } from "./actions";
import type { VentaRow, CanalOption, MetodoOption, ClienteOption, ProductoOption } from "./types";

type Linea = { id_producto: string; nombre: string; cantidad: number; precio_unit: number };

type Campos = {
  fechaHora: string;
  idCliente: number | null;
  tipoVenta: TipoVenta;
  idCanal: number | null;
  idMetodo: number | null;
  descuentoPct: number;
  pagoRecibido: number;
  lineas: Linea[];
};

function ahoraLocal() {
  return format(new Date(), "yyyy-MM-dd'T'HH:mm");
}

function valoresIniciales(venta: VentaRow | null): Campos {
  if (!venta) {
    return {
      fechaHora: ahoraLocal(),
      idCliente: null,
      tipoVenta: "Contado",
      idCanal: null,
      idMetodo: null,
      descuentoPct: 0,
      pagoRecibido: 0,
      lineas: [],
    };
  }

  const subtotal = venta.lineas.reduce((suma, l) => suma + l.cantidad * l.precio_unit, 0);
  const descuentoPct = subtotal > 0 ? (venta.descuento / subtotal) * 100 : 0;

  return {
    fechaHora: format(new Date(venta.fecha_hora), "yyyy-MM-dd'T'HH:mm"),
    idCliente: venta.id_cliente,
    tipoVenta: (venta.tipo_venta as TipoVenta) ?? "Contado",
    idCanal: venta.id_canal,
    idMetodo: venta.id_metodo,
    descuentoPct: Math.round(descuentoPct * 100) / 100,
    pagoRecibido: venta.pago_recibido,
    lineas: venta.lineas.map((l) => ({ id_producto: l.id_producto, nombre: l.nombre, cantidad: l.cantidad, precio_unit: l.precio_unit })),
  };
}

export function VentaForm({
  open,
  onOpenChange,
  venta,
  canales,
  metodos,
  clientes,
  productos,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  venta: VentaRow | null;
  canales: CanalOption[];
  metodos: MetodoOption[];
  clientes: ClienteOption[];
  productos: ProductoOption[];
}) {
  const router = useRouter();
  const esEdicion = venta !== null;

  const [campos, setCampos] = useState<Campos>(() => valoresIniciales(venta));
  const [guardando, setGuardando] = useState(false);
  const [pickerAbierto, setPickerAbierto] = useState(false);

  const [clientesLocal, setClientesLocal] = useState(clientes);
  const [creandoCliente, setCreandoCliente] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({ nombre: "", apellido: "", telefono: "", es_revendedor: false });
  const [guardandoCliente, setGuardandoCliente] = useState(false);

  // Reinicia el formulario cada vez que el diálogo pasa de cerrado a abierto.
  const [openAnterior, setOpenAnterior] = useState(open);
  if (open !== openAnterior) {
    setOpenAnterior(open);
    if (open) {
      setCampos(valoresIniciales(venta));
      setCreandoCliente(false);
    }
  }

  const { fechaHora, idCliente, tipoVenta, idCanal, idMetodo, descuentoPct, pagoRecibido, lineas } = campos;

  const subtotal = lineas.reduce((suma, l) => suma + l.cantidad * l.precio_unit, 0);
  const descuentoMonto = subtotal * (descuentoPct / 100);
  const total = subtotal - descuentoMonto;
  const cambio = pagoRecibido - total;

  function agregarLinea(producto: ProductoOption) {
    setCampos((prev) => ({
      ...prev,
      lineas: [...prev.lineas, { id_producto: producto.id_producto, nombre: producto.nombre, cantidad: 1, precio_unit: producto.precio }],
    }));
    setPickerAbierto(false);
  }

  function quitarLinea(id_producto: string) {
    setCampos((prev) => ({ ...prev, lineas: prev.lineas.filter((l) => l.id_producto !== id_producto) }));
  }

  function actualizarLinea(id_producto: string, cambios: Partial<Pick<Linea, "cantidad" | "precio_unit">>) {
    setCampos((prev) => ({
      ...prev,
      lineas: prev.lineas.map((l) => (l.id_producto === id_producto ? { ...l, ...cambios } : l)),
    }));
  }

  async function handleCrearCliente() {
    if (!nuevoCliente.nombre.trim()) return;
    setGuardandoCliente(true);
    const resultado = await crearCliente(nuevoCliente);
    setGuardandoCliente(false);
    if (resultado.ok) {
      setClientesLocal((prev) => [
        ...prev,
        { id: resultado.cliente.id_cliente, nombre: resultado.cliente.nombre, apellido: resultado.cliente.apellido, es_revendedor: resultado.cliente.es_revendedor },
      ]);
      setCampos((prev) => ({ ...prev, idCliente: resultado.cliente.id_cliente }));
      setCreandoCliente(false);
      setNuevoCliente({ nombre: "", apellido: "", telefono: "", es_revendedor: false });
      toast.success("Cliente agregado");
    }
  }

  async function guardar() {
    if (!fechaHora) return toast.error("La fecha es obligatoria.");
    if (!idCanal) return toast.error("Elige un canal de venta.");
    if (!idMetodo) return toast.error("Elige un método de pago.");
    if (lineas.length === 0) return toast.error("Agrega al menos un producto.");

    setGuardando(true);
    const payload = {
      fecha_hora: new Date(fechaHora).toISOString(),
      id_cliente: idCliente,
      tipo_venta: tipoVenta,
      id_canal: idCanal,
      id_metodo: idMetodo,
      descuento_pct: descuentoPct,
      pago_recibido: pagoRecibido,
      lineas: lineas.map((l) => ({ id_producto: l.id_producto, cantidad: l.cantidad, precio_unit: l.precio_unit })),
    };
    const resultado = esEdicion ? await actualizarVenta(venta!.id_venta, payload) : await crearVenta(payload);
    setGuardando(false);

    if (!resultado.ok) {
      toast.error("error" in resultado ? String(resultado.error) : "No se pudo guardar la venta.");
      return;
    }
    toast.success(esEdicion ? "Venta actualizada" : "Venta registrada");
    onOpenChange(false);
    router.refresh();
  }

  const disponibles = productos.filter((p) => !lineas.some((l) => l.id_producto === p.id_producto));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{esEdicion ? "Editar venta" : "Nueva venta"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="fecha_hora">Fecha y hora *</Label>
              <Input
                id="fecha_hora"
                type="datetime-local"
                value={fechaHora}
                onChange={(e) => setCampos((prev) => ({ ...prev, fechaHora: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Cliente</Label>
              {creandoCliente ? (
                <div className="space-y-2 rounded-lg border border-border p-2">
                  <Input
                    autoFocus
                    placeholder="Nombre *"
                    value={nuevoCliente.nombre}
                    onChange={(e) => setNuevoCliente((prev) => ({ ...prev, nombre: e.target.value }))}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Apellido"
                      value={nuevoCliente.apellido}
                      onChange={(e) => setNuevoCliente((prev) => ({ ...prev, apellido: e.target.value }))}
                    />
                    <Input
                      placeholder="Teléfono"
                      value={nuevoCliente.telefono}
                      onChange={(e) => setNuevoCliente((prev) => ({ ...prev, telefono: e.target.value }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={nuevoCliente.es_revendedor}
                        onCheckedChange={(checked) => setNuevoCliente((prev) => ({ ...prev, es_revendedor: checked }))}
                        aria-label="Es revendedor"
                      />
                      <span className="text-sm text-muted-foreground">Revendedor</span>
                    </div>
                    <div className="flex gap-1">
                      <Button type="button" size="sm" variant="ghost" onClick={() => setCreandoCliente(false)}>
                        Cancelar
                      </Button>
                      <Button type="button" size="sm" onClick={handleCrearCliente} loading={guardandoCliente}>
                        OK
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <Select
                  value={idCliente?.toString() ?? "none"}
                  onValueChange={(v) =>
                    v === "new"
                      ? setCreandoCliente(true)
                      : setCampos((prev) => ({ ...prev, idCliente: v === "none" ? null : Number(v) }))
                  }
                  items={{
                    none: "Cliente general",
                    ...Object.fromEntries(clientesLocal.map((c) => [c.id.toString(), [c.nombre, c.apellido].filter(Boolean).join(" ")])),
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Cliente general" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Cliente general</SelectItem>
                    {clientesLocal.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {[c.nombre, c.apellido].filter(Boolean).join(" ")}
                      </SelectItem>
                    ))}
                    <SelectItem value="new">+ Nuevo cliente</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Canal de venta *</Label>
              <Select
                value={idCanal?.toString() ?? ""}
                onValueChange={(v) => setCampos((prev) => ({ ...prev, idCanal: Number(v) }))}
                items={Object.fromEntries(canales.map((c) => [c.id.toString(), c.nombre]))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Elige un canal" />
                </SelectTrigger>
                <SelectContent>
                  {canales.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Tipo de venta</Label>
              <Select
                value={tipoVenta}
                onValueChange={(v) => setCampos((prev) => ({ ...prev, tipoVenta: v as TipoVenta }))}
                items={Object.fromEntries(tiposVenta.map((t) => [t, t]))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tiposVenta.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Método de pago *</Label>
              <Select
                value={idMetodo?.toString() ?? ""}
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
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Productos vendidos</Label>
              <Popover open={pickerAbierto} onOpenChange={setPickerAbierto}>
                <PopoverTrigger
                  render={
                    <Button type="button" variant="outline" size="sm" className="gap-1">
                      <Plus className="size-3.5" /> Agregar producto
                    </Button>
                  }
                />
                <PopoverContent className="w-72 p-0" align="end">
                  <Command>
                    <CommandInput placeholder="Buscar por ID de producto..." />
                    <CommandList>
                      <CommandGroup>
                        {disponibles.map((p) => (
                          <CommandItem key={p.id_producto} value={p.id_producto} onSelect={() => agregarLinea(p)}>
                            {p.id_producto} — {p.nombre} — ${p.precio.toFixed(2)}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {lineas.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
                Agrega los productos que se vendieron.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border bg-card">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/50 text-left text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 font-medium">Producto</th>
                      <th className="px-3 py-2 font-medium">Cantidad</th>
                      <th className="px-3 py-2 font-medium">Precio unit.</th>
                      <th className="px-3 py-2 font-medium">Subtotal</th>
                      <th className="w-10 px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {lineas.map((l) => (
                      <tr key={l.id_producto} className="border-b border-border last:border-0">
                        <td className="px-3 py-2 text-foreground">{l.nombre}</td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            min="1"
                            step="1"
                            className="w-20"
                            value={l.cantidad}
                            onChange={(e) => actualizarLinea(l.id_producto, { cantidad: Number(e.target.value) })}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            min="0"
                            step="any"
                            className="w-24"
                            value={l.precio_unit}
                            onChange={(e) => actualizarLinea(l.id_producto, { precio_unit: Number(e.target.value) })}
                          />
                        </td>
                        <td className="px-3 py-2 font-medium text-foreground">${(l.cantidad * l.precio_unit).toFixed(2)}</td>
                        <td className="px-3 py-2">
                          <Button size="icon" variant="ghost" onClick={() => quitarLinea(l.id_producto)}>
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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="descuento">Descuento (%)</Label>
              <Input
                id="descuento"
                type="number"
                min="0"
                max="100"
                step="any"
                value={descuentoPct}
                onChange={(e) => setCampos((prev) => ({ ...prev, descuentoPct: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pago_recibido">Pago recibido</Label>
              <Input
                id="pago_recibido"
                type="number"
                min="0"
                step="any"
                value={pagoRecibido}
                onChange={(e) => setCampos((prev) => ({ ...prev, pagoRecibido: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div className="space-y-1 rounded-lg bg-muted px-3 py-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {descuentoMonto > 0 && (
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Descuento</span>
                <span>-${descuentoMonto.toFixed(2)}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-lg font-semibold text-foreground">${total.toFixed(2)}</span>
            </div>
            {pagoRecibido > 0 && (
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Cambio</span>
                <span className={cambio < 0 ? "text-destructive" : ""}>${cambio.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={guardar} loading={guardando}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
