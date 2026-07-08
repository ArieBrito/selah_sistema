import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.categoria.createMany({
    data: [{ nombre: "Pulsera" }, { nombre: "Anillo" }, { nombre: "Arete" }],
    skipDuplicates: true,
  });

  // Escalera de precios: costo_max = 70% del precio => margen >= 30%
  await prisma.clasificacion.createMany({
    data: [
      { id_clasif: "C", descripcion: "Basica", precio_tarifa: 160, costo_max: 112 },
      { id_clasif: "B", descripcion: "Media", precio_tarifa: 200, costo_max: 140 },
      { id_clasif: "A", descripcion: "Premium", precio_tarifa: 250, costo_max: 175 },
      { id_clasif: "A3", descripcion: "Premium +", precio_tarifa: 300, costo_max: 210 },
      { id_clasif: "A2", descripcion: "Alta gama", precio_tarifa: 350, costo_max: 245 },
      { id_clasif: "A1", descripcion: "Exclusiva", precio_tarifa: 400, costo_max: 280 },
      { id_clasif: "M", descripcion: "Manual/Otro", precio_tarifa: 0, costo_max: null },
    ],
    skipDuplicates: true,
  });

  await prisma.metodoPago.createMany({
    data: [{ nombre: "Efectivo" }, { nombre: "Tarjeta" }, { nombre: "Deposito" }, { nombre: "Transferencia" }],
    skipDuplicates: true,
  });

  await prisma.tipoGasto.createMany({
    data: [
      { nombre: "Material" },
      { nombre: "Mano de obra" },
      { nombre: "Movilidad" },
      { nombre: "Empaque" },
      { nombre: "Renta" },
      { nombre: "Otro" },
    ],
    skipDuplicates: true,
  });

  await prisma.tipoHilo.createMany({
    data: [
      { nombre: "Nylon", costo: 2.4 },
      { nombre: "Negro", costo: 4.0 },
    ],
    skipDuplicates: true,
  });

  await prisma.configuracion.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      costo_mano_obra: 20,
      costo_empaque: 10,
      costo_pago_hermana: 20,
      margen_objetivo: 0.3,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
