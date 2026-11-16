-- Align the existing schema with the frontend's per-user RLS and alert fields.
-- Backfill user_id for existing rows from your trusted ownership records before
-- relying on the application to display legacy data.
begin;

alter table public.equipos
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists fecha_proximo_mantenimiento date,
  add column if not exists fecha_proxima_calibracion date;

alter table public.sedes
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.consultorios
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.proveedores
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

create index if not exists equipos_user_id_idx on public.equipos(user_id);
create index if not exists sedes_user_id_idx on public.sedes(user_id);
create index if not exists consultorios_user_id_idx on public.consultorios(user_id);
create index if not exists proveedores_user_id_idx on public.proveedores(user_id);

alter table public.equipos enable row level security;
alter table public.sedes enable row level security;
alter table public.consultorios enable row level security;
alter table public.proveedores enable row level security;
alter table public.tipos_equipo enable row level security;

drop policy if exists "Usuarios pueden ver sus propios equipos" on public.equipos;
drop policy if exists "Usuarios pueden insertar sus propios equipos" on public.equipos;
drop policy if exists "Usuarios pueden actualizar sus propios equipos" on public.equipos;
drop policy if exists "Usuarios pueden eliminar sus propios equipos" on public.equipos;

create policy "Usuarios pueden ver sus propios equipos"
  on public.equipos for select to authenticated
  using (auth.uid() = user_id);
create policy "Usuarios pueden insertar sus propios equipos"
  on public.equipos for insert to authenticated
  with check (auth.uid() = user_id);
create policy "Usuarios pueden actualizar sus propios equipos"
  on public.equipos for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "Usuarios pueden eliminar sus propios equipos"
  on public.equipos for delete to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Usuarios pueden gestionar sus propias sedes" on public.sedes;
create policy "Usuarios pueden gestionar sus propias sedes"
  on public.sedes for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Usuarios pueden gestionar sus propios consultorios" on public.consultorios;
create policy "Usuarios pueden gestionar sus propios consultorios"
  on public.consultorios for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Usuarios pueden gestionar sus propios proveedores" on public.proveedores;
create policy "Usuarios pueden gestionar sus propios proveedores"
  on public.proveedores for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Tipos de equipo visibles para todos los autenticados" on public.tipos_equipo;
create policy "Tipos de equipo visibles para todos los autenticados"
  on public.tipos_equipo for select to authenticated
  using (true);

commit;
