begin;

alter table public.historial_mantenimiento
  add column if not exists descripcion text not null default '';

drop policy if exists "Usuarios pueden actualizar su historial de mantenimiento"
  on public.historial_mantenimiento;
create policy "Usuarios pueden actualizar su historial de mantenimiento"
  on public.historial_mantenimiento for update to authenticated
  using (
    auth.uid() = user_id
    and exists (
      select 1
      from public.equipos
      where equipos.id = historial_mantenimiento.equipo_id
        and equipos.user_id = auth.uid()
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.equipos
      where equipos.id = historial_mantenimiento.equipo_id
        and equipos.user_id = auth.uid()
    )
  );

drop policy if exists "Usuarios pueden eliminar su historial de mantenimiento"
  on public.historial_mantenimiento;
create policy "Usuarios pueden eliminar su historial de mantenimiento"
  on public.historial_mantenimiento for delete to authenticated
  using (
    auth.uid() = user_id
    and exists (
      select 1
      from public.equipos
      where equipos.id = historial_mantenimiento.equipo_id
        and equipos.user_id = auth.uid()
    )
  );

commit;
