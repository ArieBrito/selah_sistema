-- Permite registrar líneas de venta con producto manual (nombre y costo
-- capturados a mano), para cuando la pieza vendida no está en el catálogo.
--
-- Ejecutar completo en el SQL Editor de Supabase.

alter table public.venta_detalle alter column id_producto drop not null;
alter table public.venta_detalle add column if not exists nombre_manual text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'venta_detalle_producto_o_manual_check'
  ) then
    alter table public.venta_detalle
      add constraint venta_detalle_producto_o_manual_check
      check (id_producto is not null or nombre_manual is not null);
  end if;
end $$;

create or replace function public.crear_venta(
  p_fecha_hora timestamptz,
  p_id_cliente int,
  p_tipo_venta text,
  p_id_canal smallint,
  p_id_metodo smallint,
  p_descuento numeric,
  p_total numeric,
  p_pago_recibido numeric,
  p_detalle jsonb -- [{"id_producto":"...","nombre_manual":"...","cantidad":1,"precio_unit":100,"costo_unit_snap":50}]
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

  insert into public.venta_detalle (id_venta, linea, id_producto, nombre_manual, cantidad, precio_unit, costo_unit_snap)
  select v_id_venta,
         row_number() over (),
         nullif(linea->>'id_producto', ''),
         linea->>'nombre_manual',
         (linea->>'cantidad')::int,
         (linea->>'precio_unit')::numeric,
         (linea->>'costo_unit_snap')::numeric
  from jsonb_array_elements(p_detalle) as linea;

  return v_id_venta;
end;
$$;

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

  insert into public.venta_detalle (id_venta, linea, id_producto, nombre_manual, cantidad, precio_unit, costo_unit_snap)
  select p_id_venta,
         row_number() over (),
         nullif(linea->>'id_producto', ''),
         linea->>'nombre_manual',
         (linea->>'cantidad')::int,
         (linea->>'precio_unit')::numeric,
         (linea->>'costo_unit_snap')::numeric
  from jsonb_array_elements(p_detalle) as linea;

  return p_id_venta;
end;
$$;
