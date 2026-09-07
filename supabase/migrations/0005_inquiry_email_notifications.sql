create table public.inquiry_email_notifications (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.inquiries(id) on delete cascade,
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  status text not null default 'pending' check (status in ('pending', 'sending', 'sent', 'failed')),
  attempts integer not null default 0 check (attempts >= 0),
  next_attempt_at timestamptz not null default now(),
  locked_at timestamptz,
  sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (inquiry_id)
);

create index inquiry_email_notifications_due_idx
  on public.inquiry_email_notifications (status, next_attempt_at, created_at);

create trigger inquiry_email_notifications_set_updated_at
before update on public.inquiry_email_notifications
for each row execute function public.set_updated_at();

alter table public.inquiry_email_notifications enable row level security;

drop function if exists public.create_inquiry_with_answers(text, uuid, text, text, text, text, char, text, text, timestamptz, jsonb, jsonb);

create function public.create_inquiry_with_answers(
  p_request_code text,
  p_product_id uuid,
  p_request_kind text,
  p_name text,
  p_contact text,
  p_city text,
  p_state char(2),
  p_occasion text,
  p_description text,
  p_privacy_accepted_at timestamptz,
  p_answers jsonb,
  p_attachments jsonb,
  p_notification_payload jsonb
) returns table(inquiry_id uuid)
language plpgsql security definer set search_path = public as $$
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
    or jsonb_typeof(coalesce(p_notification_payload, '{}'::jsonb)) <> 'object' then
    raise exception 'invalid inquiry payload';
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
    request_code, request_kind, product_id, name, contact, city, state, occasion, description, privacy_accepted_at
  ) values (
    p_request_code, p_request_kind, p_product_id, p_name, p_contact, p_city, p_state, p_occasion, p_description, p_privacy_accepted_at
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

  insert into public.inquiry_email_notifications (inquiry_id, payload)
  values (v_inquiry_id, p_notification_payload);

  return query select v_inquiry_id;
end;
$$;

create function public.claim_inquiry_email_notifications(
  p_limit integer,
  p_request_code text default null
) returns table(notification_id uuid, payload jsonb)
language sql security definer set search_path = public as $$
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
    returning notification.id, notification.payload
  )
  select id as notification_id, payload from claimed;
$$;

create function public.mark_inquiry_email_notification_sent(p_notification_id uuid)
returns void
language sql security definer set search_path = public as $$
  update public.inquiry_email_notifications
  set status = 'sent', sent_at = now(), locked_at = null, last_error = null
  where id = p_notification_id;
$$;

create function public.reschedule_inquiry_email_notification(
  p_notification_id uuid,
  p_error text
) returns void
language sql security definer set search_path = public as $$
  update public.inquiry_email_notifications
  set
    attempts = attempts + 1,
    status = case when attempts + 1 >= 5 then 'failed' else 'pending' end,
    next_attempt_at = case when attempts + 1 >= 5 then now() else now() + interval '15 minutes' end,
    locked_at = null,
    last_error = left(coalesce(p_error, 'email delivery failed'), 300)
  where id = p_notification_id;
$$;

revoke all on table public.inquiry_email_notifications from public;
revoke execute on function public.create_inquiry_with_answers(text, uuid, text, text, text, text, char, text, text, timestamptz, jsonb, jsonb, jsonb) from public;
revoke execute on function public.claim_inquiry_email_notifications(integer, text) from public;
revoke execute on function public.mark_inquiry_email_notification_sent(uuid) from public;
revoke execute on function public.reschedule_inquiry_email_notification(uuid, text) from public;

grant execute on function public.create_inquiry_with_answers(text, uuid, text, text, text, text, char, text, text, timestamptz, jsonb, jsonb, jsonb) to service_role;
grant execute on function public.claim_inquiry_email_notifications(integer, text) to service_role;
grant execute on function public.mark_inquiry_email_notification_sent(uuid) to service_role;
grant execute on function public.reschedule_inquiry_email_notification(uuid, text) to service_role;
