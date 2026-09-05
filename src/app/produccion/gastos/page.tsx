import { listarGastos, obtenerTiposGasto } from "./data";
import { GastosTable } from "./gastos-table";

export default async function GastosPage() {
  const [gastos, tiposGasto] = await Promise.all([listarGastos(), obtenerTiposGasto()]);

  return <GastosTable gastos={gastos} tiposGasto={tiposGasto} />;
}
