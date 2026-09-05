import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { NOMBRES_MES, formatoMes, parsearMes } from "@/lib/mes";
import { listarProduccionMes, obtenerContextoRegistro } from "./data";
import { RegistroTable } from "./registro-table";

export default async function RegistroPulserasPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes } = await searchParams;
  const mesRef = parsearMes(mes);
  const mesAnterior = new Date(mesRef.getFullYear(), mesRef.getMonth() - 1, 1);
  const mesSiguiente = new Date(mesRef.getFullYear(), mesRef.getMonth() + 1, 1);
  const etiquetaMes = `${NOMBRES_MES[mesRef.getMonth()]} ${mesRef.getFullYear()}`;

  const [contexto, { registros, resumenPorEmpleado }] = await Promise.all([
    obtenerContextoRegistro(),
    listarProduccionMes(mesRef),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-6 sm:px-6">
      <div className="flex justify-end">
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
          <Link
            href={`/registro-pulseras?mes=${formatoMes(mesAnterior)}`}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="size-4" />
          </Link>
          <span className="w-32 text-center text-sm font-medium text-foreground">{etiquetaMes}</span>
          <Link
            href={`/registro-pulseras?mes=${formatoMes(mesSiguiente)}`}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="size-4" />
          </Link>
        </div>
      </div>

      <RegistroTable
        registros={registros}
        resumenPorEmpleado={resumenPorEmpleado}
        empleados={contexto.empleados}
        pulseras={contexto.pulseras}
        costoManoObra={contexto.costoManoObra}
      />
    </div>
  );
}
