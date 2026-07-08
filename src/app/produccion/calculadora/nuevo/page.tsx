import { obtenerContextoPrecios } from "../data";
import { Configurador } from "../configurador";

export default async function NuevoDisenoPage() {
  const contexto = await obtenerContextoPrecios();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Nuevo diseño</h1>
      <Configurador contexto={contexto} />
    </div>
  );
}
