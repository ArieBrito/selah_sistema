import { supabase } from "@/lib/supabase";
import { ConfiguracionForm } from "./configuracion-form";

export default async function ConfiguracionPage() {
  const [{ data: configuracion }, { data: tiposHilo }, { data: clasificaciones }] = await Promise.all([
    supabase.from("configuracion").upsert({ id: 1 }).select().single(),
    supabase.from("tipos_hilo").select("id_tipo_hilo, nombre, costo").order("nombre"),
    supabase.from("clasificaciones").select("id_clasif, descripcion, precio_tarifa, costo_max").order("precio_tarifa"),
  ]);

  return (
    <ConfiguracionForm
      configuracion={{
        costo_mano_obra: Number(configuracion!.costo_mano_obra),
        costo_empaque: Number(configuracion!.costo_empaque),
        costo_pago_hermana: Number(configuracion!.costo_pago_hermana),
      }}
      tiposHilo={(tiposHilo ?? []).map((t) => ({ id: t.id_tipo_hilo, nombre: t.nombre, costo: Number(t.costo) }))}
      clasificaciones={(clasificaciones ?? []).map((c) => ({
        id_clasif: c.id_clasif,
        descripcion: c.descripcion,
        precio_tarifa: Number(c.precio_tarifa),
        costo_max: c.costo_max === null ? null : Number(c.costo_max),
      }))}
    />
  );
}
