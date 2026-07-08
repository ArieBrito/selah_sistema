import { notFound } from "next/navigation";
import { obtenerContextoPrecios, obtenerDisenoParaEditar } from "../data";
import { Configurador } from "../configurador";

export default async function EditarDisenoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [contexto, diseno] = await Promise.all([obtenerContextoPrecios(), obtenerDisenoParaEditar(Number(id))]);

  if (!diseno) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Editar diseño</h1>
      <Configurador contexto={contexto} disenoExistente={diseno} />
    </div>
  );
}
