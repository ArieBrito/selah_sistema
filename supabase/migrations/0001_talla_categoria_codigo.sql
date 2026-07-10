-- Agrega categoría seleccionable, tallas con stock independiente, y un código
-- de producto generado (7 caracteres) que reemplaza el id_producto entero.
--
-- Ejecutar completo en el SQL Editor de Supabase. Es seguro re-ejecutar los
-- bloques "create table if not exists" / "add column if not exists", pero
-- el bloque de migración de id_producto (sección 5) NO es re-ejecutable:
-- está pensado para correr una sola vez.

-- 1) Tallas fijas ------------------------------------------------------------

create table if not exists public.tamanos (
  id_tamano smallint primary key,
  nombre text not null,
  cm numeric
);

insert into public.tamanos (id_tamano, nombre, cm) values
  (1, 'Chica', 15),
  (2, 'Mediana', 16),
  (3, 'Grande', 17),
  (4, 'Otro', null)
on conflict (id_tamano) do nothing;

-- 2) Código corto de 1 carácter por clasificación ---------------------------
-- (id_clasif ya no cabe en 1 carácter: existen "A3", "A2", "A1". Este campo
-- es solo para construir el código de producto; el badge sigue usando
-- id_clasif tal cual.)

alter table public.clasificaciones add column if not exists codigo char(1);

update public.clasificaciones set codigo = case id_clasif
  when 'M' then 'M'
  when 'C' then 'C'
  when 'B' then 'B'
  when 'A' then 'A'
  when 'A3' then 'D'
  when 'A2' then 'E'
  when 'A1' then 'F'
  else codigo
end
where codigo is null;

alter table public.clasificaciones alter column codigo set not null;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'clasificaciones_codigo_key') then
    alter table public.clasificaciones add constraint clasificaciones_codigo_key unique (codigo);
  end if;
end $$;

-- 3) Folio consecutivo por combinación clasif+categoria+talla ---------------

create table if not exists public.producto_folios (
  clave text primary key,
  siguiente int not null default 0
);

-- 4) Talla en productos -------------------------------------------------------

alter table public.productos add column if not exists id_tamano smallint references public.tamanos(id_tamano);

update public.productos set id_tamano = 4 where id_tamano is null;

alter table public.productos alter column id_tamano set not null;

-- 5) Migrar id_producto de integer a varchar(7) ------------------------------
-- (Solo debe correr una vez. Si productos.id_producto ya es texto, este
-- bloque no hace nada.)

do $$
declare
  v_tipo text;
  r record;
  v_clave text;
  v_folio int;
begin
  select data_type into v_tipo
  from information_schema.columns
  where table_schema = 'public' and table_name = 'productos' and column_name = 'id_producto';

  if v_tipo = 'character varying' then
    raise notice 'productos.id_producto ya es varchar, no se repite la migración.';
    return;
  end if;

  -- 5.1 columna temporal con el código generado para cada fila existente
  alter table public.productos add column id_producto_new varchar(7);

  for r in
    select p.id_producto as id_viejo, cl.codigo as codigo, p.id_categoria, p.id_tamano
    from public.productos p
    join public.clasificaciones cl on cl.id_clasif = p.id_clasif
    order by p.id_producto
  loop
    v_clave := r.codigo || lpad(r.id_categoria::text, 2, '0') || r.id_tamano::text;

    insert into public.producto_folios (clave, siguiente) values (v_clave, 1)
      on conflict (clave) do update set siguiente = producto_folios.siguiente + 1
      returning siguiente into v_folio;

    update public.productos
      set id_producto_new = v_clave || lpad(v_folio::text, 3, '0')
      where id_producto = r.id_viejo;
  end loop;

  -- 5.2 propagar el código nuevo a las tablas que referencian productos
  alter table public.producto_materiales add column id_producto_new varchar(7);
  update public.producto_materiales pm
    set id_producto_new = p.id_producto_new
    from public.productos p
    where p.id_producto = pm.id_producto;

  alter table public.produccion add column id_producto_new varchar(7);
  update public.produccion pr
    set id_producto_new = p.id_producto_new
    from public.productos p
    where p.id_producto = pr.id_producto;

  -- 5.3 tirar cualquier FK que apunte a productos (sin importar su nombre)
  for r in
    select conname, conrelid::regclass as tabla
    from pg_constraint
    where confrelid = 'public.productos'::regclass and contype = 'f'
  loop
    execute format('alter table %s drop constraint %I', r.tabla, r.conname);
  end loop;

  -- 5.4 reemplazar la columna vieja por la nueva en las 3 tablas
  alter table public.productos drop constraint productos_pkey;
  alter table public.productos drop column id_producto;
  alter table public.productos rename column id_producto_new to id_producto;
  alter table public.productos alter column id_producto set not null;
  alter table public.productos add primary key (id_producto);

  alter table public.producto_materiales drop column id_producto;
  alter table public.producto_materiales rename column id_producto_new to id_producto;
  alter table public.producto_materiales alter column id_producto set not null;
  alter table public.producto_materiales
    add constraint producto_materiales_id_producto_fkey
    foreign key (id_producto) references public.productos(id_producto) on delete cascade;

  alter table public.produccion drop column id_producto;
  alter table public.produccion rename column id_producto_new to id_producto;
  alter table public.produccion
    add constraint produccion_id_producto_fkey
    foreign key (id_producto) references public.productos(id_producto);
