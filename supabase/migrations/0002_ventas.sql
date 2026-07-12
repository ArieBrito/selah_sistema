-- Sistema de ventas: canal de venta, corrección de tipos y RPCs de guardado.
--
-- Ejecutar completo en el SQL Editor de Supabase. Todos los bloques son
-- seguros de re-ejecutar (create/alter ... if not exists, or replace).

-- 1) Canal de venta ----------------------------------------------------------

create table if not exists public.canal_venta (
  id_canal smallserial primary key,
  nombre text not null unique
);

insert into public.canal_venta (nombre) values
  ('Personal'),
  ('Bazar'),
  ('WhatsApp'),
  ('Redes'),
  ('Consignación'),
  ('Referidos')
on conflict (nombre) do nothing;

alter table public.ventas add column if not exists id_canal smallint references public.canal_venta(id_canal);

-- 2) Corregir tipo de venta_detalle.id_producto ------------------------------
-- productos.id_producto es varchar(7) desde 0001_talla_categoria_codigo.sql,
-- pero venta_detalle.id_producto quedó como integer (nunca hubo ventas). Se
-- corrige el tipo y se agrega la llave foránea que faltaba.

do $$
declare
  v_tipo text;
begin
  select data_type into v_tipo
  from information_schema.columns
  where table_schema = 'public' and table_name = 'venta_detalle' and column_name = 'id_producto';

  if v_tipo = 'character varying' then
    raise notice 'venta_detalle.id_producto ya es varchar, no se repite la corrección.';
    return;
  end if;

  delete from public.venta_detalle; -- tabla sin uso todavía; no hay datos que preservar
  alter table public.venta_detalle alter column id_producto type varchar(7) using id_producto::varchar(7);
  alter table public.venta_detalle alter column id_producto set not null;
  alter table public.venta_detalle
    add constraint venta_detalle_id_producto_fkey
    foreign key (id_producto) references public.productos(id_producto);
end $$;

-- 3) RPC: crear venta ---------------------------------------------------------

create or replace function public.crear_venta(
  p_fecha_hora timestamptz,
  p_id_cliente int,
  p_tipo_venta text,
  p_id_canal smallint,
  p_id_metodo smallint,
  p_descuento numeric,
  p_total numeric,
  p_pago_recibido numeric,
  p_detalle jsonb -- [{"id_producto":"...","cantidad":1,"precio_unit":100,"costo_unit_snap":50}]
) returns int
language plpgsql
as $$
declare
  v_id_venta int;
begin
  insert into public.ventas
    (fecha_hora, id_cliente, tipo_venta, id_canal, id_metodo, descuento, total, pago_recibido)
  values
    (coalesce(p_fecha_hora, now()), p_id_cliente, p_tipo_venta, p_id_canal, p_id_metodo, p_descuento, p_total, p_pago_recibido)
  returning id_venta into v_id_venta;

  insert into public.venta_detalle (id_venta, linea, id_producto, cantidad, precio_unit, costo_unit_snap)
  select v_id_venta,
         row_number() over () ,
         (linea->>'id_producto'),
         (linea->>'cantidad')::int,
         (linea->>'precio_unit')::numeric,
         (linea->>'costo_unit_snap')::numeric
  from jsonb_array_elements(p_detalle) as linea;

  return v_id_venta;
end;
$$;

-- 4) RPC: actualizar venta ----------------------------------------------------

create or replace function public.actualizar_venta(
  p_id_venta int,
  p_fecha_hora timestamptz,
  p_id_cliente int,
  p_tipo_venta text,
  p_id_canal smallint,
  p_id_metodo smallint,
  p_descuento numeric,
  p_total numeric,
  p_pago_recibido numeric,
  p_detalle jsonb
) returns int
language plpgsql
as $$
begin
  update public.ventas
  set fecha_hora = coalesce(p_fecha_hora, fecha_hora),
      id_cliente = p_id_cliente,
      tipo_venta = p_tipo_venta,
      id_canal = p_id_canal,
      id_metodo = p_id_metodo,
      descuento = p_descuento,
      total = p_total,
      pago_recibido = p_pago_recibido
  where id_venta = p_id_venta;

  delete from public.venta_detalle where id_venta = p_id_venta;

  insert into public.venta_detalle (id_venta, linea, id_producto, cantidad, precio_unit, costo_unit_snap)
  select p_id_venta,
         row_number() over (),
         (linea->>'id_producto'),
         (linea->>'cantidad')::int,
         (linea->>'precio_unit')::numeric,
         (linea->>'costo_unit_snap')::numeric
  from jsonb_array_elements(p_detalle) as linea;

  return p_id_venta;
end;
$$;
