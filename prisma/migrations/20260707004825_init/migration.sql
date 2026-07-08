-- CreateEnum
CREATE TYPE "CategoriaMaterial" AS ENUM ('CUENTAS', 'DIJES', 'SEPARADORES', 'HILO', 'EMPAQUE', 'OTROS');

-- CreateTable
CREATE TABLE "categorias" (
    "id_categoria" SMALLSERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id_categoria")
);

-- CreateTable
CREATE TABLE "clasificaciones" (
    "id_clasif" VARCHAR(2) NOT NULL,
    "descripcion" TEXT,
    "precio_tarifa" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "costo_max" DECIMAL(12,2),

    CONSTRAINT "clasificaciones_pkey" PRIMARY KEY ("id_clasif")
);

-- CreateTable
CREATE TABLE "metodos_pago" (
    "id_metodo" SMALLSERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "metodos_pago_pkey" PRIMARY KEY ("id_metodo")
);

-- CreateTable
CREATE TABLE "tipos_gasto" (
    "id_tipo_gasto" SMALLSERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "tipos_gasto_pkey" PRIMARY KEY ("id_tipo_gasto")
);

-- CreateTable
CREATE TABLE "tipos_hilo" (
    "id_tipo_hilo" SMALLSERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "costo" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "tipos_hilo_pkey" PRIMARY KEY ("id_tipo_hilo")
);

-- CreateTable
CREATE TABLE "configuracion" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "costo_mano_obra" DECIMAL(12,2) NOT NULL DEFAULT 20,
    "costo_empaque" DECIMAL(12,2) NOT NULL DEFAULT 10,
    "costo_pago_hermana" DECIMAL(12,2) NOT NULL DEFAULT 20,
    "margen_objetivo" DECIMAL(5,4) NOT NULL DEFAULT 0.30,

    CONSTRAINT "configuracion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proveedores" (
    "id_proveedor" SMALLSERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "direccion" TEXT,

    CONSTRAINT "proveedores_pkey" PRIMARY KEY ("id_proveedor")
);

-- CreateTable
CREATE TABLE "empleados" (
    "id_empleado" SMALLSERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "empleados_pkey" PRIMARY KEY ("id_empleado")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id_cliente" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT,
    "edad" SMALLINT,
    "correo" TEXT,
    "telefono" TEXT,
    "direccion" TEXT,
    "es_revendedor" BOOLEAN NOT NULL DEFAULT false,
    "preferente" BOOLEAN NOT NULL DEFAULT false,
    "acepta_promos" BOOLEAN NOT NULL DEFAULT false,
    "creado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id_cliente")
);

-- CreateTable
CREATE TABLE "materiales" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria" "CategoriaMaterial" NOT NULL,
    "color" TEXT,
    "tamano" TEXT,
    "unidad_compra" TEXT,
    "cantidad_comprada" DECIMAL(10,2) NOT NULL,
    "precio_pagado" DECIMAL(12,2) NOT NULL,
    "costo_unitario" DECIMAL(12,4) NOT NULL,
    "fecha_compra" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observaciones" TEXT,
    "stock_piezas" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "stock_minimo" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "id_proveedor" SMALLINT,

    CONSTRAINT "materiales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id_producto" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "id_categoria" SMALLINT,
    "id_clasif" VARCHAR(2),
    "id_tipo_hilo" SMALLINT,
    "precio" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "costo_mano_obra" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "stock_piezas" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id_producto")
);

-- CreateTable
CREATE TABLE "producto_materiales" (
    "id_producto" INTEGER NOT NULL,
    "id_material" INTEGER NOT NULL,
    "cantidad" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "producto_materiales_pkey" PRIMARY KEY ("id_producto","id_material")
);

-- CreateTable
CREATE TABLE "compras" (
    "id_compra" SERIAL NOT NULL,
    "ticket" TEXT,
    "fecha" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_proveedor" SMALLINT,
    "id_metodo" SMALLINT,
    "id_empleado" SMALLINT,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,

    CONSTRAINT "compras_pkey" PRIMARY KEY ("id_compra")
);

-- CreateTable
CREATE TABLE "compra_detalle" (
    "id_compra" INTEGER NOT NULL,
    "id_material" INTEGER NOT NULL,
    "cantidad" DECIMAL(12,2) NOT NULL,
    "costo_unit" DECIMAL(12,4) NOT NULL,

    CONSTRAINT "compra_detalle_pkey" PRIMARY KEY ("id_compra","id_material")
);

-- CreateTable
CREATE TABLE "gastos" (
    "id_gasto" SERIAL NOT NULL,
    "fecha" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_tipo_gasto" SMALLINT,
    "concepto" TEXT,
    "cantidad" DECIMAL(12,2) NOT NULL DEFAULT 1,
    "monto" DECIMAL(12,2) NOT NULL,
    "id_metodo" SMALLINT,
    "id_empleado" SMALLINT,

    CONSTRAINT "gastos_pkey" PRIMARY KEY ("id_gasto")
);

-- CreateTable
CREATE TABLE "ventas" (
    "id_venta" SERIAL NOT NULL,
    "fecha_hora" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_cliente" INTEGER,
    "tipo_venta" TEXT NOT NULL DEFAULT 'Contado',
    "id_metodo" SMALLINT,
    "descuento" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "pago_recibido" DECIMAL(12,2) NOT NULL DEFAULT 0,

    CONSTRAINT "ventas_pkey" PRIMARY KEY ("id_venta")
);

