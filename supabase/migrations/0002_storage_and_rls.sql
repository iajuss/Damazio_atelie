insert into storage.buckets (id, name, public)
values ('inquiry-references', 'inquiry-references', false)
on conflict (id) do update set public = false;

alter table public.product_lines enable row level security;
alter table public.products enable row level security;
alter table public.product_media enable row level security;
alter table public.customization_fields enable row level security;
alter table public.inquiries enable row level security;
alter table public.inquiry_answers enable row level security;
alter table public.inquiry_attachments enable row level security;
alter table public.content_blocks enable row level security;

create policy "anon reads published product lines"
on public.product_lines for select to anon
using (published = true);

create policy "anon reads published available products"
on public.products for select to anon
using (
  published = true
  and availability in ('available', 'limited')
  and exists (
    select 1
    from public.product_lines
    where product_lines.id = products.product_line_id
      and product_lines.published = true
  )
);

create policy "anon reads media for published available products"
on public.product_media for select to anon
using (
  exists (
    select 1
    from public.products
    join public.product_lines on product_lines.id = products.product_line_id
    where products.id = product_media.product_id
      and products.published = true
      and products.availability in ('available', 'limited')
      and product_lines.published = true
  )
);

create policy "anon reads customization for published available products"
on public.customization_fields for select to anon
using (
  exists (
    select 1
    from public.products
    join public.product_lines on product_lines.id = products.product_line_id
    where products.id = customization_fields.product_id
      and products.published = true
      and products.availability in ('available', 'limited')
      and product_lines.published = true
  )
);

create policy "anon reads published content"
on public.content_blocks for select to anon
using (published = true);

-- No anonymous policy is created for inquiries, answers, attachments, or storage.objects.
-- The private bucket therefore denies anonymous read and list requests by default.
