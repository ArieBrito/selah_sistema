import { z } from "zod";

const emptyToUndefined = (val: unknown) => (val === "" ? undefined : val);

export const materialFormSchema = z.object({
  id_material: z.string().trim().min(1, "El código es obligatorio"),
  nombre: z.string().trim().optional(),
  descripcion: z.string().trim().optional(),
  largo_mm: z.preprocess(emptyToUndefined, z.coerce.number().min(0).optional()),
  ancho_mm: z.preprocess(emptyToUndefined, z.coerce.number().min(0).optional()),
  costo_tira: z.coerce.number().min(0, "No puede ser negativo"),
  piezas_por_tira: z.preprocess(emptyToUndefined, z.coerce.number().positive("Debe ser mayor a 0").optional()),
  stock_piezas: z.coerce.number().min(0, "No puede ser negativo"),
  id_proveedor: z.number().int().positive().nullable().optional(),
});

export type MaterialFormValues = z.infer<typeof materialFormSchema>;

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