-- CreateTable
CREATE TABLE "venta_detalle" (
    "id_venta" INTEGER NOT NULL,
    "linea" SMALLINT NOT NULL,
    "id_producto" INTEGER,
    "cantidad" INTEGER NOT NULL,
    "precio_unit" DECIMAL(12,2) NOT NULL,
    "costo_unit_snap" DECIMAL(12,4) NOT NULL DEFAULT 0,

    CONSTRAINT "venta_detalle_pkey" PRIMARY KEY ("id_venta","linea")
);

-- CreateTable
CREATE TABLE "produccion" (
    "id_produccion" SERIAL NOT NULL,
    "fecha" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_producto" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "id_empleado" SMALLINT,
    "para_stock" BOOLEAN NOT NULL DEFAULT true,
    "costo_mo_lote" DECIMAL(12,2) NOT NULL DEFAULT 0,

    CONSTRAINT "produccion_pkey" PRIMARY KEY ("id_produccion")
);

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nombre_key" ON "categorias"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "metodos_pago_nombre_key" ON "metodos_pago"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_gasto_nombre_key" ON "tipos_gasto"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_hilo_nombre_key" ON "tipos_hilo"("nombre");

-- CreateIndex
CREATE INDEX "materiales_id_proveedor_idx" ON "materiales"("id_proveedor");

-- CreateIndex
CREATE INDEX "productos_id_categoria_idx" ON "productos"("id_categoria");

-- CreateIndex
CREATE INDEX "productos_id_clasif_idx" ON "productos"("id_clasif");

-- CreateIndex
CREATE INDEX "producto_materiales_id_material_idx" ON "producto_materiales"("id_material");

-- CreateIndex
CREATE INDEX "compra_detalle_id_material_idx" ON "compra_detalle"("id_material");

-- CreateIndex
CREATE INDEX "gastos_fecha_idx" ON "gastos"("fecha");

-- CreateIndex
CREATE INDEX "gastos_id_tipo_gasto_idx" ON "gastos"("id_tipo_gasto");

-- CreateIndex
CREATE INDEX "ventas_id_cliente_idx" ON "ventas"("id_cliente");

-- CreateIndex
CREATE INDEX "ventas_fecha_hora_idx" ON "ventas"("fecha_hora");

-- CreateIndex
CREATE INDEX "venta_detalle_id_producto_idx" ON "venta_detalle"("id_producto");

-- CreateIndex
CREATE INDEX "produccion_id_producto_idx" ON "produccion"("id_producto");

-- AddForeignKey
ALTER TABLE "materiales" ADD CONSTRAINT "materiales_id_proveedor_fkey" FOREIGN KEY ("id_proveedor") REFERENCES "proveedores"("id_proveedor") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "categorias"("id_categoria") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_id_clasif_fkey" FOREIGN KEY ("id_clasif") REFERENCES "clasificaciones"("id_clasif") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_id_tipo_hilo_fkey" FOREIGN KEY ("id_tipo_hilo") REFERENCES "tipos_hilo"("id_tipo_hilo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producto_materiales" ADD CONSTRAINT "producto_materiales_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "productos"("id_producto") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producto_materiales" ADD CONSTRAINT "producto_materiales_id_material_fkey" FOREIGN KEY ("id_material") REFERENCES "materiales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compras" ADD CONSTRAINT "compras_id_proveedor_fkey" FOREIGN KEY ("id_proveedor") REFERENCES "proveedores"("id_proveedor") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compras" ADD CONSTRAINT "compras_id_metodo_fkey" FOREIGN KEY ("id_metodo") REFERENCES "metodos_pago"("id_metodo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compras" ADD CONSTRAINT "compras_id_empleado_fkey" FOREIGN KEY ("id_empleado") REFERENCES "empleados"("id_empleado") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compra_detalle" ADD CONSTRAINT "compra_detalle_id_compra_fkey" FOREIGN KEY ("id_compra") REFERENCES "compras"("id_compra") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compra_detalle" ADD CONSTRAINT "compra_detalle_id_material_fkey" FOREIGN KEY ("id_material") REFERENCES "materiales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos" ADD CONSTRAINT "gastos_id_tipo_gasto_fkey" FOREIGN KEY ("id_tipo_gasto") REFERENCES "tipos_gasto"("id_tipo_gasto") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos" ADD CONSTRAINT "gastos_id_metodo_fkey" FOREIGN KEY ("id_metodo") REFERENCES "metodos_pago"("id_metodo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos" ADD CONSTRAINT "gastos_id_empleado_fkey" FOREIGN KEY ("id_empleado") REFERENCES "empleados"("id_empleado") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "clientes"("id_cliente") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_id_metodo_fkey" FOREIGN KEY ("id_metodo") REFERENCES "metodos_pago"("id_metodo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venta_detalle" ADD CONSTRAINT "venta_detalle_id_venta_fkey" FOREIGN KEY ("id_venta") REFERENCES "ventas"("id_venta") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venta_detalle" ADD CONSTRAINT "venta_detalle_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "productos"("id_producto") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produccion" ADD CONSTRAINT "produccion_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "productos"("id_producto") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produccion" ADD CONSTRAINT "produccion_id_empleado_fkey" FOREIGN KEY ("id_empleado") REFERENCES "empleados"("id_empleado") ON DELETE SET NULL ON UPDATE CASCADE;
