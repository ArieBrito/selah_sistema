"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
import { BadgeClasificacion } from "@/components/badge-clasificacion";
import { eliminarProducto, cambiarActivoProducto } from "./actions";

type ProductoRow = {
  id_producto: string;
  nombre: string;
  categoriaNombre: string | null;
  id_clasif: string | null;
  tipoHiloNombre: string | null;
  tamanoNombre: string | null;
  precio: number;
  stock_piezas: number;
  activo: boolean;
  margenReal: number;
};

export function ProductosTable({ productos }: { productos: ProductoRow[] }) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [productoAEliminar, setProductoAEliminar] = useState<ProductoRow | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [cambiandoActivo, setCambiandoActivo] = useState<string | null>(null);

  const listaFiltrada = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (texto === "") return productos;
    return productos.filter((p) => p.nombre.toLowerCase().includes(texto));
  }, [productos, busqueda]);

  async function alternarActivo(producto: ProductoRow) {
    setCambiandoActivo(producto.id_producto);
    await cambiarActivoProducto(producto.id_producto, !producto.activo);
    setCambiandoActivo(null);
    router.refresh();
  }

  async function confirmarEliminar() {
    if (!productoAEliminar) return;
    setEliminando(true);
    const resultado = await eliminarProducto(productoAEliminar.id_producto);
    setEliminando(false);
    if (!resultado.ok) {
      toast.error(resultado.error);
    } else {
      toast.success("Producto eliminado");
    }
    setProductoAEliminar(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Catálogo de productos</h1>
          <p className="text-sm text-muted-foreground">
            Diseños de la calculadora. Crea o ajusta el precio desde la calculadora.
          </p>
        </div>
        <Link href="/produccion/calculadora/nuevo" className={buttonVariants({ size: "lg", className: "gap-2" })}>
          <Plus className="size-4" /> Nuevo producto
        </Link>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre..."
          className="pl-9"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>ID</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Clasificación</TableHead>
              <TableHead>Talla</TableHead>
              <TableHead>Hilo</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Margen real</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Activo</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {listaFiltrada.length === 0 && (
              <TableRow>
                <TableCell colSpan={11} className="py-10 text-center text-muted-foreground">
                  No hay productos que coincidan con la búsqueda.
                </TableCell>
              </TableRow>
            )}
            {listaFiltrada.map((p) => (
              <TableRow key={p.id_producto} className="group">
                <TableCell className="text-muted-foreground">{p.id_producto}</TableCell>
                <TableCell className="font-medium text-foreground">{p.nombre}</TableCell>
                <TableCell className="text-muted-foreground">{p.categoriaNombre ?? "—"}</TableCell>
                <TableCell>
                  <BadgeClasificacion clasif={p.id_clasif} />
                </TableCell>
                <TableCell className="text-muted-foreground">{p.tamanoNombre ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">{p.tipoHiloNombre ?? "—"}</TableCell>
                <TableCell className="font-semibold text-foreground">${p.precio.toFixed(2)}</TableCell>
                <TableCell className={p.margenReal >= 0.3 ? "text-primary" : "text-destructive"}>
                  {(p.margenReal * 100).toFixed(1)}%
                </TableCell>
                <TableCell className="text-muted-foreground">{p.stock_piezas}</TableCell>
                <TableCell>
                  <Switch
                    checked={p.activo}
                    onCheckedChange={() => alternarActivo(p)}
                    disabled={cambiandoActivo === p.id_producto}
                    aria-label="Activo"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1 max-sm:opacity-100 opacity-0 transition-opacity group-hover:opacity-100">
                    <Link href={`/produccion/calculadora/${p.id_producto}`} className={buttonVariants({ size: "icon", variant: "ghost" })}>
                      <Pencil className="size-4" />
                    </Link>
                    <Button size="icon" variant="ghost" onClick={() => setProductoAEliminar(p)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={productoAEliminar !== null} onOpenChange={(open) => !open && setProductoAEliminar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar {productoAEliminar?.nombre}?</AlertDialogTitle>
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
