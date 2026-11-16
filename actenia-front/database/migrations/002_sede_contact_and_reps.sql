begin;

alter table public.sedes
  add column if not exists telefono varchar(50),
  add column if not exists ciudad varchar(100),
  add column if not exists codigo_habilitacion varchar(50),
  add column if not exists created_at timestamptz not null default now();

commit;
