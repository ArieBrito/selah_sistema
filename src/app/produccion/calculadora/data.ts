import { prisma } from "@/lib/prisma";
import { calcularCostoCargado, calcularCostoMateriales, calcularMargenReal, type NivelClasificacion } from "@/lib/pricing";

export async function obtenerContextoPrecios() {
  const [configuracion, clasificaciones, tiposHilo, materiales] = await Promise.all([
    prisma.configuracion.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } }),
    prisma.clasificacion.findMany({ orderBy: { precio_tarifa: "asc" } }),
    prisma.tipoHilo.findMany({ orderBy: { nombre: "asc" } }),
    prisma.material.findMany({ where: { costo_unitario: { not: null } }, orderBy: { id_material: "asc" } }),
  ]);

  return {
    fijos: {
      costo_mano_obra: configuracion.costo_mano_obra.toNumber(),
      costo_empaque: configuracion.costo_empaque.toNumber(),
      costo_pago_hermana: configuracion.costo_pago_hermana.toNumber(),
    },
    niveles: clasificaciones.map((c) => ({
      id_clasif: c.id_clasif,
      precio_tarifa: c.precio_tarifa.toNumber(),
      costo_max: c.costo_max?.toNumber() ?? null,
    })) satisfies NivelClasificacion[],
    tiposHilo: tiposHilo.map((t) => ({ id: t.id_tipo_hilo, nombre: t.nombre, costo: t.costo.toNumber() })),
    materiales: materiales.map((m) => ({
      id_material: m.id_material,
      nombre: m.nombre ?? m.id_material,
      costoUnitario: m.costo_unitario!.toNumber(),
    })),
  };
}

export async function listarDisenos() {
  const [productos, contexto] = await Promise.all([
    prisma.producto.findMany({
      include: { materiales: { include: { material: true } }, tipo_hilo: true, clasificacion: true },
      orderBy: { nombre: "asc" },
    }),
    obtenerContextoPrecios(),
  ]);

  return productos.map((p) => {
    const costoMateriales = calcularCostoMateriales(
      p.materiales.map((pm) => ({ cantidad: pm.cantidad.toNumber(), costoUnitario: pm.material.costo_unitario?.toNumber() ?? 0 }))
    );
    const costoHilo = p.tipo_hilo?.costo.toNumber() ?? 0;
    const costoCargado = calcularCostoCargado(costoMateriales, costoHilo, contexto.fijos);
    const precio = p.precio.toNumber();
    return {
      id: p.id_producto,
      nombre: p.nombre,
      precio,
      id_clasif: p.id_clasif,
      margenReal: calcularMargenReal(precio, costoCargado),
    };
  });
}

export async function obtenerDisenoParaEditar(id: number) {
  const producto = await prisma.producto.findUnique({
    where: { id_producto: id },
    include: { materiales: true },
  });
  if (!producto) return null;

  return {
    id: producto.id_producto,
    nombre: producto.nombre,
    id_tipo_hilo: producto.id_tipo_hilo,
    precioActual: producto.precio.toNumber(),
    lineas: producto.materiales.map((pm) => ({ id_material: pm.id_material, cantidad: pm.cantidad.toNumber() })),
  };
}
