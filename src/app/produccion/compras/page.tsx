import { listarCompras, obtenerContextoCompras } from "./data";
import { ComprasTable } from "./compras-table";

export default async function ComprasPage() {
  const [compras, contexto] = await Promise.all([listarCompras(), obtenerContextoCompras()]);

  return (
    <ComprasTable
      compras={compras}
      proveedores={contexto.proveedores}
      metodos={contexto.metodos}
      empleados={contexto.empleados}
      materiales={contexto.materiales}
    />
  );
}
