begin;

alter table public.consultorios
  add column if not exists piso varchar(100),
  add column if not exists codigo_servicio varchar(50),
  add column if not exists created_at timestamptz not null default now();

drop policy if exists "Usuarios pueden gestionar sus propios consultorios"
  on public.consultorios;

create policy "Usuarios pueden gestionar sus propios consultorios"
  on public.consultorios for all to authenticated
  using (
    auth.uid() = user_id
    and exists (
      select 1
      from public.sedes
      where public.sedes.id = public.consultorios.sede_id
        and public.sedes.user_id = auth.uid()
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.sedes
      where public.sedes.id = public.consultorios.sede_id
        and public.sedes.user_id = auth.uid()
    )
  );

commit;
