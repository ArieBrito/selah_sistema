/*
  Warnings:

  - The primary key for the `compra_detalle` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `materiales` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `cantidad_comprada` on the `materiales` table. All the data in the column will be lost.
  - You are about to drop the column `categoria` on the `materiales` table. All the data in the column will be lost.
  - You are about to drop the column `color` on the `materiales` table. All the data in the column will be lost.
  - You are about to drop the column `fecha_compra` on the `materiales` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `materiales` table. All the data in the column will be lost.
  - You are about to drop the column `observaciones` on the `materiales` table. All the data in the column will be lost.
  - You are about to drop the column `precio_pagado` on the `materiales` table. All the data in the column will be lost.
  - You are about to drop the column `stock_minimo` on the `materiales` table. All the data in the column will be lost.
  - You are about to drop the column `tamano` on the `materiales` table. All the data in the column will be lost.
  - You are about to drop the column `unidad_compra` on the `materiales` table. All the data in the column will be lost.
  - The primary key for the `producto_materiales` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `costo_tira` to the `materiales` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id_material` to the `materiales` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "compra_detalle" DROP CONSTRAINT "compra_detalle_id_material_fkey";

-- DropForeignKey
ALTER TABLE "producto_materiales" DROP CONSTRAINT "producto_materiales_id_material_fkey";

-- AlterTable
ALTER TABLE "compra_detalle" DROP CONSTRAINT "compra_detalle_pkey",
ALTER COLUMN "id_material" SET DATA TYPE TEXT,
ADD CONSTRAINT "compra_detalle_pkey" PRIMARY KEY ("id_compra", "id_material");

-- AlterTable
ALTER TABLE "materiales" DROP CONSTRAINT "materiales_pkey",
DROP COLUMN "cantidad_comprada",
DROP COLUMN "categoria",
DROP COLUMN "color",
DROP COLUMN "fecha_compra",
DROP COLUMN "id",
DROP COLUMN "observaciones",
DROP COLUMN "precio_pagado",
DROP COLUMN "stock_minimo",
DROP COLUMN "tamano",
DROP COLUMN "unidad_compra",
ADD COLUMN     "ancho_mm" DECIMAL(10,2),
ADD COLUMN     "costo_tira" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "descripcion" TEXT,
ADD COLUMN     "id_material" TEXT NOT NULL,
ADD COLUMN     "largo_mm" DECIMAL(10,2),
ADD COLUMN     "piezas_por_tira" DECIMAL(12,2),
ALTER COLUMN "nombre" DROP NOT NULL,
ALTER COLUMN "costo_unitario" DROP NOT NULL,
ADD CONSTRAINT "materiales_pkey" PRIMARY KEY ("id_material");

-- AlterTable
ALTER TABLE "producto_materiales" DROP CONSTRAINT "producto_materiales_pkey",
ALTER COLUMN "id_material" SET DATA TYPE TEXT,
ADD CONSTRAINT "producto_materiales_pkey" PRIMARY KEY ("id_producto", "id_material");

-- DropEnum
DROP TYPE "CategoriaMaterial";

-- AddForeignKey
ALTER TABLE "producto_materiales" ADD CONSTRAINT "producto_materiales_id_material_fkey" FOREIGN KEY ("id_material") REFERENCES "materiales"("id_material") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compra_detalle" ADD CONSTRAINT "compra_detalle_id_material_fkey" FOREIGN KEY ("id_material") REFERENCES "materiales"("id_material") ON DELETE RESTRICT ON UPDATE CASCADE;
