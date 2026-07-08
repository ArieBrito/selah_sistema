export type CompraLineaRow = { id_material: string; nombre: string; cantidad: number; costo_unit: number };

export type CompraRow = {
  id_compra: number;
  ticket: string | null;
  fecha: string;
  id_proveedor: number | null;
  proveedorNombre: string | null;
  id_metodo: number | null;
  metodoNombre: string | null;
  id_empleado: number | null;
  empleadoNombre: string | null;
  total: number;
  lineas: CompraLineaRow[];
};

export type ProveedorOption = { id: number; nombre: string };
export type MetodoOption = { id: number; nombre: string };
export type EmpleadoOption = { id: number; nombre: string };
export type MaterialOption = { id_material: string; nombre: string };
