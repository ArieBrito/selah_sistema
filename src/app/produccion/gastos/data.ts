import { supabase } from "@/lib/supabase";

export async function obtenerTiposGasto() {
  const { data } = await supabase.from("tipos_gasto").select("id_tipo_gasto, nombre").order("nombre");
  return (data ?? []).map((t) => ({ id: t.id_tipo_gasto, nombre: t.nombre }));
}

type GastoQueryRow = {
  id_gasto: number;
  fecha: string;
  id_tipo_gasto: number;
  tipo: { nombre: string } | null;
  descripcion: string | null;
  monto: string;
};

export async function listarGastos() {
  const { data: gastos } = await supabase
    .from("gastos")
    .select("id_gasto, fecha, id_tipo_gasto, tipo:tipos_gasto(nombre), descripcion, monto")
    .order("fecha", { ascending: false })
    .returns<GastoQueryRow[]>();

  return (gastos ?? []).map((g) => ({
    id_gasto: g.id_gasto,
    fecha: g.fecha,
    id_tipo_gasto: g.id_tipo_gasto,
    tipoGastoNombre: g.tipo?.nombre ?? "Otro",
    descripcion: g.descripcion,
    monto: Number(g.monto),
  }));
}
