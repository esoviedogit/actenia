begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'equipment-images',
  'equipment-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users upload their equipment type images" on storage.objects;
drop policy if exists "Users update their equipment type images" on storage.objects;
drop policy if exists "Users delete their equipment type images" on storage.objects;

create policy "Users upload their equipment type images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'equipment-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users update their equipment type images"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'equipment-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'equipment-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users delete their equipment type images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'equipment-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

commit;
