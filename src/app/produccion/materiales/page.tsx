import { prisma } from "@/lib/prisma";
import { MaterialesTable } from "./materiales-table";

export default async function MaterialesPage() {
  const [materiales, proveedores] = await Promise.all([
    prisma.material.findMany({
      include: { proveedor: true },
      orderBy: { id_material: "asc" },
    }),
    prisma.proveedor.findMany({ orderBy: { nombre: "asc" } }),
  ]);

  const materialesPlain = materiales.map((m) => ({
    id_material: m.id_material,
    nombre: m.nombre,
    descripcion: m.descripcion,
    largo_mm: m.largo_mm?.toNumber() ?? null,
    ancho_mm: m.ancho_mm?.toNumber() ?? null,
    costo_tira: m.costo_tira.toNumber(),
    piezas_por_tira: m.piezas_por_tira?.toNumber() ?? null,
    costo_unitario: m.costo_unitario?.toNumber() ?? null,
    stock_piezas: m.stock_piezas.toNumber(),
    id_proveedor: m.id_proveedor,
    proveedorNombre: m.proveedor?.nombre ?? null,
  }));

  return (
    <MaterialesTable
      materiales={materialesPlain}
      proveedores={proveedores.map((p) => ({ id: p.id_proveedor, nombre: p.nombre }))}
    />
  );
}
