-- Mueve el campo "descripción" de materiales a productos.
--
-- En 137 materiales existentes, 136 tenían descripcion idéntica a nombre y
-- solo 1 (fila de prueba "PRUEBA1") tenía un valor distinto ("Lorem ipsum"),
-- así que el campo no se usaba realmente en materiales. Se agrega en
-- productos, que es donde sí aporta valor (detalle del diseño/producto).
--
-- Ejecutar completo en el SQL Editor de Supabase.

alter table public.productos add column if not exists descripcion text;
alter table public.materiales drop column if exists descripcion;

-- Recrear los RPCs de guardado de diseño para incluir p_descripcion --------

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
  p_lineas jsonb,
  p_descripcion text default null
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
      costo_mano_obra = p_costo_mano_obra,
      descripcion = p_descripcion
  where id_producto = p_id_producto;

  delete from public.producto_materiales where id_producto = p_id_producto;

  insert into public.producto_materiales (id_producto, id_material, cantidad)
  select p_id_producto, (linea->>'id_material'), (linea->>'cantidad')::numeric
  from jsonb_array_elements(p_lineas) as linea;

  return p_id_producto;
end;
$$;

create or replace function public.crear_diseno_variantes(
  p_nombre text,
  p_id_categoria int,
  p_id_clasif text,
  p_id_tipo_hilo int,
  p_precio numeric,
  p_costo_mano_obra numeric,
  p_lineas jsonb,
  p_tallas jsonb, -- [{"id_tamano":1,"stock_piezas":5}, ...]
  p_descripcion text default null
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
      (id_producto, nombre, id_categoria, id_clasif, id_tipo_hilo, id_tamano, stock_piezas, precio, costo_mano_obra, activo, descripcion)
    values
      (v_id_producto, p_nombre, p_id_categoria, p_id_clasif, p_id_tipo_hilo, v_talla.id_tamano, v_talla.stock_piezas, p_precio, p_costo_mano_obra, true, p_descripcion);

    insert into public.producto_materiales (id_producto, id_material, cantidad)
    select v_id_producto, (linea->>'id_material'), (linea->>'cantidad')::numeric
    from jsonb_array_elements(p_lineas) as linea;

    v_resultado := array_append(v_resultado, v_id_producto);
  end loop;

  return v_resultado;
end;
$$;
