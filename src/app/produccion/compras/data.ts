import { prisma } from "@/lib/prisma";

export async function obtenerContextoCompras() {
  const [proveedores, metodos, empleados, materiales] = await Promise.all([
    prisma.proveedor.findMany({ orderBy: { nombre: "asc" } }),
    prisma.metodoPago.findMany({ orderBy: { nombre: "asc" } }),
    prisma.empleado.findMany({ where: { activo: true }, orderBy: { nombre: "asc" } }),
    prisma.material.findMany({ orderBy: { id_material: "asc" } }),
  ]);

  return {
    proveedores: proveedores.map((p) => ({ id: p.id_proveedor, nombre: p.nombre })),
    metodos: metodos.map((m) => ({ id: m.id_metodo, nombre: m.nombre })),
    empleados: empleados.map((e) => ({ id: e.id_empleado, nombre: e.nombre })),
    materiales: materiales.map((m) => ({ id_material: m.id_material, nombre: m.nombre ?? m.id_material })),
  };
}

export async function listarCompras() {
  const compras = await prisma.compra.findMany({
    include: { proveedor: true, metodo: true, empleado: true, detalle: { include: { material: true } } },
    orderBy: { fecha: "desc" },
  });

  return compras.map((c) => ({
    id_compra: c.id_compra,
    ticket: c.ticket,
    fecha: c.fecha.toISOString().slice(0, 10),
    id_proveedor: c.id_proveedor,
    proveedorNombre: c.proveedor?.nombre ?? null,
    id_metodo: c.id_metodo,
    metodoNombre: c.metodo?.nombre ?? null,
    id_empleado: c.id_empleado,
    empleadoNombre: c.empleado?.nombre ?? null,
    total: c.total.toNumber(),
    lineas: c.detalle.map((d) => ({
      id_material: d.id_material,
      nombre: d.material.nombre ?? d.material.id_material,
      cantidad: d.cantidad.toNumber(),
      costo_unit: d.costo_unit.toNumber(),
    })),
  }));
}
