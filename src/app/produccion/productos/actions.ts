"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";

export async function eliminarProducto(id_producto: string) {
  const { error } = await supabase.from("productos").delete().eq("id_producto", id_producto);

  if (error) {
    if (error.code === "23503") {
      const { count } = await supabase
        .from("produccion")
        .select("*", { count: "exact", head: true })
        .eq("id_producto", id_producto);
      const producciones = count ?? 0;
      return {
        ok: false as const,
        error:
          producciones > 0
            ? `Este producto tiene ${producciones} registro${producciones === 1 ? "" : "s"} de producción, no se puede eliminar. Puedes desactivarlo.`
            : "No se puede eliminar este producto porque está en uso.",
      };
    }
    throw new Error(error.message);
  }

  revalidatePath("/produccion/productos");
  revalidatePath("/produccion/calculadora");
  return { ok: true as const };
}

export async function cambiarActivoProducto(id_producto: string, activo: boolean) {
  const { error } = await supabase.from("productos").update({ activo }).eq("id_producto", id_producto);
  if (error) throw new Error(error.message);
  revalidatePath("/produccion/productos");
  revalidatePath("/produccion/calculadora");
  return { ok: true as const };
}
