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
import { eliminarVenta } from "./actions";
import { VentaForm } from "./venta-form";
import type { VentaRow, CanalOption, MetodoOption, ClienteOption, ProductoOption } from "./types";

export function VentasTable({
  ventas,
  canales,
  metodos,
  clientes,
  productos,
}: {
  ventas: VentaRow[];
  canales: CanalOption[];
  metodos: MetodoOption[];
  clientes: ClienteOption[];
  productos: ProductoOption[];
}) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [formAbierto, setFormAbierto] = useState(false);
  const [ventaEditando, setVentaEditando] = useState<VentaRow | null>(null);
  const [ventaAEliminar, setVentaAEliminar] = useState<VentaRow | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const listaFiltrada = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (texto === "") return ventas;
    return ventas.filter(
      (v) =>
        (v.clienteNombre ?? "").toLowerCase().includes(texto) ||
        (v.canalNombre ?? "").toLowerCase().includes(texto) ||
        v.lineas.some((l) => l.nombre.toLowerCase().includes(texto))
    );
  }, [ventas, busqueda]);

  function abrirNuevo() {
    setVentaEditando(null);
    setFormAbierto(true);
  }

  function abrirEdicion(venta: VentaRow) {
    setVentaEditando(venta);
    setFormAbierto(true);
  }

  async function confirmarEliminar() {
    if (!ventaAEliminar) return;
    setEliminando(true);
    await eliminarVenta(ventaAEliminar.id_venta);
    setEliminando(false);
    toast.success("Venta eliminada");
    setVentaAEliminar(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Ventas</h1>
          <p className="text-sm text-muted-foreground">Registra cada venta y su canal, cliente y forma de pago.</p>
        </div>
        <Button size="lg" onClick={abrirNuevo} className="gap-2">
          <Plus className="size-4" /> Nueva venta
        </Button>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por cliente, canal o producto..."
          className="pl-9"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Fecha</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Canal</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Productos</TableHead>
              <TableHead>Total</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {listaFiltrada.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  No hay ventas que coincidan con la búsqueda.
                </TableCell>
              </TableRow>
            )}
            {listaFiltrada.map((v) => (
              <TableRow key={v.id_venta} className="group cursor-pointer" onClick={() => abrirEdicion(v)}>
                <TableCell className="text-muted-foreground whitespace-nowrap">
                  {new Date(v.fecha_hora).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}
                </TableCell>
                <TableCell className="text-muted-foreground">{v.clienteNombre ?? "General"}</TableCell>
                <TableCell className="text-muted-foreground">{v.canalNombre ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">{v.tipo_venta}</TableCell>
                <TableCell className="text-muted-foreground">{v.metodoNombre ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {v.lineas.length} producto{v.lineas.length === 1 ? "" : "s"}
                </TableCell>
                <TableCell className="font-semibold text-foreground">${v.total.toFixed(2)}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1 max-sm:opacity-100 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        abrirEdicion(v);
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setVentaAEliminar(v);
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

      <VentaForm
        open={formAbierto}
        onOpenChange={setFormAbierto}
        venta={ventaEditando}
        canales={canales}
        metodos={metodos}
        clientes={clientes}
        productos={productos}
      />

      <AlertDialog open={ventaAEliminar !== null} onOpenChange={(open) => !open && setVentaAEliminar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta venta?</AlertDialogTitle>
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
