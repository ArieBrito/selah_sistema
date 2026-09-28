"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { NOMBRES_MES } from "@/lib/mes";
import { crearXlsx } from "@/lib/xlsx";
import { obtenerCuadreCajaAnio } from "./actions";

/** Descarga el cuadre de caja de los 12 meses del año: un renglón por concepto y una columna por mes. */
export function ExportarCuadreButton({ anio }: { anio: number }) {
  const [descargando, setDescargando] = useState(false);

  async function descargar() {
    setDescargando(true);
    try {
      const filas = await obtenerCuadreCajaAnio(anio);
      const blob = crearXlsx(
        [
          ["Concepto", ...NOMBRES_MES, `Total ${anio}`],
          ...filas.map((f) => [f.concepto, ...f.montos, f.montos.reduce((s, m) => s + m, 0)]),
        ],
        `Cuadre de caja ${anio}`
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cuadre_caja_${anio}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo descargar el cuadre de caja.");
    } finally {
      setDescargando(false);
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={descargar} disabled={descargando}>
      <Download className="size-3.5" /> {descargando ? "Descargando…" : `Descargar ${anio} (.xlsx)`}
    </Button>
  );
}
