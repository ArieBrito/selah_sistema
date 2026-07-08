import { prisma } from "@/lib/prisma";
import { calcularCostoCargado, calcularCostoMateriales, calcularMargenReal } from "@/lib/pricing";
import { ProductosTable } from "./productos-table";

export default async function ProductosPage() {
  const [productos, configuracion] = await Promise.all([
    prisma.producto.findMany({
      include: { categoria: true, clasificacion: true, tipo_hilo: true, materiales: { include: { material: true } } },
      orderBy: { nombre: "asc" },
    }),
    prisma.configuracion.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } }),
  ]);

  const fijos = {
    costo_mano_obra: configuracion.costo_mano_obra.toNumber(),
    costo_empaque: configuracion.costo_empaque.toNumber(),
    costo_pago_hermana: configuracion.costo_pago_hermana.toNumber(),
  };

  const productosPlain = productos.map((p) => {
    const costoMateriales = calcularCostoMateriales(
      p.materiales.map((pm) => ({ cantidad: pm.cantidad.toNumber(), costoUnitario: pm.material.costo_unitario?.toNumber() ?? 0 }))
    );
    const costoHilo = p.tipo_hilo?.costo.toNumber() ?? 0;
    const costoCargado = calcularCostoCargado(costoMateriales, costoHilo, fijos);
    const precio = p.precio.toNumber();

    return {
      id_producto: p.id_producto,
      nombre: p.nombre,
      categoriaNombre: p.categoria?.nombre ?? null,
      id_clasif: p.id_clasif,
      tipoHiloNombre: p.tipo_hilo?.nombre ?? null,
      precio,
      stock_piezas: p.stock_piezas.toNumber(),
      activo: p.activo,
      margenReal: calcularMargenReal(precio, costoCargado),
    };
  });

  return <ProductosTable productos={productosPlain} />;
}
