-- Registro de pulseras por empleado: tiempo de producción es opcional.
--
-- Ejecutar completo en el SQL Editor de Supabase.

alter table public.produccion add column if not exists minutos integer;
