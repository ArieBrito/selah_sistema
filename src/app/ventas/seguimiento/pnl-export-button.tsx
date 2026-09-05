"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

type Fila = { concepto: string; monto: number };

/** CSV plano (sin librerías): se abre directo en Excel y evita dependencias con vulnerabilidades conocidas. */
export function ExportarPnLButton({ mes, filas }: { mes: string; filas: Fila[] }) {
  function descargar() {
    const encabezado = "Concepto,Monto";
    const lineas = filas.map((f) => `"${f.concepto.replace(/"/g, '""')}",${f.monto.toFixed(2)}`);
    const csv = [encabezado, ...lineas].join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pnl_${mes}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={descargar}>
      <Download className="size-3.5" /> Descargar CSV
    </Button>
  );
}
