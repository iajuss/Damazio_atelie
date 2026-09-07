-- Publica o catálogo inicial exibido pelo site. Esta migração é idempotente:
-- ela não remove registros existentes e preserva conteúdo já preenchido.

insert into public.product_lines (
  slug,
  name,
  description,
  cover_image,
  sort_order,
  published,
  published_at
)
values
  ('bordados-em-roupas', 'Bordados em roupas', 'Detalhes que levam significado às peças do dia a dia.', '/images/catalogo/camisa-bordada-sem-marca.jpeg', 1, true, now()),
  ('enxovais-e-toalhas', 'Enxovais e toalhas', 'Afeto bordado para chegadas, celebrações e rituais de casa.', '/images/catalogo/toalhas-personalizadas-sem-marca.jpeg', 2, true, now()),
  ('bolsas-de-croche', 'Bolsas de crochê', 'Texturas autorais feitas à mão para acompanhar novos caminhos.', '/images/catalogo/bolsa-croche-sem-marca.jpeg', 3, true, now()),
  ('presentes-e-embalagens', 'Presentes e embalagens', 'Gestos delicados apresentados com o cuidado de uma lembrança.', '/images/catalogo/presente-embalado.jpeg', 4, true, now()),
  ('sousplats-de-croche', 'Sousplats de crochê', 'Texturas feitas à mão para receber encontros à mesa.', '/images/catalogo/sousplat-rosa-croche.jpeg', 5, true, now())
on conflict (slug) do update
set
  published = true,
  published_at = coalesce(public.product_lines.published_at, excluded.published_at),
  description = coalesce(public.product_lines.description, excluded.description),
  cover_image = coalesce(public.product_lines.cover_image, excluded.cover_image);

insert into public.products (
  product_line_id,
  slug,
  name,
  description,
  materials,
  availability,
  sort_order,
  published,
  published_at
)
select
  product_lines.id,
  seeds.slug,
  seeds.name,
  seeds.description,
  array[]::text[],
  seeds.availability::public.product_availability,
  seeds.sort_order,
  true,
  now()
from (
  values
    ('bordados-em-roupas', 'camisa-bordada', 'Camisa bordada', 'Uma inspiração para celebrar memórias em pequenos detalhes.', 'available', 1),
    ('enxovais-e-toalhas', 'toalha-personalizada', 'Toalha personalizada', 'Um gesto de cuidado pensado para acompanhar a rotina.', 'available', 2),
    ('bolsas-de-croche', 'bolsa-de-croche', 'Bolsa de crochê', 'Trama e acabamento para transformar o cotidiano.', 'limited', 3),
    ('presentes-e-embalagens', 'presente-embalado', 'Presente embalado', 'Uma lembrança preparada para surpreender desde o primeiro detalhe.', 'available', 4),
    ('sousplats-de-croche', 'sousplat-de-croche', 'Sousplats de crochê', 'Tramas autorais para acolher encontros à mesa.', 'available', 5)
) as seeds(line_slug, slug, name, description, availability, sort_order)
join public.product_lines on product_lines.slug = seeds.line_slug
on conflict (slug) do update
set
  published = true,
  published_at = coalesce(public.products.published_at, excluded.published_at);

insert into public.product_media (
  product_id,
  url,
  alt_text,
  caption,
  sort_order,
  is_featured
)
select
  products.id,
  seeds.url,
  seeds.alt_text,
  seeds.caption,
  seeds.sort_order,
  seeds.is_featured
from (
  values
    ('camisa-bordada', '/images/catalogo/camisa-bordada-sem-marca.jpeg', 'Camiseta branca com bordado personalizado da Damazio Atelier', null::text, 1, true),
    ('camisa-bordada', '/images/catalogo/camisa-familia.jpeg', 'Camiseta branca bordada com ilustração de família', 'Bordado que guarda uma celebração em família', 2, false),
    ('camisa-bordada', '/images/catalogo/camisa-embalada.jpeg', 'Camiseta bordada embalada para presente', 'Peça preparada para ser entregue com afeto', 3, false),
    ('toalha-personalizada', '/images/catalogo/toalhas-personalizadas-sem-marca.jpeg', 'Toalhas azuis personalizadas com bordado João Pedro', null::text, 1, true),
    ('toalha-personalizada', '/images/catalogo/toalha-ronaldo.jpeg', 'Toalha branca bordada com o nome Ronaldo', 'Bordado com inicial e nome', 2, false),
    ('toalha-personalizada', '/images/catalogo/toalha-tamires.jpeg', 'Toalha branca bordada com o nome Tamires', 'Personalização em tons neutros', 3, false),
    ('toalha-personalizada', '/images/catalogo/toalha-heitor.jpeg', 'Toalha branca bordada com o nome Heitor', 'Inicial e nome bordados', 4, false),
    ('toalha-personalizada', '/images/catalogo/toalha-marina.jpeg', 'Toalha bordada com o nome Marina', 'Bordado em azul e branco', 5, false),
    ('toalha-personalizada', '/images/catalogo/toalha-milena.jpeg', 'Toalha bordada com o nome Milena', 'Bordado em tons suaves', 6, false),
    ('toalha-personalizada', '/images/catalogo/kit-toalhas-embalado.jpeg', 'Kit de toalhas bordadas embalado pela Damazio Atelier', 'Uma sugestão para presentear', 7, false),
    ('bolsa-de-croche', '/images/catalogo/bolsa-croche-sem-marca.jpeg', 'Bolsa bege de crochê artesanal da Damazio Atelier', null::text, 1, true),
    ('bolsa-de-croche', '/images/catalogo/bolsa-dourada-croche.jpeg', 'Bolsa marrom de crochê com ferragens douradas', 'Trama e ferragens em evidência', 2, false),
    ('presente-embalado', '/images/catalogo/presente-embalado.jpeg', 'Presente embalado pela Damazio Atelier', 'Embalagem preparada para tornar a entrega ainda mais especial', 1, true),
    ('sousplat-de-croche', '/images/catalogo/mesa-sousplats-croche.jpeg', 'Mesa posta com sousplats de crochê', 'Um detalhe que acolhe encontros', 1, true),
    ('sousplat-de-croche', '/images/catalogo/sousplat-branco-dourado.jpeg', 'Sousplat branco de crochê com acabamento dourado', 'Textura para a mesa posta', 2, false),
    ('sousplat-de-croche', '/images/catalogo/sousplat-rosa-croche.jpeg', 'Sousplat rosé de crochê com borda clara', 'Crochê em composição delicada', 3, false)
) as seeds(product_slug, url, alt_text, caption, sort_order, is_featured)
join public.products on products.slug = seeds.product_slug
on conflict (product_id, sort_order) do nothing;
