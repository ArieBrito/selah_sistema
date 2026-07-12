export type VentaLineaRow = {
  id_producto: string;
  nombre: string;
  cantidad: number;
  precio_unit: number;
  costo_unit_snap: number;
};

export type VentaRow = {
  id_venta: number;
  fecha_hora: string;
  id_cliente: number | null;
  clienteNombre: string | null;
  tipo_venta: string;
  id_canal: number | null;
  canalNombre: string | null;
  id_metodo: number | null;
  metodoNombre: string | null;
  descuento: number;
  total: number;
  pago_recibido: number;
  lineas: VentaLineaRow[];
};

export type ClienteOption = { id: number; nombre: string; apellido: string | null; es_revendedor: boolean };
export type CanalOption = { id: number; nombre: string };
export type MetodoOption = { id: number; nombre: string };
export type ProductoOption = { id_producto: string; nombre: string; precio: number; stock_piezas: number };
