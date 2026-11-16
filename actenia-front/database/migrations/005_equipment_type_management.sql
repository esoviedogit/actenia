begin;

alter table public.tipos_equipo
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists clasificacion_riesgo varchar(3),
  add column if not exists frecuencia_mantenimiento_meses integer;

alter table public.tipos_equipo
  drop constraint if exists tipos_equipo_clasificacion_riesgo_check,
  add constraint tipos_equipo_clasificacion_riesgo_check
    check (clasificacion_riesgo is null or clasificacion_riesgo in ('I', 'IIa', 'IIb', 'III')),
  drop constraint if exists tipos_equipo_frecuencia_mantenimiento_meses_check,
  add constraint tipos_equipo_frecuencia_mantenimiento_meses_check
    check (frecuencia_mantenimiento_meses is null or frecuencia_mantenimiento_meses > 0);

create index if not exists tipos_equipo_user_id_idx
  on public.tipos_equipo(user_id);

drop policy if exists "Tipos de equipo visibles para todos los autenticados"
  on public.tipos_equipo;
drop policy if exists "Usuarios pueden crear sus tipos de equipo"
  on public.tipos_equipo;
drop policy if exists "Usuarios pueden actualizar sus tipos de equipo"
  on public.tipos_equipo;
drop policy if exists "Usuarios pueden eliminar sus tipos de equipo"
  on public.tipos_equipo;

create policy "Tipos de equipo visibles para todos los autenticados"
  on public.tipos_equipo for select to authenticated
  using (user_id is null or auth.uid() = user_id);
create policy "Usuarios pueden crear sus tipos de equipo"
  on public.tipos_equipo for insert to authenticated
  with check (auth.uid() = user_id);
create policy "Usuarios pueden actualizar sus tipos de equipo"
  on public.tipos_equipo for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "Usuarios pueden eliminar sus tipos de equipo"
  on public.tipos_equipo for delete to authenticated
  using (auth.uid() = user_id);

commit;
