export type MaterialRow = {
  id_material: string;
  nombre: string | null;
  descripcion: string | null;
  largo_mm: number | null;
  ancho_mm: number | null;
  costo_tira: number;
  piezas_por_tira: number | null;
  costo_unitario: number | null;
  stock_piezas: number;
  id_proveedor: number | null;
  proveedorNombre: string | null;
};

export type ProveedorOption = { id: number; nombre: string };
