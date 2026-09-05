"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { eliminarRegistroProduccion } from "./actions";
import { RegistroForm } from "./registro-form";
import type { RegistroProduccionRow, EmpleadoOption, ProductoOption, ResumenEmpleado } from "./types";

export function RegistroTable({
  registros,
  resumenPorEmpleado,
  empleados,
  pulseras,
  costoManoObra,
}: {
  registros: RegistroProduccionRow[];
  resumenPorEmpleado: ResumenEmpleado[];
  empleados: EmpleadoOption[];
  pulseras: ProductoOption[];
  costoManoObra: number;
}) {
  const router = useRouter();
  const [filtroEmpleado, setFiltroEmpleado] = useState<string>("todos");
  const [formAbierto, setFormAbierto] = useState(false);
  const [registroEditando, setRegistroEditando] = useState<RegistroProduccionRow | null>(null);
  const [registroAEliminar, setRegistroAEliminar] = useState<RegistroProduccionRow | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const listaFiltrada = useMemo(() => {
    if (filtroEmpleado === "todos") return registros;
    return registros.filter((r) => r.id_empleado?.toString() === filtroEmpleado);
  }, [registros, filtroEmpleado]);

  function abrirNuevo() {
    setRegistroEditando(null);
    setFormAbierto(true);
  }

  function abrirEdicion(registro: RegistroProduccionRow) {
    setRegistroEditando(registro);
    setFormAbierto(true);
  }

  async function confirmarEliminar() {
    if (!registroAEliminar) return;
    setEliminando(true);
    await eliminarRegistroProduccion(registroAEliminar.id_produccion);
    setEliminando(false);
    toast.success("Registro eliminado");
    setRegistroAEliminar(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Registro de pulseras</h1>
          <p className="text-sm text-muted-foreground">Cuántas pulseras hizo cada empleado y cuánto se le debe pagar.</p>
        </div>
        <Button size="lg" onClick={abrirNuevo} className="gap-2">
          <Plus className="size-4" /> Nuevo registro
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {resumenPorEmpleado.length === 0 ? (
          <p className="col-span-full py-6 text-center text-sm text-muted-foreground">Sin producción registrada este mes.</p>
        ) : (
          resumenPorEmpleado.map((r) => (
            <div key={r.id_empleado} className="rounded-xl border border-border bg-card p-4">
              <h3 className="text-sm font-medium text-foreground">{r.nombre}</h3>
              <p className="mt-1 text-2xl font-semibold text-foreground">${r.totalPagar.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">
                {r.piezas} pieza{r.piezas === 1 ? "" : "s"}
                {r.minutos > 0 ? ` · ${r.minutos} min` : ""} · ${costoManoObra.toFixed(2)}/pieza
              </p>
            </div>
          ))
        )}
      </div>

      <Select value={filtroEmpleado} onValueChange={(v) => setFiltroEmpleado(v ?? "todos")}>
        <SelectTrigger className="w-56">
          <SelectValue placeholder="Filtrar por empleado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos los empleados</SelectItem>
          {empleados.map((e) => (
            <SelectItem key={e.id} value={e.id.toString()}>
              {e.nombre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Fecha</TableHead>
              <TableHead>Empleado</TableHead>
              <TableHead>Diseño</TableHead>
              <TableHead>Piezas</TableHead>
              <TableHead>Minutos</TableHead>
              <TableHead>Pago</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {listaFiltrada.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  No hay registros que coincidan.
                </TableCell>
              </TableRow>
            )}
            {listaFiltrada.map((r) => (
              <TableRow key={r.id_produccion} className="group cursor-pointer" onClick={() => abrirEdicion(r)}>
                <TableCell className="text-muted-foreground">{r.fecha}</TableCell>
                <TableCell className="text-muted-foreground">{r.empleadoNombre ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">{r.productoNombre ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">{r.cantidad}</TableCell>
                <TableCell className="text-muted-foreground">{r.minutos ?? "—"}</TableCell>
                <TableCell className="font-semibold text-foreground">${r.costo_mo_lote.toFixed(2)}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1 max-sm:opacity-100 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        abrirEdicion(r);
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRegistroAEliminar(r);
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

      <RegistroForm
        open={formAbierto}
        onOpenChange={setFormAbierto}
        registro={registroEditando}
        empleados={empleados}
        pulseras={pulseras}
        costoManoObra={costoManoObra}
      />

      <AlertDialog open={registroAEliminar !== null} onOpenChange={(open) => !open && setRegistroAEliminar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este registro?</AlertDialogTitle>
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
