update storage.buckets
set
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']::text[]
where id = 'inquiry-references';

create or replace function public.create_inquiry_with_contact_details(
  p_request_code text,
  p_product_id uuid,
  p_request_kind text,
  p_name text,
  p_contact text,
  p_email text,
  p_phone text,
  p_postal_code text,
  p_street text,
  p_address_number text,
  p_complement text,
  p_neighborhood text,
  p_city text,
  p_state char(2),
  p_occasion text,
  p_description text,
  p_privacy_accepted_at timestamptz,
  p_answers jsonb,
  p_attachments jsonb,
  p_atelier_notification_payload jsonb,
  p_customer_notification_payload jsonb
) returns table(inquiry_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inquiry_id uuid;
begin
  if p_request_kind not in ('product', 'custom')
    or (p_request_kind = 'product' and p_product_id is null)
    or (p_request_kind = 'custom' and p_product_id is not null) then
    raise exception 'invalid inquiry kind';
  end if;

  if jsonb_typeof(coalesce(p_answers, '{}'::jsonb)) <> 'object'
    or jsonb_typeof(coalesce(p_attachments, '[]'::jsonb)) <> 'array'
    or jsonb_typeof(coalesce(p_atelier_notification_payload, '{}'::jsonb)) <> 'object'
    or jsonb_typeof(coalesce(p_customer_notification_payload, '{}'::jsonb)) <> 'object' then
    raise exception 'invalid inquiry payload';
  end if;

  if p_contact is null or p_email is null or p_contact <> p_email then
    raise exception 'legacy contact must equal email';
  end if;

  if p_customer_notification_payload <> jsonb_build_object(
    'requestCode', p_request_code,
    'name', p_name,
    'email', p_email
  ) then
    raise exception 'invalid customer notification payload';
  end if;

  if p_request_kind = 'custom' and coalesce(p_answers, '{}'::jsonb) <> '{}'::jsonb then
    raise exception 'custom inquiry cannot have answers';
  end if;

  if p_request_kind = 'product' and (
    select count(*) from jsonb_object_keys(coalesce(p_answers, '{}'::jsonb))
  ) <> (
    select count(*)
    from jsonb_object_keys(coalesce(p_answers, '{}'::jsonb)) as answer_key(key)
    join public.customization_fields field
      on field.product_id = p_product_id and field.key = answer_key.key
  ) then
    raise exception 'invalid customization field';
  end if;

  insert into public.inquiries (
    request_code, request_kind, product_id, name, contact, email, phone, postal_code, street,
    address_number, complement, neighborhood, city, state, occasion, description, privacy_accepted_at
  ) values (
    p_request_code, p_request_kind, p_product_id, p_name, p_contact, p_email, p_phone, p_postal_code, p_street,
    p_address_number, p_complement, p_neighborhood, p_city, p_state, p_occasion, p_description, p_privacy_accepted_at
  ) returning id into v_inquiry_id;

  if p_request_kind = 'product' then
    insert into public.inquiry_answers (inquiry_id, customization_field_id, field_key, answer)
    select v_inquiry_id, field.id, item.key, item.value
    from jsonb_each_text(coalesce(p_answers, '{}'::jsonb)) as item(key, value)
    join public.customization_fields field
      on field.product_id = p_product_id and field.key = item.key;
  end if;

  insert into public.inquiry_attachments (inquiry_id, storage_path, original_filename, mime_type, byte_size)
  select v_inquiry_id, item.storage_path, item.original_filename, item.mime_type, item.byte_size
  from jsonb_to_recordset(coalesce(p_attachments, '[]'::jsonb)) as item(
    storage_path text, original_filename text, mime_type text, byte_size bigint
  );

  insert into public.inquiry_email_notifications (inquiry_id, recipient_kind, payload)
  values
    (v_inquiry_id, 'atelier', p_atelier_notification_payload),
    (v_inquiry_id, 'customer', p_customer_notification_payload);

  return query select v_inquiry_id;
end;
$$;

create or replace function public.claim_inquiry_email_notifications(
  p_limit integer,
  p_request_code text default null
) returns table(notification_id uuid, recipient_kind text, payload jsonb)
language sql
security definer
set search_path = ''
as $$
  with candidates as (
    select id
    from public.inquiry_email_notifications
    where (
      (status = 'pending' and next_attempt_at <= now())
      or (status = 'sending' and locked_at < now() - interval '15 minutes')
    )
      and (p_request_code is null or payload ->> 'requestCode' = p_request_code)
    order by created_at asc
    for update skip locked
    limit least(greatest(coalesce(p_limit, 1), 1), 10)
  ), claimed as (
    update public.inquiry_email_notifications notification
    set status = 'sending', locked_at = now()
    from candidates
    where notification.id = candidates.id
    returning notification.id, notification.recipient_kind, notification.payload
  )
  select id as notification_id, recipient_kind, payload from claimed;
$$;

create or replace function public.mark_inquiry_email_notification_sent(p_notification_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.inquiry_email_notifications
  set status = 'sent', sent_at = now(), locked_at = null, last_error = null
  where id = p_notification_id;
$$;

create or replace function public.reschedule_inquiry_email_notification(
  p_notification_id uuid,
  p_error text
) returns void
language sql
security definer
set search_path = ''
as $$
  update public.inquiry_email_notifications
  set
    attempts = attempts + 1,
    status = case when attempts + 1 >= 5 then 'failed' else 'pending' end,
    next_attempt_at = case when attempts + 1 >= 5 then now() else now() + interval '15 minutes' end,
    locked_at = null,
    last_error = left(coalesce(p_error, 'email delivery failed'), 300)
  where id = p_notification_id;
$$;

revoke all on function public.create_inquiry_with_contact_details(
  text, uuid, text, text, text, text, text, text, text, text, text, text, text, char, text, text, timestamptz, jsonb, jsonb, jsonb, jsonb
) from public;
revoke all on function public.claim_inquiry_email_notifications(integer, text) from public;
revoke all on function public.mark_inquiry_email_notification_sent(uuid) from public;
revoke all on function public.reschedule_inquiry_email_notification(uuid, text) from public;

grant execute on function public.create_inquiry_with_contact_details(
  text, uuid, text, text, text, text, text, text, text, text, text, text, text, char, text, text, timestamptz, jsonb, jsonb, jsonb, jsonb
) to service_role;
grant execute on function public.claim_inquiry_email_notifications(integer, text) to service_role;
grant execute on function public.mark_inquiry_email_notification_sent(uuid) to service_role;
grant execute on function public.reschedule_inquiry_email_notification(uuid, text) to service_role;

alter default privileges in schema public revoke execute on functions from public;
alter default privileges in schema public revoke execute on functions from anon, authenticated;
