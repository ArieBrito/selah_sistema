"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { materialFormSchema, materialCategorias, type MaterialFormValues } from "@/lib/validations";
import { crearMaterial, actualizarMaterial, crearProveedor } from "./actions";
import type { MaterialRow, ProveedorOption } from "./types";

export const categoriaLabels: Record<(typeof materialCategorias)[number], string> = {
  ingrediente: "Ingrediente para pulseras",
  insumo: "Insumo / Empaque",
  capital: "Bien de capital",
};

export function MaterialForm({
  open,
  onOpenChange,
  material,
  proveedores,
  onProveedorCreado,
  onCreado,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material: MaterialRow | null;
  proveedores: ProveedorOption[];
  onProveedorCreado: (p: ProveedorOption) => void;
  onCreado?: (material: { id_material: string; nombre: string; costo_tira: number }) => void;
}) {
  const esEdicion = material !== null;
  const [creandoProveedor, setCreandoProveedor] = useState(false);
  const [nombreProveedorNuevo, setNombreProveedorNuevo] = useState("");
  const [stockTocado, setStockTocado] = useState(false);

  const form = useForm<z.input<typeof materialFormSchema>, unknown, MaterialFormValues>({
    resolver: zodResolver(materialFormSchema),
    defaultValues: valoresIniciales(material),
  });

  useEffect(() => {
    if (open) {
      form.reset(valoresIniciales(material));
      setCreandoProveedor(false);
      setNombreProveedorNuevo("");
      setStockTocado(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, material]);

  const categoria = form.watch("categoria");
  const costoTira = form.watch("costo_tira");
  const piezasPorTira = form.watch("piezas_por_tira");
  const costoUnitario =
    Number(piezasPorTira) > 0 ? Number(costoTira) / Number(piezasPorTira) : null;

  useEffect(() => {
    if (!esEdicion && !stockTocado && piezasPorTira) {
      form.setValue("stock_piezas", Number(piezasPorTira));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [piezasPorTira, esEdicion, stockTocado]);

  async function onSubmit(values: MaterialFormValues) {
    const resultado = esEdicion
      ? await actualizarMaterial(material!.id_material, values)
      : await crearMaterial(values);

    if (!resultado.ok) {
      toast.error("error" in resultado ? resultado.error : "No se pudo guardar el material.");
      return;
    }
    toast.success(esEdicion ? "Material actualizado" : "Material creado");
    if (!esEdicion)
      onCreado?.({ id_material: values.id_material, nombre: values.nombre || values.id_material, costo_tira: values.costo_tira });
    onOpenChange(false);
  }

  async function handleCrearProveedor() {
    if (!nombreProveedorNuevo.trim()) return;
    const resultado = await crearProveedor(nombreProveedorNuevo.trim());
    if (resultado.ok) {
      onProveedorCreado({ id: resultado.proveedor.id_proveedor, nombre: resultado.proveedor.nombre });
      form.setValue("id_proveedor", resultado.proveedor.id_proveedor);
      setCreandoProveedor(false);
      setNombreProveedorNuevo("");
      toast.success("Proveedor agregado");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{esEdicion ? "Editar material" : "Nuevo material"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="id_material">Código *</Label>
              <Input
                id="id_material"
                placeholder="Ej. PERLA-6MM-BLANCA"
                disabled={esEdicion}
                {...form.register("id_material")}
              />
              {form.formState.errors.id_material && (
                <p className="text-sm text-destructive">{form.formState.errors.id_material.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" placeholder="Ej. Perla blanca 6mm" {...form.register("nombre")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Categoría</Label>
            <Select
              value={form.watch("categoria")}
              onValueChange={(v) => form.setValue("categoria", v as (typeof materialCategorias)[number])}
              items={Object.fromEntries(materialCategorias.map((c) => [c, categoriaLabels[c]]))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {materialCategorias.map((c) => (
                  <SelectItem key={c} value={c}>
                    {categoriaLabels[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea id="descripcion" rows={2} {...form.register("descripcion")} />
          </div>

          {categoria === "ingrediente" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="largo_mm">Largo tira (mm)</Label>
                <Input id="largo_mm" type="number" step="any" min="0" {...form.register("largo_mm")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ancho_mm">Ancho tira (mm)</Label>
                <Input id="ancho_mm" type="number" step="any" min="0" {...form.register("ancho_mm")} />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Proveedor</Label>
            {creandoProveedor ? (
              <div className="flex gap-2">
                <Input
                  autoFocus
                  placeholder="Nombre del proveedor"
                  value={nombreProveedorNuevo}
                  onChange={(e) => setNombreProveedorNuevo(e.target.value)}
                />
                <Button type="button" onClick={handleCrearProveedor}>
                  Agregar
                </Button>
                <Button type="button" variant="ghost" onClick={() => setCreandoProveedor(false)}>
                  Cancelar
                </Button>
              </div>
            ) : (
              <Select
                value={form.watch("id_proveedor")?.toString() ?? "none"}
                onValueChange={(v) => {
                  if (v === "new") setCreandoProveedor(true);
                  else form.setValue("id_proveedor", v === "none" ? null : Number(v));
                }}
                items={{ none: "Sin proveedor", ...Object.fromEntries(proveedores.map((p) => [p.id.toString(), p.nombre])) }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin proveedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin proveedor</SelectItem>
                  {proveedores.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.nombre}
                    </SelectItem>
                  ))}
                  <SelectItem value="new">+ Agregar proveedor nuevo</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {categoria === "ingrediente" && (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="costo_tira">Costo por tira ($)</Label>
                  <Input id="costo_tira" type="number" step="any" min="0" {...form.register("costo_tira")} />
                  {form.formState.errors.costo_tira && (
                    <p className="text-sm text-destructive">{form.formState.errors.costo_tira.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="piezas_por_tira">Piezas por tira</Label>
                  <Input
                    id="piezas_por_tira"
                    type="number"
                    step="any"
                    min="0"
                    {...form.register("piezas_por_tira")}
                  />
                </div>
              </div>

              <div className="rounded-lg bg-muted px-3 py-2 text-sm">
                Costo unitario ={" "}
                <span className="font-semibold text-foreground">
                  {costoUnitario !== null ? `$${costoUnitario.toFixed(2)}` : "— (falta piezas por tira)"}
                </span>{" "}
                <span className="text-muted-foreground">(costo por tira ÷ piezas por tira)</span>
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="stock_piezas">Stock (piezas) *</Label>
            <Input
              id="stock_piezas"
              type="number"
              step="any"
              min="0"
              {...form.register("stock_piezas", { onChange: () => setStockTocado(true) })}
            />
            {form.formState.errors.stock_piezas && (
              <p className="text-sm text-destructive">{form.formState.errors.stock_piezas.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function valoresIniciales(material: MaterialRow | null): MaterialFormValues {
  if (!material) {
    return {
      id_material: "",
      nombre: "",
      categoria: "ingrediente",
      descripcion: "",
      largo_mm: undefined,
      ancho_mm: undefined,
      costo_tira: 0,
      piezas_por_tira: undefined,
      stock_piezas: 0,
      id_proveedor: null,
    };
  }
  return {
    id_material: material.id_material,
    nombre: material.nombre ?? "",
    categoria: material.categoria,
    descripcion: material.descripcion ?? "",
    largo_mm: material.largo_mm ?? undefined,
    ancho_mm: material.ancho_mm ?? undefined,
    costo_tira: material.costo_tira,
    piezas_por_tira: material.piezas_por_tira ?? undefined,
    stock_piezas: material.stock_piezas,
    id_proveedor: material.id_proveedor,
  };
}
