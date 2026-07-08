import { prisma } from "@/lib/prisma";
import { ConfiguracionForm } from "./configuracion-form";

export default async function ConfiguracionPage() {
  const [configuracion, tiposHilo, clasificaciones] = await Promise.all([
    prisma.configuracion.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1 },
    }),
    prisma.tipoHilo.findMany({ orderBy: { nombre: "asc" } }),
    prisma.clasificacion.findMany({ orderBy: { precio_tarifa: "asc" } }),
  ]);

  return (
    <ConfiguracionForm
      configuracion={{
        costo_mano_obra: configuracion.costo_mano_obra.toNumber(),
        costo_empaque: configuracion.costo_empaque.toNumber(),
        costo_pago_hermana: configuracion.costo_pago_hermana.toNumber(),
      }}
      tiposHilo={tiposHilo.map((t) => ({ id: t.id_tipo_hilo, nombre: t.nombre, costo: t.costo.toNumber() }))}
      clasificaciones={clasificaciones.map((c) => ({
        id_clasif: c.id_clasif,
        descripcion: c.descripcion,
        precio_tarifa: c.precio_tarifa.toNumber(),
        costo_max: c.costo_max?.toNumber() ?? null,
      }))}
    />
  );
}
