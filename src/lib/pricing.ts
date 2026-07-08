export type LineaMaterial = { cantidad: number; costoUnitario: number };

export type NivelClasificacion = {
  id_clasif: string;
  precio_tarifa: number;
  costo_max: number | null;
};

export function calcularCostoMateriales(lineas: LineaMaterial[]): number {
  return lineas.reduce((total, l) => total + l.cantidad * l.costoUnitario, 0);
}

export function calcularCostoCargado(
  costoMateriales: number,
  costoHilo: number,
  fijos: { costo_mano_obra: number; costo_empaque: number; costo_pago_hermana: number }
): number {
  return costoMateriales + costoHilo + fijos.costo_mano_obra + fijos.costo_empaque + fijos.costo_pago_hermana;
}

export function calcularPrecioMinimo(costoCargado: number, margenObjetivo = 0.3): number {
  return costoCargado / (1 - margenObjetivo);
}

/** Escalón más barato cuyo costo_max cubre el costo cargado. null => sin escalón (clasificación M, precio manual). */
export function buscarClasificacion(
  costoCargado: number,
  niveles: NivelClasificacion[]
): NivelClasificacion | null {
  const candidatos = niveles
    .filter((n) => n.costo_max !== null && n.costo_max >= costoCargado)
    .sort((a, b) => a.precio_tarifa - b.precio_tarifa);
  return candidatos[0] ?? null;
}

/** Nunca baja el precio de un producto existente. */
export function calcularPrecioFinal(precioEscalera: number, precioActual?: number | null): number {
  return Math.max(precioEscalera, precioActual ?? 0);
}

export function calcularMargenReal(precioFinal: number, costoCargado: number): number {
  if (precioFinal <= 0) return 0;
  return (precioFinal - costoCargado) / precioFinal;
}

export function margenToMarkup(margen: number): number {
  return margen / (1 - margen);
}

export function markupToMargen(markup: number): number {
  return markup / (1 + markup);
}

export function calcularResumen(
  lineas: LineaMaterial[],
  costoHilo: number,
  fijos: { costo_mano_obra: number; costo_empaque: number; costo_pago_hermana: number },
  niveles: NivelClasificacion[],
  precioActual?: number | null
) {
  const costoMateriales = calcularCostoMateriales(lineas);
  const costoCargado = calcularCostoCargado(costoMateriales, costoHilo, fijos);
  const precioMinimo = calcularPrecioMinimo(costoCargado, 0.3);
  const nivel = buscarClasificacion(costoCargado, niveles);
  return { costoMateriales, costoHilo, costoCargado, precioMinimo, nivel, precioActual: precioActual ?? null };
}
