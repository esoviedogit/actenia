begin;

alter table public.historial_mantenimiento
  add column if not exists tipo varchar(40) not null default 'MANTENIMIENTO_PREVENTIVO';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.historial_mantenimiento'::regclass
      and conname = 'historial_mantenimiento_tipo_check'
  ) then
    alter table public.historial_mantenimiento
      add constraint historial_mantenimiento_tipo_check
      check (tipo in (
        'MANTENIMIENTO_PREVENTIVO',
        'MANTENIMIENTO_CORRECTIVO',
        'CALIBRACION'
      ));
  end if;
end;
$$;

create index if not exists historial_mantenimiento_user_date_equipment_idx
  on public.historial_mantenimiento(user_id, fecha_ejecucion, equipo_id);

commit;
