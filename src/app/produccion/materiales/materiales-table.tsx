"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, ArrowUpDown, Pencil, Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { eliminarMaterial } from "./actions";
import { MaterialForm, categoriaLabels } from "./material-form";
import type { MaterialRow, ProveedorOption } from "./types";

type Orden = { columna: "id_material" | "costo_unitario" | "stock_piezas"; direccion: "asc" | "desc" };

export function MaterialesTable({
  materiales,
  proveedores,
}: {
  materiales: MaterialRow[];
  proveedores: ProveedorOption[];
}) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [proveedorId, setProveedorId] = useState<string>("TODOS");
  const [orden, setOrden] = useState<Orden>({ columna: "id_material", direccion: "asc" });
  const [proveedoresLocal, setProveedoresLocal] = useState(proveedores);
  const [formAbierto, setFormAbierto] = useState(false);
  const [materialEditando, setMaterialEditando] = useState<MaterialRow | null>(null);
  const [materialAEliminar, setMaterialAEliminar] = useState<MaterialRow | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const listaFiltrada = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    const filtrada = materiales.filter((m) => {
      const coincideTexto =
        texto === "" ||
        m.id_material.toLowerCase().includes(texto) ||
        (m.nombre ?? "").toLowerCase().includes(texto);
      const coincideProveedor = proveedorId === "TODOS" || m.id_proveedor?.toString() === proveedorId;
      return coincideTexto && coincideProveedor;
    });

    const factor = orden.direccion === "asc" ? 1 : -1;
    return [...filtrada].sort((a, b) => {
      if (orden.columna === "id_material") return a.id_material.localeCompare(b.id_material) * factor;
      if (orden.columna === "costo_unitario") return ((a.costo_unitario ?? 0) - (b.costo_unitario ?? 0)) * factor;
      return (a.stock_piezas - b.stock_piezas) * factor;
    });
  }, [materiales, busqueda, proveedorId, orden]);

  function alternarOrden(columna: Orden["columna"]) {
    setOrden((prev) =>
      prev.columna === columna
        ? { columna, direccion: prev.direccion === "asc" ? "desc" : "asc" }
        : { columna, direccion: "asc" }
    );
  }

  function abrirNuevo() {
    setMaterialEditando(null);
    setFormAbierto(true);
  }

  function abrirEdicion(material: MaterialRow) {
    setMaterialEditando(material);
    setFormAbierto(true);
  }

  async function confirmarEliminar() {
    if (!materialAEliminar) return;
    setEliminando(true);
    const resultado = await eliminarMaterial(materialAEliminar.id_material);
    setEliminando(false);
    if (!resultado.ok) {
      toast.error(resultado.error);
    } else {
      toast.success("Material eliminado");
    }
    setMaterialAEliminar(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Materiales</h1>
          <p className="text-sm text-muted-foreground">
            Catálogo de materiales: define costo por tira y piezas por tira para calcular el costo unitario.
          </p>
        </div>
        <Button size="lg" onClick={abrirNuevo} className="gap-2">
          <Plus className="size-4" /> Nuevo material
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por código o nombre..."
            className="pl-9"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <Select
          value={proveedorId}
          onValueChange={(v) => setProveedorId(v ?? "TODOS")}
          items={{
            TODOS: "Todos los proveedores",
            ...Object.fromEntries(proveedoresLocal.map((p) => [p.id.toString(), p.nombre])),
          }}
        >
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="Proveedor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos los proveedores</SelectItem>
            {proveedoresLocal.map((p) => (
              <SelectItem key={p.id} value={p.id.toString()}>
                {p.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>
                <button className="flex items-center gap-1" onClick={() => alternarOrden("id_material")}>
                  Código <ArrowUpDown className="size-3.5" />
                </button>
              </TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead>Tira</TableHead>
              <TableHead>
                <button className="flex items-center gap-1" onClick={() => alternarOrden("costo_unitario")}>
                  Costo unitario <ArrowUpDown className="size-3.5" />
                </button>
              </TableHead>
              <TableHead>
                <button className="flex items-center gap-1" onClick={() => alternarOrden("stock_piezas")}>
                  Stock <ArrowUpDown className="size-3.5" />
                </button>
              </TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {listaFiltrada.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  No hay materiales que coincidan con la búsqueda.
                </TableCell>
              </TableRow>
            )}
            {listaFiltrada.map((m) => (
              <TableRow key={m.id_material} className="group cursor-pointer" onClick={() => abrirEdicion(m)}>
                <TableCell className="font-medium text-foreground">{m.id_material}</TableCell>
                <TableCell className="text-muted-foreground">{m.nombre || "—"}</TableCell>
                <TableCell className="text-muted-foreground">
                  <Badge variant="secondary" className="font-normal">
                    {categoriaLabels[m.categoria]}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{m.proveedorNombre ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {m.categoria === "ingrediente"
                    ? `$${m.costo_tira.toFixed(2)} ${m.piezas_por_tira ? `· ${m.piezas_por_tira} pzs` : ""}`
                    : "—"}
                </TableCell>
                <TableCell className="font-semibold text-foreground">
                  {m.categoria !== "ingrediente" ? (
                    "—"
                  ) : m.costo_unitario !== null ? (
                    `$${m.costo_unitario.toFixed(2)}`
                  ) : (
                    <Badge variant="secondary" className="gap-1 font-normal">
                      <TriangleAlert className="size-3" /> falta piezas/tira
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">{m.stock_piezas}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1 max-sm:opacity-100 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        abrirEdicion(m);
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMaterialAEliminar(m);
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

      <MaterialForm
        open={formAbierto}
        onOpenChange={(open) => {
          setFormAbierto(open);
          if (!open) router.refresh();
        }}
        material={materialEditando}
        proveedores={proveedoresLocal}
        onProveedorCreado={(p) => setProveedoresLocal((prev) => [...prev, p])}
      />

      <AlertDialog open={materialAEliminar !== null} onOpenChange={(open) => !open && setMaterialAEliminar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar {materialAEliminar?.nombre || materialAEliminar?.id_material}?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
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
