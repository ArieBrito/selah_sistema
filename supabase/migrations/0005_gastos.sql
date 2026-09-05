-- Módulo de gastos operativos (empaque comprado aparte, transporte, renta de
-- stand en eventos, etc.), para poder calcular flujo de efectivo y P&L reales.
--
-- Ejecutar completo en el SQL Editor de Supabase.

create table if not exists public.gastos (
  id_gasto bigint generated always as identity primary key,
  fecha date not null default current_date,
  id_tipo_gasto int not null references public.tipos_gasto(id_tipo_gasto),
  descripcion text,
  monto numeric not null check (monto >= 0)
);
