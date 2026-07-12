import { z } from "zod";

const emptyToUndefined = (val: unknown) => (val === "" ? undefined : val);

export const materialCategorias = ["ingrediente", "insumo", "capital"] as const;
export type MaterialCategoria = (typeof materialCategorias)[number];

export const materialFormSchema = z.object({
  id_material: z.string().trim().min(1, "El código es obligatorio"),
  nombre: z.string().trim().optional(),
  categoria: z.enum(materialCategorias).default("ingrediente"),
  largo_mm: z.preprocess(emptyToUndefined, z.coerce.number().min(0).optional()),
  ancho_mm: z.preprocess(emptyToUndefined, z.coerce.number().min(0).optional()),
  costo_tira: z.preprocess(emptyToUndefined, z.coerce.number().min(0, "No puede ser negativo").optional().default(0)),
  piezas_por_tira: z.preprocess(emptyToUndefined, z.coerce.number().positive("Debe ser mayor a 0").optional()),
  stock_piezas: z.coerce.number().min(0, "No puede ser negativo"),
  id_proveedor: z.number().int().positive().nullable().optional(),
});

export type MaterialFormValues = z.infer<typeof materialFormSchema>;

export const loginFormSchema = z.object({
  email: z.string().trim().min(1, "El correo es obligatorio").email("Correo inválido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

export const proveedorFormSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
});

export const empleadoFormSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
});

export const compraFormSchema = z.object({
  id: z.number().int().positive().optional(),
  ticket: z.string().trim().optional(),
  fecha: z.string().trim().min(1, "La fecha es obligatoria"),
  id_proveedor: z.number().int().positive().nullable().optional(),
  id_metodo: z.number().int().positive().nullable().optional(),
  id_empleado: z.number().int().positive().nullable().optional(),
  lineas: z
    .array(
      z.object({
        id_material: z.string().min(1),
        cantidad: z.coerce.number().positive("Debe ser mayor a 0"),
        costo_unit: z.coerce.number().min(0, "No puede ser negativo"),
      })
    )
    .min(1, "Agrega al menos un material"),
});

export type CompraFormValues = z.infer<typeof compraFormSchema>;

export const tiposVenta = ["Contado", "Crédito"] as const;
export type TipoVenta = (typeof tiposVenta)[number];

export const clienteFormSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  apellido: z.string().trim().optional(),
  telefono: z.string().trim().optional(),
  es_revendedor: z.boolean().default(false),
});

export type ClienteFormValues = z.infer<typeof clienteFormSchema>;

export const ventaFormSchema = z.object({
  id_venta: z.number().int().positive().optional(),
  fecha_hora: z.string().trim().min(1, "La fecha es obligatoria"),
  id_cliente: z.number().int().positive().nullable().optional(),
  tipo_venta: z.enum(tiposVenta).default("Contado"),
  id_canal: z.number().int().positive("Elige un canal de venta"),
  id_metodo: z.number().int().positive("Elige un método de pago"),
  descuento_pct: z.coerce.number().min(0, "No puede ser negativo").max(100, "No puede ser mayor a 100").default(0),
  pago_recibido: z.coerce.number().min(0, "No puede ser negativo"),
  lineas: z
    .array(
      z.object({
        id_producto: z.string().min(1),
        cantidad: z.coerce.number().int().positive("Debe ser mayor a 0"),
        precio_unit: z.coerce.number().min(0, "No puede ser negativo"),
      })
    )
    .min(1, "Agrega al menos un producto"),
});

export type VentaFormValues = z.infer<typeof ventaFormSchema>;
