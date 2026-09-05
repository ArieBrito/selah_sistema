import { endOfMonth, startOfMonth } from "date-fns";
import { supabase } from "@/lib/supabase";

export async function obtenerResumenInicio() {
  const inicioMes = startOfMonth(new Date());
  const finMes = endOfMonth(new Date());

  const [{ data: ventasMes }, { data: productos }, { data: ventas }, { data: compras }, { data: gastos }] = await Promise.all([
    supabase.from("ventas").select("total").gte("fecha_hora", inicioMes.toISOString()).lte("fecha_hora", finMes.toISOString()),
    supabase.from("productos").select("stock_piezas").eq("activo", true),
    supabase.from("ventas").select("pago_recibido"),
    supabase.from("compras").select("total"),
    supabase.from("gastos").select("monto"),
  ]);

  const ventasMesTotal = (ventasMes ?? []).reduce((s, v) => s + Number(v.total), 0);
  const stockTotal = (productos ?? []).reduce((s, p) => s + Number(p.stock_piezas), 0);
  const ingresos = (ventas ?? []).reduce((s, v) => s + Number(v.pago_recibido), 0);
  const egresos = (compras ?? []).reduce((s, c) => s + Number(c.total), 0) + (gastos ?? []).reduce((s, g) => s + Number(g.monto), 0);

  return { ventasMesTotal, stockTotal, dineroEnCaja: ingresos - egresos };
}
