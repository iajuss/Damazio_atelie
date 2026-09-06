alter table public.inquiries
  add column request_kind text not null default 'product' check (request_kind in ('product', 'custom'));

alter table public.inquiries alter column product_id drop not null;

alter table public.inquiries add constraint inquiries_kind_product_check check (
  (request_kind = 'product' and product_id is not null) or
  (request_kind = 'custom' and product_id is null)
);

drop function if exists public.create_inquiry_with_answers(text, uuid, text, text, text, char, text, text, timestamptz, jsonb, jsonb);

create function public.create_inquiry_with_answers(
  p_request_code text, p_product_id uuid, p_request_kind text, p_name text, p_contact text, p_city text, p_state char(2), p_occasion text, p_description text, p_privacy_accepted_at timestamptz, p_answers jsonb, p_attachments jsonb
) returns table(inquiry_id uuid) language plpgsql security definer set search_path = public as $$
declare v_inquiry_id uuid;
begin
  if p_request_kind not in ('product', 'custom') or (p_request_kind = 'product' and p_product_id is null) or (p_request_kind = 'custom' and p_product_id is not null) then raise exception 'invalid inquiry kind'; end if;
  if p_request_kind = 'custom' and coalesce(p_answers, '{}'::jsonb) <> '{}'::jsonb then raise exception 'custom inquiry cannot have answers'; end if;
  if p_request_kind = 'product' and (select count(*) from jsonb_object_keys(coalesce(p_answers, '{}'::jsonb))) <> (select count(*) from jsonb_object_keys(coalesce(p_answers, '{}'::jsonb)) as answer_key(key) join public.customization_fields field on field.product_id = p_product_id and field.key = answer_key.key) then raise exception 'invalid customization field'; end if;
  insert into public.inquiries (request_code, request_kind, product_id, name, contact, city, state, occasion, description, privacy_accepted_at) values (p_request_code, p_request_kind, p_product_id, p_name, p_contact, p_city, p_state, p_occasion, p_description, p_privacy_accepted_at) returning id into v_inquiry_id;
  if p_request_kind = 'product' then insert into public.inquiry_answers (inquiry_id, customization_field_id, field_key, answer) select v_inquiry_id, field.id, item.key, item.value from jsonb_each_text(coalesce(p_answers, '{}'::jsonb)) as item(key, value) join public.customization_fields field on field.product_id = p_product_id and field.key = item.key; end if;
  insert into public.inquiry_attachments (inquiry_id, storage_path, original_filename, mime_type, byte_size) select v_inquiry_id, item.storage_path, item.original_filename, item.mime_type, item.byte_size from jsonb_to_recordset(coalesce(p_attachments, '[]'::jsonb)) as item(storage_path text, original_filename text, mime_type text, byte_size bigint);
  return query select v_inquiry_id;
end;
$$;

revoke execute on function public.create_inquiry_with_answers(text, uuid, text, text, text, text, char, text, text, timestamptz, jsonb, jsonb) from public;
grant execute on function public.create_inquiry_with_answers(text, uuid, text, text, text, text, char, text, text, timestamptz, jsonb, jsonb) to service_role;
