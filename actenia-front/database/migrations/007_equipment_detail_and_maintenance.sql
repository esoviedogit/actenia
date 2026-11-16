begin;

alter table public.equipos
  add column if not exists nombre varchar(150),
  add column if not exists imagen_url text,
  add column if not exists fecha_proximo_mantenimiento date,
  add column if not exists fecha_proxima_calibracion date;

update public.equipos
set nombre = coalesce(nullif(btrim(nombre), ''), nullif(btrim(marca), ''), numero_inventario)
where nombre is null or btrim(nombre) = '';

alter table public.equipos
  alter column nombre set not null;

create table if not exists public.mantenimientos_equipos (
  id uuid primary key default gen_random_uuid(),
  equipo_id uuid not null references public.equipos(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  tipo varchar(40) not null
    check (tipo in ('MANTENIMIENTO_PREVENTIVO', 'MANTENIMIENTO_CORRECTIVO', 'CALIBRACION')),
  fecha date not null default current_date,
  descripcion text not null,
  proveedor_id uuid references public.proveedores(id) on delete set null,
  costo numeric(12, 2) check (costo is null or costo >= 0),
  proxima_fecha date,
  created_at timestamptz not null default now()
);

create index if not exists mantenimientos_equipos_user_equipo_fecha_idx
  on public.mantenimientos_equipos(user_id, equipo_id, fecha desc);

alter table public.mantenimientos_equipos enable row level security;

drop policy if exists "Usuarios pueden ver mantenimientos de sus equipos"
  on public.mantenimientos_equipos;
drop policy if exists "Usuarios pueden registrar mantenimientos de sus equipos"
  on public.mantenimientos_equipos;

create policy "Usuarios pueden ver mantenimientos de sus equipos"
  on public.mantenimientos_equipos for select to authenticated
  using (auth.uid() = user_id);

create policy "Usuarios pueden registrar mantenimientos de sus equipos"
  on public.mantenimientos_equipos for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.equipos
      where equipos.id = mantenimientos_equipos.equipo_id
        and equipos.user_id = auth.uid()
    )
  );

create or replace function public.update_equipment_maintenance_schedule()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.proxima_fecha is not null then
    if new.tipo = 'CALIBRACION' then
      update public.equipos
      set fecha_proxima_calibracion = new.proxima_fecha
      where id = new.equipo_id
        and user_id = new.user_id;
    else
      update public.equipos
      set fecha_proximo_mantenimiento = new.proxima_fecha
      where id = new.equipo_id
        and user_id = new.user_id;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists update_equipment_maintenance_schedule
  on public.mantenimientos_equipos;
create trigger update_equipment_maintenance_schedule
  after insert on public.mantenimientos_equipos
  for each row execute function public.update_equipment_maintenance_schedule();

commit;
