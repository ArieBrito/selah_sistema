export type GastoRow = {
  id_gasto: number;
  fecha: string;
  id_tipo_gasto: number;
  tipoGastoNombre: string;
  descripcion: string | null;
  monto: number;
};

export type TipoGastoOption = { id: number; nombre: string };
