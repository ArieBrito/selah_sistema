export const NOMBRES_MES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export function formatoMes(fecha: Date) {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
}

/** Parsea "YYYY-MM" a un Date del día 1 de ese mes; si no es válido, usa el mes en curso. */
export function parsearMes(mes: string | undefined): Date {
  const match = mes?.match(/^(\d{4})-(\d{2})$/);
  if (!match) return new Date();
  const [, anio, mesNum] = match;
  return new Date(Number(anio), Number(mesNum) - 1, 1);
}
