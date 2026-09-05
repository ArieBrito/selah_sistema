-- Cobros parciales y entregas de dinero.
--
-- Una venta a crédito o por consignación no se cobra de golpe: el dinero entra
-- en partes. `cobros` guarda cada entrada y `ventas.pago_recibido` pasa a ser el
-- reflejo de su suma (lo mantiene un trigger), así el resto del sistema sigue
-- leyendo esa columna sin cambios.
--
-- `entregas` registra el dinero que ya se repartió (a Gaby, a Arie, a mano de
-- obra, etc.) para poder calcular el saldo pendiente de cada concepto.
--
-- Ejecutar completo en el SQL Editor de Supabase.

create table if not exists public.cobros (
  id_cobro bigint generated always as identity primary key,
  id_venta int not null references public.ventas(id_venta) on delete cascade,
  fecha date not null default current_date,
  monto numeric not null check (monto > 0),
  id_metodo smallint references public.metodos_pago(id_metodo),
  nota text
);

create index if not exists cobros_id_venta_idx on public.cobros (id_venta);
create index if not exists cobros_fecha_idx on public.cobros (fecha);

create or replace function public.sync_pago_recibido() returns trigger
language plpgsql
as $$
begin
  -- En un UPDATE que mueve el cobro de venta, hay que recalcular las dos.
  if tg_op in ('UPDATE', 'DELETE') then
    update public.ventas v
    set pago_recibido = coalesce((select sum(c.monto) from public.cobros c where c.id_venta = v.id_venta), 0)
    where v.id_venta = old.id_venta;
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    update public.ventas v
    set pago_recibido = coalesce((select sum(c.monto) from public.cobros c where c.id_venta = v.id_venta), 0)
    where v.id_venta = new.id_venta;
  end if;

  return null;
end;
$$;

drop trigger if exists cobros_sync_pago_recibido on public.cobros;
create trigger cobros_sync_pago_recibido
after insert or update or delete on public.cobros
for each row execute function public.sync_pago_recibido();

-- Los pagos que ya estaban capturados en la venta se vuelven su primer cobro.
insert into public.cobros (id_venta, fecha, monto, id_metodo, nota)
select v.id_venta, v.fecha_hora::date, v.pago_recibido, v.id_metodo, 'Pago inicial de la venta'
from public.ventas v
where v.pago_recibido > 0
  and not exists (select 1 from public.cobros c where c.id_venta = v.id_venta);

create table if not exists public.entregas (
  id_entrega bigint generated always as identity primary key,
  fecha date not null default current_date,
  concepto text not null check (concepto in ('Mano de obra', 'Empaque', 'Gaby', 'Arie', 'Reinversión')),
  monto numeric not null check (monto > 0),
  nota text
);

create index if not exists entregas_fecha_idx on public.entregas (fecha);

-- El pago inicial de una venta nueva entra como cobro; el trigger actualiza la columna.
create or replace function public.crear_venta(
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
declare
  v_id_venta int;
begin
  insert into public.ventas
    (fecha_hora, id_cliente, tipo_venta, id_canal, id_metodo, descuento, total, pago_recibido)
  values
    (coalesce(p_fecha_hora, now()), p_id_cliente, p_tipo_venta, p_id_canal, p_id_metodo, p_descuento, p_total, 0)
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

  if coalesce(p_pago_recibido, 0) > 0 then
    insert into public.cobros (id_venta, fecha, monto, id_metodo, nota)
    values (v_id_venta, coalesce(p_fecha_hora, now())::date, p_pago_recibido, p_id_metodo, 'Pago inicial de la venta');
  end if;

  return v_id_venta;
end;
$$;

-- Editar una venta ya no toca el dinero cobrado: eso se administra desde `cobros`.
drop function if exists public.actualizar_venta(int, timestamptz, int, text, smallint, smallint, numeric, numeric, numeric, jsonb);

create or replace function public.actualizar_venta(
  p_id_venta int,
  p_fecha_hora timestamptz,
  p_id_cliente int,
  p_tipo_venta text,
  p_id_canal smallint,
  p_id_metodo smallint,
  p_descuento numeric,
  p_total numeric,
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
      total = p_total
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
