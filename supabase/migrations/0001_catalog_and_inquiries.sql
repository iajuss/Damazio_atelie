create extension if not exists pgcrypto;

create type public.product_availability as enum ('available', 'limited', 'unavailable');
create type public.inquiry_status as enum ('new', 'in_review', 'quoted', 'closed', 'archived');
create type public.customization_field_type as enum ('text', 'textarea', 'select');

create table public.product_lines (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 1 and 160),
  description text,
  cover_image text,
  sort_order integer not null default 0 check (sort_order >= 0),
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((published = false) or published_at is not null)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  product_line_id uuid not null references public.product_lines(id) on delete restrict,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 1 and 160),
  description text,
  materials text[] not null default '{}',
  availability public.product_availability not null default 'available',
  sort_order integer not null default 0 check (sort_order >= 0),
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((published = false) or published_at is not null)
);

create table public.product_media (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null check (char_length(url) between 1 and 2048),
  alt_text text not null check (char_length(alt_text) between 1 and 300),
  caption text,
  sort_order integer not null default 0 check (sort_order >= 0),
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, sort_order)
);

create table public.customization_fields (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  key text not null check (key ~ '^[a-z][a-z0-9_]{0,63}$'),
  label text not null check (char_length(label) between 1 and 160),
  field_type public.customization_field_type not null,
  required boolean not null default false,
  options jsonb not null default '[]'::jsonb check (jsonb_typeof(options) = 'array'),
  help_text text,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, key),
  unique (product_id, sort_order),
  check ((field_type = 'select' and jsonb_array_length(options) > 0) or field_type <> 'select')
);

create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  request_code text not null unique check (request_code ~ '^[A-Z0-9]{8,32}$'),
  product_id uuid not null references public.products(id) on delete restrict,
  name text not null check (char_length(name) between 1 and 160),
  contact text not null check (char_length(contact) between 1 and 200),
  city text not null check (char_length(city) between 1 and 120),
  state char(2) not null check (state ~ '^[A-Z]{2}$'),
  occasion text,
  description text,
  privacy_accepted_at timestamptz not null,
  status public.inquiry_status not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.inquiry_answers (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.inquiries(id) on delete cascade,
  customization_field_id uuid references public.customization_fields(id) on delete set null,
  field_key text not null check (field_key ~ '^[a-z][a-z0-9_]{0,63}$'),
  answer text not null check (char_length(answer) between 1 and 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (inquiry_id, field_key)
);

create table public.inquiry_attachments (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.inquiries(id) on delete cascade,
  storage_path text not null unique check (char_length(storage_path) between 1 and 1024),
  original_filename text,
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  byte_size bigint not null check (byte_size > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.content_blocks (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  kind text not null check (char_length(kind) between 1 and 80),
  title text,
  body text,
  media_url text,
  media_alt_text text,
  cta_label text,
  cta_href text,
  sort_order integer not null default 0 check (sort_order >= 0),
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((published = false) or published_at is not null)
);

create index product_lines_published_sort_order_idx on public.product_lines (published, sort_order);
create index products_public_catalog_idx on public.products (product_line_id, published, availability, sort_order);
create index product_media_product_sort_order_idx on public.product_media (product_id, sort_order);
create index customization_fields_product_sort_order_idx on public.customization_fields (product_id, sort_order);
create index inquiries_product_created_at_idx on public.inquiries (product_id, created_at desc);
create index inquiries_status_created_at_idx on public.inquiries (status, created_at desc);
create index inquiry_answers_inquiry_id_idx on public.inquiry_answers (inquiry_id);
create index inquiry_attachments_inquiry_id_idx on public.inquiry_attachments (inquiry_id);
create index content_blocks_published_sort_order_idx on public.content_blocks (published, sort_order);

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger product_lines_set_updated_at before update on public.product_lines for each row execute function public.set_updated_at();
create trigger products_set_updated_at before update on public.products for each row execute function public.set_updated_at();
create trigger product_media_set_updated_at before update on public.product_media for each row execute function public.set_updated_at();
create trigger customization_fields_set_updated_at before update on public.customization_fields for each row execute function public.set_updated_at();
create trigger inquiries_set_updated_at before update on public.inquiries for each row execute function public.set_updated_at();
create trigger inquiry_answers_set_updated_at before update on public.inquiry_answers for each row execute function public.set_updated_at();
create trigger inquiry_attachments_set_updated_at before update on public.inquiry_attachments for each row execute function public.set_updated_at();
create trigger content_blocks_set_updated_at before update on public.content_blocks for each row execute function public.set_updated_at();
