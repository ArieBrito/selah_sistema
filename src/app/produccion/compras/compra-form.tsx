"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { crearCompra, actualizarCompra, crearEmpleado } from "./actions";
import { crearProveedor } from "../materiales/actions";
import { MaterialForm } from "../materiales/material-form";
import type { CompraRow, ProveedorOption, MetodoOption, EmpleadoOption, MaterialOption } from "./types";

type Linea = { id_material: string; nombre: string; cantidad: number; costo_unit: number };

type Campos = {
  ticket: string;
  fecha: string;
  idProveedor: number | null;
  idMetodo: number | null;
  idEmpleado: number | null;
  lineas: Linea[];
};

function valoresIniciales(compra: CompraRow | null): Campos {
  return {
    ticket: compra?.ticket ?? "",
    fecha: compra?.fecha ?? new Date().toISOString().slice(0, 10),
    idProveedor: compra?.id_proveedor ?? null,
    idMetodo: compra?.id_metodo ?? null,
    idEmpleado: compra?.id_empleado ?? null,
    lineas: compra?.lineas.map((l) => ({ ...l })) ?? [],
  };
}

export function CompraForm({
  open,
  onOpenChange,
  compra,
  proveedores,
  metodos,
  empleados,
  materiales,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  compra: CompraRow | null;
  proveedores: ProveedorOption[];
  metodos: MetodoOption[];
  empleados: EmpleadoOption[];
  materiales: MaterialOption[];
}) {
  const router = useRouter();
  const esEdicion = compra !== null;

  const [campos, setCampos] = useState<Campos>(() => valoresIniciales(compra));
  const [guardando, setGuardando] = useState(false);
  const [pickerAbierto, setPickerAbierto] = useState(false);

  const [proveedoresLocal, setProveedoresLocal] = useState(proveedores);
  const [empleadosLocal, setEmpleadosLocal] = useState(empleados);
  const [materialesLocal, setMaterialesLocal] = useState(materiales);
  const [creandoProveedor, setCreandoProveedor] = useState(false);
  const [nombreProveedorNuevo, setNombreProveedorNuevo] = useState("");
  const [guardandoProveedor, setGuardandoProveedor] = useState(false);
  const [creandoEmpleado, setCreandoEmpleado] = useState(false);
  const [nombreEmpleadoNuevo, setNombreEmpleadoNuevo] = useState("");
  const [guardandoEmpleado, setGuardandoEmpleado] = useState(false);
  const [materialFormAbierto, setMaterialFormAbierto] = useState(false);

  // Reinicia el formulario cada vez que el diálogo pasa de cerrado a abierto,
  // siguiendo el patrón de React para ajustar estado durante el render en vez de un efecto.
  const [openAnterior, setOpenAnterior] = useState(open);
  if (open !== openAnterior) {
    setOpenAnterior(open);
    if (open) {
      setCampos(valoresIniciales(compra));
      setCreandoProveedor(false);
      setCreandoEmpleado(false);
    }
  }

  const { ticket, fecha, idProveedor, idMetodo, idEmpleado, lineas } = campos;
  const total = lineas.reduce((suma, l) => suma + l.cantidad * l.costo_unit, 0);

  function agregarLinea(material: MaterialOption, costoInicial = 0) {
    setCampos((prev) => ({
      ...prev,
      lineas: [...prev.lineas, { id_material: material.id_material, nombre: material.nombre, cantidad: 1, costo_unit: costoInicial }],
    }));
    setPickerAbierto(false);
  }

  function quitarLinea(id_material: string) {
    setCampos((prev) => ({ ...prev, lineas: prev.lineas.filter((l) => l.id_material !== id_material) }));
  }

  function actualizarLinea(id_material: string, cambios: Partial<Pick<Linea, "cantidad" | "costo_unit">>) {
    setCampos((prev) => ({
      ...prev,
      lineas: prev.lineas.map((l) => (l.id_material === id_material ? { ...l, ...cambios } : l)),
    }));
  }

  async function handleCrearProveedor() {
    if (!nombreProveedorNuevo.trim()) return;
    setGuardandoProveedor(true);
    const resultado = await crearProveedor(nombreProveedorNuevo.trim());
    setGuardandoProveedor(false);
    if (resultado.ok) {
      setProveedoresLocal((prev) => [...prev, { id: resultado.proveedor.id_proveedor, nombre: resultado.proveedor.nombre }]);
      setCampos((prev) => ({ ...prev, idProveedor: resultado.proveedor.id_proveedor }));
      setCreandoProveedor(false);
      setNombreProveedorNuevo("");
      toast.success("Proveedor agregado");
    }
  }

  async function handleCrearEmpleado() {
    if (!nombreEmpleadoNuevo.trim()) return;
    setGuardandoEmpleado(true);
    const resultado = await crearEmpleado(nombreEmpleadoNuevo.trim());
    setGuardandoEmpleado(false);
    if (resultado.ok) {
      setEmpleadosLocal((prev) => [...prev, { id: resultado.empleado.id_empleado, nombre: resultado.empleado.nombre }]);
      setCampos((prev) => ({ ...prev, idEmpleado: resultado.empleado.id_empleado }));
      setCreandoEmpleado(false);
      setNombreEmpleadoNuevo("");
      toast.success("Empleado agregado");
    }
  }

  async function guardar() {
    if (!fecha) return toast.error("La fecha es obligatoria.");
    if (lineas.length === 0) return toast.error("Agrega al menos un material.");

    setGuardando(true);
    const payload = {
      ticket,
      fecha,
      id_proveedor: idProveedor,
      id_metodo: idMetodo,
      id_empleado: idEmpleado,
      lineas: lineas.map((l) => ({ id_material: l.id_material, cantidad: l.cantidad, costo_unit: l.costo_unit })),
    };
    const resultado = esEdicion ? await actualizarCompra(compra!.id_compra, payload) : await crearCompra(payload);
    setGuardando(false);

    if (!resultado.ok) {
      toast.error("error" in resultado ? String(resultado.error) : "No se pudo guardar la compra.");
      return;
    }
    toast.success(esEdicion ? "Compra actualizada" : "Compra registrada");
    onOpenChange(false);
    router.refresh();
  }

  const disponibles = materialesLocal.filter((m) => !lineas.some((l) => l.id_material === m.id_material));

  function handleMaterialCreado(material: MaterialOption & { costo_tira: number }) {
    setMaterialesLocal((prev) => [...prev, { id_material: material.id_material, nombre: material.nombre }]);
    agregarLinea(material, material.costo_tira);
  }

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{esEdicion ? "Editar compra" : "Nueva compra"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ticket">Ticket</Label>
              <Input
                id="ticket"
                placeholder="Folio o referencia"
                value={ticket}
                onChange={(e) => setCampos((prev) => ({ ...prev, ticket: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fecha">Fecha *</Label>
              <Input
                id="fecha"
                type="date"
                value={fecha}
                onChange={(e) => setCampos((prev) => ({ ...prev, fecha: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Proveedor</Label>
              {creandoProveedor ? (
                <div className="flex gap-1">
                  <Input
                    autoFocus
                    placeholder="Nombre"
                    value={nombreProveedorNuevo}
                    onChange={(e) => setNombreProveedorNuevo(e.target.value)}
                  />
                  <Button type="button" size="sm" onClick={handleCrearProveedor} loading={guardandoProveedor}>
                    OK
                  </Button>
                </div>
              ) : (
                <Select
                  value={idProveedor?.toString() ?? "none"}
                  onValueChange={(v) =>
                    v === "new"
                      ? setCreandoProveedor(true)
                      : setCampos((prev) => ({ ...prev, idProveedor: v === "none" ? null : Number(v) }))
                  }
                  items={{ none: "Sin proveedor", ...Object.fromEntries(proveedoresLocal.map((p) => [p.id.toString(), p.nombre])) }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin proveedor</SelectItem>
                    {proveedoresLocal.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.nombre}
                      </SelectItem>
                    ))}
                    <SelectItem value="new">+ Nuevo proveedor</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Método de pago</Label>
              <Select
                value={idMetodo?.toString() ?? "none"}
                onValueChange={(v) => setCampos((prev) => ({ ...prev, idMetodo: v === "none" ? null : Number(v) }))}
                items={{ none: "Sin método", ...Object.fromEntries(metodos.map((m) => [m.id.toString(), m.nombre])) }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin método</SelectItem>
                  {metodos.map((m) => (
                    <SelectItem key={m.id} value={m.id.toString()}>
                      {m.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Empleado</Label>
              {creandoEmpleado ? (
                <div className="flex gap-1">
                  <Input
                    autoFocus
                    placeholder="Nombre"
                    value={nombreEmpleadoNuevo}
                    onChange={(e) => setNombreEmpleadoNuevo(e.target.value)}
                  />
                  <Button type="button" size="sm" onClick={handleCrearEmpleado} loading={guardandoEmpleado}>
                    OK
                  </Button>
                </div>
              ) : (
                <Select
                  value={idEmpleado?.toString() ?? "none"}
                  onValueChange={(v) =>
                    v === "new"
                      ? setCreandoEmpleado(true)
                      : setCampos((prev) => ({ ...prev, idEmpleado: v === "none" ? null : Number(v) }))
                  }
                  items={{ none: "Sin empleado", ...Object.fromEntries(empleadosLocal.map((e) => [e.id.toString(), e.nombre])) }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin empleado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin empleado</SelectItem>
                    {empleadosLocal.map((e) => (
                      <SelectItem key={e.id} value={e.id.toString()}>
                        {e.nombre}
                      </SelectItem>
                    ))}
                    <SelectItem value="new">+ Nuevo empleado</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Materiales comprados</Label>
              <Popover open={pickerAbierto} onOpenChange={setPickerAbierto}>
                <PopoverTrigger
                  render={
                    <Button type="button" variant="outline" size="sm" className="gap-1">
                      <Plus className="size-3.5" /> Agregar material
                    </Button>
                  }
                />
                <PopoverContent className="w-72 p-0" align="end">
                  <Command>
                    <CommandInput placeholder="Buscar material..." />
                    <CommandList>
                      <CommandGroup>
                        {disponibles.map((m) => (
                          <CommandItem key={m.id_material} value={m.nombre} onSelect={() => agregarLinea(m)}>
                            {m.nombre}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                      <CommandGroup>
                        <CommandItem
                          forceMount
                          value="crear-material-nuevo"
                          onSelect={() => {
                            setPickerAbierto(false);
                            setMaterialFormAbierto(true);
                          }}
                        >
                          <Plus className="size-3.5" /> Crear material nuevo
                        </CommandItem>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {lineas.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
                Agrega los materiales que compraste.
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/50 text-left text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 font-medium">Material</th>
                      <th className="px-3 py-2 font-medium">Cantidad</th>
                      <th className="px-3 py-2 font-medium">Costo unit.</th>
                      <th className="px-3 py-2 font-medium">Subtotal</th>
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
                            onChange={(e) => actualizarLinea(l.id_material, { cantidad: Number(e.target.value) })}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            min="0"
                            step="any"
                            className="w-24"
                            value={l.costo_unit}
                            onChange={(e) => actualizarLinea(l.id_material, { costo_unit: Number(e.target.value) })}
                          />
                        </td>
                        <td className="px-3 py-2 font-medium text-foreground">${(l.cantidad * l.costo_unit).toFixed(2)}</td>
                        <td className="px-3 py-2">
                          <Button size="icon" variant="ghost" onClick={() => quitarLinea(l.id_material)}>
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

          <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-lg font-semibold text-foreground">${total.toFixed(2)}</span>
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

    <MaterialForm
      open={materialFormAbierto}
      onOpenChange={setMaterialFormAbierto}
      material={null}
      proveedores={proveedoresLocal}
      onProveedorCreado={(p) => setProveedoresLocal((prev) => [...prev, p])}
      onCreado={handleMaterialCreado}
    />
    </>
  );
}
