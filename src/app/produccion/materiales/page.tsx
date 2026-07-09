import { supabase } from "@/lib/supabase";
import { MaterialesTable } from "./materiales-table";

type MaterialRow = {
  id_material: string;
  nombre: string | null;
  descripcion: string | null;
  largo_mm: string | null;
  ancho_mm: string | null;
  costo_tira: string;
  piezas_por_tira: string | null;
  costo_unitario: string | null;
  stock_piezas: string;
  id_proveedor: number | null;
  proveedor: { nombre: string } | null;
};

export default async function MaterialesPage() {
  const [{ data: materiales }, { data: proveedores }] = await Promise.all([
    supabase
      .from("materiales")
      .select("*, proveedor:proveedores(nombre)")
      .order("id_material")
      .returns<MaterialRow[]>(),
    supabase.from("proveedores").select("id_proveedor, nombre").order("nombre"),
  ]);

  const materialesPlain = (materiales ?? []).map((m) => ({
    id_material: m.id_material,
    nombre: m.nombre,
    descripcion: m.descripcion,
    largo_mm: m.largo_mm === null ? null : Number(m.largo_mm),
    ancho_mm: m.ancho_mm === null ? null : Number(m.ancho_mm),
    costo_tira: Number(m.costo_tira),
    piezas_por_tira: m.piezas_por_tira === null ? null : Number(m.piezas_por_tira),
    costo_unitario: m.costo_unitario === null ? null : Number(m.costo_unitario),
    stock_piezas: Number(m.stock_piezas),
    id_proveedor: m.id_proveedor,
    proveedorNombre: m.proveedor?.nombre ?? null,
  }));

  return (
    <MaterialesTable
      materiales={materialesPlain}
      proveedores={(proveedores ?? []).map((p) => ({ id: p.id_proveedor, nombre: p.nombre }))}
    />
  );
}
