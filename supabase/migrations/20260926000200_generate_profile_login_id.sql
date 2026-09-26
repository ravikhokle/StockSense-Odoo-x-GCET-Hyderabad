create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, login_id, email)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'login_id', ''),
      coalesce(nullif(split_part(new.email, '@', 1), ''), 'user') || '-' || left(replace(new.id::text, '-', ''), 8)
    ),
    new.email
  );
  return new;
end;
$$;
