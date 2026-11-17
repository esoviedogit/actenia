begin;

alter table public.historial_mantenimiento
  add column if not exists tipo_mantenimiento_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.historial_mantenimiento'::regclass
      and conname = 'historial_mantenimiento_tipo_mantenimiento_id_fkey'
  ) then
    alter table public.historial_mantenimiento
      add constraint historial_mantenimiento_tipo_mantenimiento_id_fkey
      foreign key (tipo_mantenimiento_id)
      references public.tipos_mantenimiento_maestro(id);
  end if;
end;
$$;

create index if not exists historial_mantenimiento_tipo_mantenimiento_id_idx
  on public.historial_mantenimiento(tipo_mantenimiento_id);

alter table public.historial_mantenimiento
  alter column tipo drop not null,
  alter column tipo drop default;

commit;
