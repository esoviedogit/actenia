begin;

alter table public.equipos
  add column if not exists meses_programados text[] not null default '{}';

update public.equipos
set meses_programados = '{}'
where meses_programados is null;

alter table public.equipos
  alter column meses_programados set default '{}',
  alter column meses_programados set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.equipos'::regclass
      and conname = 'equipos_meses_programados_check'
  ) then
    alter table public.equipos
      add constraint equipos_meses_programados_check
      check (
        meses_programados <@ array[
          'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
          'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
        ]::text[]
      );
  end if;
end;
$$;

create table if not exists public.historial_mantenimiento (
  id uuid primary key default gen_random_uuid(),
  equipo_id uuid not null references public.equipos(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  fecha_ejecucion date not null,
  estado varchar(20) not null default 'Realizado'
    check (estado = 'Realizado'),
  mes_programado varchar(12) not null
    check (mes_programado in (
      'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
      'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
    )),
  anio integer not null check (anio between 1900 and 9999),
  created_at timestamptz not null default now()
);

create index if not exists historial_mantenimiento_user_year_idx
  on public.historial_mantenimiento(user_id, anio, equipo_id);

alter table public.historial_mantenimiento enable row level security;

drop policy if exists "Usuarios pueden ver su historial de mantenimiento"
  on public.historial_mantenimiento;
drop policy if exists "Usuarios pueden registrar su historial de mantenimiento"
  on public.historial_mantenimiento;

create policy "Usuarios pueden ver su historial de mantenimiento"
  on public.historial_mantenimiento for select to authenticated
  using (auth.uid() = user_id);

create policy "Usuarios pueden registrar su historial de mantenimiento"
  on public.historial_mantenimiento for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.equipos
      where equipos.id = historial_mantenimiento.equipo_id
        and equipos.user_id = auth.uid()
    )
  );

commit;
