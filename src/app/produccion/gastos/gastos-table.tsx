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
import { eliminarGasto } from "./actions";
import { GastoForm } from "./gasto-form";
import type { GastoRow, TipoGastoOption } from "./types";

export function GastosTable({ gastos, tiposGasto }: { gastos: GastoRow[]; tiposGasto: TipoGastoOption[] }) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [formAbierto, setFormAbierto] = useState(false);
  const [gastoEditando, setGastoEditando] = useState<GastoRow | null>(null);
  const [gastoAEliminar, setGastoAEliminar] = useState<GastoRow | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const listaFiltrada = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (texto === "") return gastos;
    return gastos.filter(
      (g) => g.tipoGastoNombre.toLowerCase().includes(texto) || (g.descripcion ?? "").toLowerCase().includes(texto)
    );
  }, [gastos, busqueda]);

  function abrirNuevo() {
    setGastoEditando(null);
    setFormAbierto(true);
  }

  function abrirEdicion(gasto: GastoRow) {
    setGastoEditando(gasto);
    setFormAbierto(true);
  }

  async function confirmarEliminar() {
    if (!gastoAEliminar) return;
    setEliminando(true);
    await eliminarGasto(gastoAEliminar.id_gasto);
    setEliminando(false);
    toast.success("Gasto eliminado");
    setGastoAEliminar(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Gastos</h1>
          <p className="text-sm text-muted-foreground">Registra empaque, transporte, renta de stand y otros gastos operativos.</p>
        </div>
        <Button size="lg" onClick={abrirNuevo} className="gap-2">
          <Plus className="size-4" /> Nuevo gasto
        </Button>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por tipo o descripción..."
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
              <TableHead>Tipo</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {listaFiltrada.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  No hay gastos que coincidan con la búsqueda.
                </TableCell>
              </TableRow>
            )}
            {listaFiltrada.map((g) => (
              <TableRow key={g.id_gasto} className="group cursor-pointer" onClick={() => abrirEdicion(g)}>
                <TableCell className="text-muted-foreground">{g.fecha}</TableCell>
                <TableCell className="text-muted-foreground">{g.tipoGastoNombre}</TableCell>
                <TableCell className="text-muted-foreground">{g.descripcion || "—"}</TableCell>
                <TableCell className="font-semibold text-foreground">${g.monto.toFixed(2)}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1 max-sm:opacity-100 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        abrirEdicion(g);
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setGastoAEliminar(g);
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

      <GastoForm open={formAbierto} onOpenChange={setFormAbierto} gasto={gastoEditando} tiposGasto={tiposGasto} />

      <AlertDialog open={gastoAEliminar !== null} onOpenChange={(open) => !open && setGastoAEliminar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este gasto?</AlertDialogTitle>
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
