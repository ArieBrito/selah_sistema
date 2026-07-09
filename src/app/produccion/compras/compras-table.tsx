"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { eliminarCompra } from "./actions";
import { CompraForm } from "./compra-form";
import type { CompraRow, ProveedorOption, MetodoOption, EmpleadoOption, MaterialOption } from "./types";

export function ComprasTable({
  compras,
  proveedores,
  metodos,
  empleados,
  materiales,
}: {
  compras: CompraRow[];
  proveedores: ProveedorOption[];
  metodos: MetodoOption[];
  empleados: EmpleadoOption[];
  materiales: MaterialOption[];
}) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [formAbierto, setFormAbierto] = useState(false);
  const [compraEditando, setCompraEditando] = useState<CompraRow | null>(null);
  const [compraAEliminar, setCompraAEliminar] = useState<CompraRow | null>(null);

  const listaFiltrada = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (texto === "") return compras;
    return compras.filter(
      (c) =>
        (c.ticket ?? "").toLowerCase().includes(texto) ||
        (c.proveedorNombre ?? "").toLowerCase().includes(texto) ||
        c.lineas.some((l) => l.nombre.toLowerCase().includes(texto))
    );
  }, [compras, busqueda]);

  function abrirNuevo() {
    setCompraEditando(null);
    setFormAbierto(true);
  }

  function abrirEdicion(compra: CompraRow) {
    setCompraEditando(compra);
    setFormAbierto(true);
  }

  async function confirmarEliminar() {
    if (!compraAEliminar) return;
    await eliminarCompra(compraAEliminar.id_compra);
    toast.success("Compra eliminada");
    setCompraAEliminar(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Registro de compras</h1>
          <p className="text-sm text-muted-foreground">Registra los tickets de compra de materiales.</p>
        </div>
        <Button size="lg" onClick={abrirNuevo} className="gap-2">
          <Plus className="size-4" /> Nueva compra
        </Button>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por ticket, proveedor o material..."
          className="pl-9"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Fecha</TableHead>
              <TableHead>Ticket</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Empleado</TableHead>
              <TableHead>Materiales</TableHead>
              <TableHead>Total</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {listaFiltrada.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  No hay compras que coincidan con la búsqueda.
                </TableCell>
              </TableRow>
            )}
            {listaFiltrada.map((c) => (
              <TableRow key={c.id_compra} className="group cursor-pointer" onClick={() => abrirEdicion(c)}>
                <TableCell className="text-muted-foreground">{c.fecha}</TableCell>
                <TableCell className="text-muted-foreground">{c.ticket || "—"}</TableCell>
                <TableCell className="text-muted-foreground">{c.proveedorNombre ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">{c.metodoNombre ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">{c.empleadoNombre ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {c.lineas.length} material{c.lineas.length === 1 ? "" : "es"}
                </TableCell>
                <TableCell className="font-semibold text-foreground">${c.total.toFixed(2)}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1 max-sm:opacity-100 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        abrirEdicion(c);
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCompraAEliminar(c);
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

      <CompraForm
        open={formAbierto}
        onOpenChange={setFormAbierto}
        compra={compraEditando}
        proveedores={proveedores}
        metodos={metodos}
        empleados={empleados}
        materiales={materiales}
      />

      <AlertDialog open={compraAEliminar !== null} onOpenChange={(open) => !open && setCompraAEliminar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta compra?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarEliminar} className="bg-destructive hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
