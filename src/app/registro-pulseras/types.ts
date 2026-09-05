export type RegistroProduccionRow = {
  id_produccion: number;
  fecha: string;
  id_empleado: number | null;
  empleadoNombre: string | null;
  id_producto: string | null;
  productoNombre: string | null;
  cantidad: number;
  minutos: number | null;
  costo_mo_lote: number;
};

export type EmpleadoOption = { id: number; nombre: string };
export type ProductoOption = { id_producto: string; nombre: string };

export type ResumenEmpleado = {
  id_empleado: number;
  nombre: string;
  piezas: number;
  minutos: number;
  totalPagar: number;
};