end $$;

-- 6) RPC: editar una fila existente (una talla) ------------------------------

create or replace function public.guardar_diseno(
  p_id_producto varchar(7),
  p_nombre text,
  p_id_categoria int,
  p_id_clasif text,
  p_id_tipo_hilo int,
  p_id_tamano smallint,
  p_stock_piezas int,
  p_precio numeric,
  p_costo_mano_obra numeric,
  p_lineas jsonb
) returns varchar(7)
language plpgsql
as $$
begin
  update public.productos
  set nombre = p_nombre,
      id_categoria = p_id_categoria,
      id_clasif = p_id_clasif,
      id_tipo_hilo = p_id_tipo_hilo,
      id_tamano = p_id_tamano,
      stock_piezas = p_stock_piezas,
      precio = p_precio,
      costo_mano_obra = p_costo_mano_obra
  where id_producto = p_id_producto;

  delete from public.producto_materiales where id_producto = p_id_producto;

  insert into public.producto_materiales (id_producto, id_material, cantidad)
  select p_id_producto, (linea->>'id_material'), (linea->>'cantidad')::numeric
  from jsonb_array_elements(p_lineas) as linea;

  return p_id_producto;
end;
$$;

-- 7) RPC: crear un diseño nuevo con una o varias tallas ----------------------

create or replace function public.crear_diseno_variantes(
  p_nombre text,
  p_id_categoria int,
  p_id_clasif text,
  p_id_tipo_hilo int,
  p_precio numeric,
  p_costo_mano_obra numeric,
  p_lineas jsonb,
  p_tallas jsonb -- [{"id_tamano":1,"stock_piezas":5}, ...]
) returns varchar(7)[]
language plpgsql
as $$
declare
  v_codigo char(1);
  v_talla record;
  v_clave text;
  v_folio int;
  v_id_producto varchar(7);
  v_resultado varchar(7)[] := '{}';
begin
  select codigo into v_codigo from public.clasificaciones where id_clasif = p_id_clasif;

  for v_talla in
    select * from jsonb_to_recordset(p_tallas) as x(id_tamano smallint, stock_piezas int)
  loop
    v_clave := v_codigo || lpad(p_id_categoria::text, 2, '0') || v_talla.id_tamano::text;

    insert into public.producto_folios (clave, siguiente) values (v_clave, 1)
      on conflict (clave) do update set siguiente = producto_folios.siguiente + 1
      returning siguiente into v_folio;

    v_id_producto := v_clave || lpad(v_folio::text, 3, '0');

    insert into public.productos
      (id_producto, nombre, id_categoria, id_clasif, id_tipo_hilo, id_tamano, stock_piezas, precio, costo_mano_obra, activo)
    values
      (v_id_producto, p_nombre, p_id_categoria, p_id_clasif, p_id_tipo_hilo, v_talla.id_tamano, v_talla.stock_piezas, p_precio, p_costo_mano_obra, true);

    insert into public.producto_materiales (id_producto, id_material, cantidad)
    select v_id_producto, (linea->>'id_material'), (linea->>'cantidad')::numeric
    from jsonb_array_elements(p_lineas) as linea;

    v_resultado := array_append(v_resultado, v_id_producto);
  end loop;

  return v_resultado;
end;
$$;
