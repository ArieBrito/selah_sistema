import { listarVentas, obtenerContextoVentas } from "./data";
import { VentasTable } from "./ventas-table";

export default async function VentasPage() {
  const [ventas, contexto] = await Promise.all([listarVentas(), obtenerContextoVentas()]);

  return (
    <VentasTable
      ventas={ventas}
      canales={contexto.canales}
      metodos={contexto.metodos}
      clientes={contexto.clientes}
      productos={contexto.productos}
    />
  );
}
