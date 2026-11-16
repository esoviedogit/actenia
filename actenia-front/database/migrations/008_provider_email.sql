begin;

alter table public.proveedores
  add column if not exists email varchar(100);

commit;
