begin;

alter table public.equipos
  add column if not exists nombre varchar(150);

update public.equipos
set nombre = coalesce(nullif(btrim(nombre), ''), nullif(btrim(marca), ''), numero_inventario)
where nombre is null or btrim(nombre) = '';

alter table public.equipos
  alter column nombre set not null;

commit;
