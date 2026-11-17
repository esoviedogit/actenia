begin;

alter table public.equipos
  add column if not exists frecuencia_mantenimiento_meses integer;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'equipos'
      and column_name = 'frecuencia_mantenimiento'
  ) then
    execute $backfill$
      update public.equipos
      set frecuencia_mantenimiento_meses = case upper(btrim(frecuencia_mantenimiento::text))
        when 'MENSUAL' then 1
        when 'CADA MES' then 1
        when '1' then 1
        when 'BIMESTRAL' then 2
        when 'CADA 2 MESES' then 2
        when '2' then 2
        when 'TRIMESTRAL' then 3
        when 'CADA 3 MESES' then 3
        when '3' then 3
        when 'CUATRIMESTRAL' then 4
        when 'CADA 4 MESES' then 4
        when '4' then 4
        when 'SEMESTRAL' then 6
        when 'CADA 6 MESES' then 6
        when '6' then 6
        when 'ANUAL' then 12
        when 'CADA 12 MESES' then 12
        when '12' then 12
        else null
      end
      where frecuencia_mantenimiento_meses is null
        and nullif(btrim(frecuencia_mantenimiento::text), '') is not null
    $backfill$;
  end if;
end;
$$;

alter table public.mantenimientos_equipos
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.mantenimientos_equipos
  alter column user_id set default auth.uid();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.mantenimientos_equipos'::regclass
      and confrelid = 'auth.users'::regclass
      and contype = 'f'
      and conname = 'mantenimientos_equipos_user_id_fkey'
  ) then
    alter table public.mantenimientos_equipos
      add constraint mantenimientos_equipos_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete cascade;
  end if;
end;
$$;

commit;
