import { endOfMonth, startOfMonth } from "date-fns";
import { supabase } from "@/lib/supabase";

/** `soloEmpleado` limita la lista de empleados a uno: el usuario solo se captura a sí mismo. */
export async function obtenerContextoRegistro(soloEmpleado?: number | null) {
  const consultaEmpleados = supabase.from("empleados").select("id_empleado, nombre").eq("activo", true);

  const [{ data: empleados }, { data: productos }, { data: configuracion }] = await Promise.all([
    (soloEmpleado != null ? consultaEmpleados.eq("id_empleado", soloEmpleado) : consultaEmpleados).order("nombre"),
    supabase
      .from("productos")
      .select("id_producto, nombre, categoria:categorias(nombre)")
      .eq("activo", true)
      .order("nombre")
      .returns<{ id_producto: string; nombre: string; categoria: { nombre: string } | null }[]>(),
    supabase.from("configuracion").upsert({ id: 1 }).select("costo_mano_obra").single(),
  ]);

  return {
    empleados: (empleados ?? []).map((e) => ({ id: e.id_empleado, nombre: e.nombre })),
    pulseras: (productos ?? [])
      .filter((p) => p.categoria?.nombre === "Pulsera")
      .map((p) => ({ id_producto: p.id_producto, nombre: p.nombre })),
    costoManoObra: Number(configuracion?.costo_mano_obra ?? 0),
  };
}

type RegistroQueryRow = {
  id_produccion: number;
  fecha: string;
  id_empleado: number | null;
  empleado: { nombre: string } | null;
  id_producto: string | null;
  producto: { nombre: string } | null;
  cantidad: number;
  minutos: number | null;
  costo_mo_lote: string;
};

/** `soloEmpleado` deja fuera la producción de los demás: el usuario solo ve la suya. */
export async function listarProduccionMes(mesRef: Date = new Date(), soloEmpleado?: number | null) {
  const inicioStr = startOfMonth(mesRef).toISOString().slice(0, 10);
  const finStr = endOfMonth(mesRef).toISOString().slice(0, 10);

  const consulta = supabase
    .from("produccion")
    .select(
      "id_produccion, fecha, id_empleado, empleado:empleados(nombre), id_producto, producto:productos(nombre), cantidad, minutos, costo_mo_lote"
    )
    .gte("fecha", inicioStr)
    .lte("fecha", finStr);

  const { data } = await (soloEmpleado != null ? consulta.eq("id_empleado", soloEmpleado) : consulta)
    .order("fecha", { ascending: false })
    .returns<RegistroQueryRow[]>();

  const registros = (data ?? []).map((r) => ({
    id_produccion: r.id_produccion,
    fecha: r.fecha,
    id_empleado: r.id_empleado,
    empleadoNombre: r.empleado?.nombre ?? null,
    id_producto: r.id_producto,
    productoNombre: r.producto?.nombre ?? null,
    cantidad: Number(r.cantidad),
    minutos: r.minutos !== null ? Number(r.minutos) : null,
    costo_mo_lote: Number(r.costo_mo_lote),
  }));

  const resumenMap = new Map<number, { id_empleado: number; nombre: string; piezas: number; minutos: number; totalPagar: number }>();
  for (const r of registros) {
    if (r.id_empleado === null) continue;
    const actual = resumenMap.get(r.id_empleado) ?? {
      id_empleado: r.id_empleado,
      nombre: r.empleadoNombre ?? "Sin nombre",
      piezas: 0,
      minutos: 0,
      totalPagar: 0,
    };
    actual.piezas += r.cantidad;
    actual.minutos += r.minutos ?? 0;
    actual.totalPagar += r.costo_mo_lote;
    resumenMap.set(r.id_empleado, actual);
  }
  const resumenPorEmpleado = Array.from(resumenMap.values()).sort((a, b) => b.totalPagar - a.totalPagar);

  return { registros, resumenPorEmpleado };
}
