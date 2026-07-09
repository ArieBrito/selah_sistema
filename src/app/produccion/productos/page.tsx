import { supabase } from "@/lib/supabase";
import { calcularCostoCargado, calcularCostoMateriales, calcularMargenReal } from "@/lib/pricing";
import { ProductosTable } from "./productos-table";

type ProductoRow = {
  id_producto: number;
  nombre: string;
  id_clasif: string | null;
  precio: string;
  stock_piezas: string;
  activo: boolean;
  categoria: { nombre: string } | null;
  tipo_hilo: { nombre: string; costo: string } | null;
  materiales: { cantidad: string; material: { costo_unitario: string | null } }[];
};

export default async function ProductosPage() {
  const [{ data: productos }, { data: configuracion }] = await Promise.all([
    supabase
      .from("productos")
      .select(
        "id_producto, nombre, id_clasif, precio, stock_piezas, activo, categoria:categorias(nombre), tipo_hilo:tipos_hilo(nombre, costo), materiales:producto_materiales(cantidad, material:materiales(costo_unitario))"
      )
      .order("nombre")
      .returns<ProductoRow[]>(),
    supabase.from("configuracion").upsert({ id: 1 }).select().single(),
  ]);

  const fijos = {
    costo_mano_obra: Number(configuracion!.costo_mano_obra),
    costo_empaque: Number(configuracion!.costo_empaque),
    costo_pago_hermana: Number(configuracion!.costo_pago_hermana),
  };

  const productosPlain = (productos ?? []).map((p) => {
    const costoMateriales = calcularCostoMateriales(
      p.materiales.map((pm) => ({ cantidad: Number(pm.cantidad), costoUnitario: Number(pm.material.costo_unitario ?? 0) }))
    );
    const costoHilo = Number(p.tipo_hilo?.costo ?? 0);
    const costoCargado = calcularCostoCargado(costoMateriales, costoHilo, fijos);
    const precio = Number(p.precio);

    return {
      id_producto: p.id_producto,
      nombre: p.nombre,
      categoriaNombre: p.categoria?.nombre ?? null,
      id_clasif: p.id_clasif,
      tipoHiloNombre: p.tipo_hilo?.nombre ?? null,
      precio,
      stock_piezas: Number(p.stock_piezas),
      activo: p.activo,
      margenReal: calcularMargenReal(precio, costoCargado),
    };
  });

  return <ProductosTable productos={productosPlain} />;
}
