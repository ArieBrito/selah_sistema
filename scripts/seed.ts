import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

async function main() {
  await supabase
    .from("categorias")
    .upsert([{ nombre: "Pulsera" }, { nombre: "Anillo" }, { nombre: "Arete" }], {
      onConflict: "nombre",
      ignoreDuplicates: true,
    });

  // Escalera de precios: costo_max = 70% del precio => margen >= 30%
  await supabase.from("clasificaciones").upsert(
    [
      { id_clasif: "C", descripcion: "Basica", precio_tarifa: 160, costo_max: 112 },
      { id_clasif: "B", descripcion: "Media", precio_tarifa: 200, costo_max: 140 },
      { id_clasif: "A", descripcion: "Premium", precio_tarifa: 250, costo_max: 175 },
      { id_clasif: "A3", descripcion: "Premium +", precio_tarifa: 300, costo_max: 210 },
      { id_clasif: "A2", descripcion: "Alta gama", precio_tarifa: 350, costo_max: 245 },
      { id_clasif: "A1", descripcion: "Exclusiva", precio_tarifa: 400, costo_max: 280 },
      { id_clasif: "M", descripcion: "Manual/Otro", precio_tarifa: 0, costo_max: null },
    ],
    { onConflict: "id_clasif", ignoreDuplicates: true }
  );

  await supabase
    .from("metodos_pago")
    .upsert([{ nombre: "Efectivo" }, { nombre: "Tarjeta" }, { nombre: "Deposito" }, { nombre: "Transferencia" }], {
      onConflict: "nombre",
      ignoreDuplicates: true,
    });

  await supabase.from("tipos_gasto").upsert(
    [
      { nombre: "Material" },
      { nombre: "Mano de obra" },
      { nombre: "Movilidad" },
      { nombre: "Empaque" },
      { nombre: "Renta" },
      { nombre: "Otro" },
    ],
    { onConflict: "nombre", ignoreDuplicates: true }
  );

  await supabase.from("tipos_hilo").upsert(
    [
      { nombre: "Nylon", costo: 2.4 },
      { nombre: "Negro", costo: 4.0 },
    ],
    { onConflict: "nombre", ignoreDuplicates: true }
  );

  await supabase.from("configuracion").upsert({
    id: 1,
    costo_mano_obra: 20,
    costo_empaque: 10,
    costo_pago_hermana: 20,
    margen_objetivo: 0.3,
  });
}

main()
  .then(() => {
    console.log("Seed completado.");
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
