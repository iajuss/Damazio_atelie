import { createClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REQUIRED_LINE_SLUGS = [
  'bordados-em-roupas',
  'enxovais-e-toalhas',
  'bolsas-de-croche',
  'presentes-e-embalagens',
] as const;

type FieldType = 'text' | 'textarea' | 'select';
type Availability = 'available' | 'limited' | 'unavailable';

export type CatalogSeed = {
  approvedForLaunch: true;
  lines: Array<{
    slug: string;
    name: string;
    description: string;
    coverImage: string;
    mediaApprovedForLaunch: true;
    sortOrder: number;
    published: true;
  }>;
  products: Array<{
    lineSlug: string;
    slug: string;
    name: string;
    description: string;
    materials: string[];
    availability: Availability;
    sortOrder: number;
    published: true;
    media: Array<{
      url: string;
      altText: string;
      caption: string | null;
      sortOrder: number;
      isFeatured: boolean;
      mediaApprovedForLaunch: true;
    }>;
    customizationFields: Array<{
      key: string;
      label: string;
      type: FieldType;
      required: boolean;
      options: string[];
      helpText: string | null;
      sortOrder: number;
    }>;
  }>;
};

type SeedWriteInput = {
  apply: boolean;
  target: string | undefined;
  targetUrl: string | undefined;
  stagingUrl: string | undefined;
  confirmationUrl: string | undefined;
  allowWrite: boolean;
  allowRemoteStaging: boolean;
};

type SeedWriteMode = { mode: 'dry-run' } | { mode: 'apply'; targetUrl: string };

function seedError(message: string): never {
  throw new Error(`Seed do catálogo recusado: ${message}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nonEmptyText(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) seedError(`${field} é obrigatório.`);
  return value.trim();
}

function approvedHttpsMedia(value: unknown, field: string, approved: unknown): string {
  const urlValue = nonEmptyText(value, field);
  if (approved !== true) seedError(`${field} precisa ser mídia web aprovada sem marca-d'água.`);

  try {
    const url = new URL(urlValue);
    if (url.protocol !== 'https:') seedError(`${field} deve usar HTTPS.`);
    return url.toString();
  } catch {
    seedError(`${field} deve ser uma URL HTTPS absoluta.`);
  }
}

function asSortOrder(value: unknown, field: string): number {
  if (!Number.isInteger(value) || (value as number) < 0) seedError(`${field} deve ser um inteiro não negativo.`);
  return value as number;
}

function asStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || !item.trim())) seedError(`${field} deve conter textos não vazios.`);
  return value.map((item) => item.trim());
}

function unique(values: string[], field: string): void {
  if (new Set(values).size !== values.length) seedError(`${field} não pode conter valores repetidos.`);
}

export function validateCatalogSeed(input: unknown): CatalogSeed {
  if (!isRecord(input) || input.approvedForLaunch !== true) seedError('a aprovação explícita de lançamento é obrigatória.');
  if (!Array.isArray(input.lines) || !Array.isArray(input.products)) seedError('linhas e produtos devem ser listas.');

  const lines = input.lines.map((line, index) => {
    if (!isRecord(line) || line.published !== true) seedError(`linha ${index + 1} deve estar publicada.`);
    return {
      slug: nonEmptyText(line.slug, `linha ${index + 1}.slug`),
      name: nonEmptyText(line.name, `linha ${index + 1}.name`),
      description: nonEmptyText(line.description, `linha ${index + 1}.description`),
      coverImage: approvedHttpsMedia(line.coverImage, `linha ${index + 1}.coverImage`, line.mediaApprovedForLaunch),
      mediaApprovedForLaunch: true as const,
      sortOrder: asSortOrder(line.sortOrder, `linha ${index + 1}.sortOrder`),
      published: true as const,
    };
  });

  const lineSlugs = lines.map((line) => line.slug);
  unique(lineSlugs, 'slugs das linhas');
  if (lineSlugs.length !== REQUIRED_LINE_SLUGS.length || REQUIRED_LINE_SLUGS.some((slug) => !lineSlugs.includes(slug))) {
    seedError('as quatro linhas aprovadas são obrigatórias.');
  }

  const products = input.products.map((product, index) => {
    if (!isRecord(product) || product.published !== true) seedError(`produto ${index + 1} deve estar publicado.`);
    if (product.availability !== 'available' && product.availability !== 'limited' && product.availability !== 'unavailable') seedError(`produto ${index + 1}.availability é inválida.`);
    const availability = product.availability as Availability;
    if (!Array.isArray(product.media) || product.media.length === 0) seedError(`produto ${index + 1} precisa de mídia aprovada.`);
    if (!Array.isArray(product.customizationFields)) seedError(`produto ${index + 1}.customizationFields deve ser uma lista.`);

    const media = product.media.map((item, mediaIndex) => {
      if (!isRecord(item)) seedError(`produto ${index + 1}.media ${mediaIndex + 1} é inválida.`);
      return {
        url: approvedHttpsMedia(item.url, `produto ${index + 1}.media ${mediaIndex + 1}.url`, item.mediaApprovedForLaunch),
        altText: nonEmptyText(item.altText, `produto ${index + 1}.media ${mediaIndex + 1}.altText`),
        caption: item.caption === null ? null : nonEmptyText(item.caption, `produto ${index + 1}.media ${mediaIndex + 1}.caption`),
        sortOrder: asSortOrder(item.sortOrder, `produto ${index + 1}.media ${mediaIndex + 1}.sortOrder`),
        isFeatured: item.isFeatured === true,
        mediaApprovedForLaunch: true as const,
      };
    });

    const customizationFields = product.customizationFields.map((field, fieldIndex) => {
      if (!isRecord(field)) seedError(`produto ${index + 1}.campo ${fieldIndex + 1} é inválido.`);
      if (field.type !== 'text' && field.type !== 'textarea' && field.type !== 'select') seedError(`produto ${index + 1}.campo ${fieldIndex + 1}.type é inválido.`);
      const type = field.type as FieldType;
      const options = asStringArray(field.options, `produto ${index + 1}.campo ${fieldIndex + 1}.options`);
      if (type === 'select' && options.length === 0) seedError(`produto ${index + 1}.campo ${fieldIndex + 1} do tipo select precisa de opções.`);
      return {
        key: nonEmptyText(field.key, `produto ${index + 1}.campo ${fieldIndex + 1}.key`),
        label: nonEmptyText(field.label, `produto ${index + 1}.campo ${fieldIndex + 1}.label`),
        type,
        required: field.required === true,
        options,
        helpText: field.helpText === null ? null : nonEmptyText(field.helpText, `produto ${index + 1}.campo ${fieldIndex + 1}.helpText`),
        sortOrder: asSortOrder(field.sortOrder, `produto ${index + 1}.campo ${fieldIndex + 1}.sortOrder`),
      };
    });

    unique(media.map((item) => String(item.sortOrder)), `ordem das mídias do produto ${index + 1}`);
    unique(customizationFields.map((field) => field.key), `chaves dos campos do produto ${index + 1}`);
    if (!media.some((item) => item.isFeatured)) seedError(`produto ${index + 1} precisa de uma mídia em destaque.`);

    return {
      lineSlug: nonEmptyText(product.lineSlug, `produto ${index + 1}.lineSlug`),
      slug: nonEmptyText(product.slug, `produto ${index + 1}.slug`),
      name: nonEmptyText(product.name, `produto ${index + 1}.name`),
      description: nonEmptyText(product.description, `produto ${index + 1}.description`),
      materials: asStringArray(product.materials, `produto ${index + 1}.materials`),
      availability,
      sortOrder: asSortOrder(product.sortOrder, `produto ${index + 1}.sortOrder`),
      published: true as const,
      media,
      customizationFields,
    };
  });

  unique(products.map((product) => product.slug), 'slugs dos produtos');
  for (const product of products) {
    if (!lineSlugs.includes(product.lineSlug)) seedError(`o produto ${product.slug} precisa pertencer a uma linha existente.`);
  }
  for (const slug of REQUIRED_LINE_SLUGS) {
    if (!products.some((product) => product.lineSlug === slug && product.availability !== 'unavailable')) {
      seedError(`cada linha precisa de ao menos um exemplar publicado e disponível; falta ${slug}.`);
    }
  }

  return { approvedForLaunch: true, lines, products };
}

export function assertSeedWriteAllowed(input: SeedWriteInput): SeedWriteMode {
  if (!input.apply) return { mode: 'dry-run' };
  if (input.target !== 'staging') seedError('a escrita é permitida exclusivamente com CATALOG_SEED_TARGET=staging; produção é bloqueada.');
  if (!input.allowWrite) seedError('defina CATALOG_SEED_ALLOW_WRITE=true após autorização explícita.');
  if (!input.allowRemoteStaging) seedError('defina CATALOG_SEED_ALLOW_REMOTE_STAGING=true para confirmar o acesso remoto de staging.');
  const targetUrl = nonEmptyText(input.targetUrl, 'NEXT_PUBLIC_SUPABASE_URL');
  const stagingUrl = nonEmptyText(input.stagingUrl, 'CATALOG_SEED_STAGING_URL');
  const confirmationUrl = nonEmptyText(input.confirmationUrl, 'CATALOG_SEED_CONFIRM_URL');
  if (targetUrl !== stagingUrl) seedError('o destino não corresponde à allowlist CATALOG_SEED_STAGING_URL.');
  if (targetUrl !== confirmationUrl) seedError('CATALOG_SEED_CONFIRM_URL não corresponde exatamente ao destino informado.');

  try {
    if (new URL(targetUrl).protocol !== 'https:') seedError('o destino de staging deve usar HTTPS.');
  } catch {
    seedError('NEXT_PUBLIC_SUPABASE_URL deve ser uma URL absoluta.');
  }

  return { mode: 'apply', targetUrl };
}

async function readSeedFile(path: string | undefined): Promise<CatalogSeed> {
  if (!path) seedError('defina CATALOG_SEED_FILE com o JSON aprovado antes de executar o dry-run.');
  let parsed: unknown;
  try {
    parsed = JSON.parse(await readFile(resolve(path), 'utf8'));
  } catch {
    seedError('não foi possível ler o arquivo JSON aprovado.');
  }
  return validateCatalogSeed(parsed);
}

async function applySeed(seed: CatalogSeed, targetUrl: string, serviceRoleKey: string): Promise<void> {
  const client = createClient(targetUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const publishedAt = new Date().toISOString();
  const [{ data: existingLines, error: existingLinesError }, { data: existingProducts, error: existingProductsError }] = await Promise.all([
    client.from('product_lines').select('id').limit(1),
    client.from('products').select('id').limit(1),
  ]);
  if (existingLinesError || existingProductsError) seedError('não foi possível confirmar que o staging está vazio antes da escrita.');
  if ((existingLines?.length ?? 0) > 0 || (existingProducts?.length ?? 0) > 0) {
    seedError('o seed inicial só pode ser aplicado em um staging sem catálogo; revise registros existentes manualmente antes de prosseguir.');
  }

  const { data: lineRows, error: lineError } = await client.from('product_lines').upsert(
    seed.lines.map((line) => ({ slug: line.slug, name: line.name, description: line.description, cover_image: line.coverImage, sort_order: line.sortOrder, published: false, published_at: null })),
    { onConflict: 'slug' },
  ).select('id, slug');
  if (lineError || !lineRows) seedError('não foi possível gravar as linhas no staging.');
  const lineIds = new Map(lineRows.map((line) => [line.slug, line.id]));

  const { data: productRows, error: productError } = await client.from('products').upsert(
    seed.products.map((product) => ({ product_line_id: lineIds.get(product.lineSlug), slug: product.slug, name: product.name, description: product.description, materials: product.materials, availability: product.availability, sort_order: product.sortOrder, published: false, published_at: null })),
    { onConflict: 'slug' },
  ).select('id, slug');
  if (productError || !productRows) seedError('não foi possível gravar os produtos no staging.');
  const productIds = new Map(productRows.map((product) => [product.slug, product.id]));

  for (const product of seed.products) {
    const productId = productIds.get(product.slug);
    if (!productId) seedError(`o produto ${product.slug} não recebeu identificador no staging.`);
    const { error: mediaError } = await client.from('product_media').upsert(
      product.media.map((media) => ({ product_id: productId, url: media.url, alt_text: media.altText, caption: media.caption, sort_order: media.sortOrder, is_featured: media.isFeatured })),
      { onConflict: 'product_id,sort_order' },
    );
    if (mediaError) seedError(`não foi possível gravar as mídias de ${product.slug}.`);
    const { error: fieldError } = await client.from('customization_fields').upsert(
      product.customizationFields.map((field) => ({ product_id: productId, key: field.key, label: field.label, field_type: field.type, required: field.required, options: field.options, help_text: field.helpText, sort_order: field.sortOrder })),
      { onConflict: 'product_id,key' },
    );
    if (fieldError) seedError(`não foi possível gravar os campos de personalização de ${product.slug}.`);
  }

  const { error: publishProductsError } = await client.from('products').upsert(
    seed.products.map((product) => ({ slug: product.slug, published: true, published_at: publishedAt })),
    { onConflict: 'slug' },
  );
  if (publishProductsError) seedError('não foi possível publicar os produtos após validar suas dependências.');
  const { error: publishLinesError } = await client.from('product_lines').upsert(
    seed.lines.map((line) => ({ slug: line.slug, published: true, published_at: publishedAt })),
    { onConflict: 'slug' },
  );
  if (publishLinesError) seedError('não foi possível publicar as linhas após validar o catálogo.');
}

async function main(): Promise<void> {
  const seed = await readSeedFile(process.env.CATALOG_SEED_FILE);
  const mode = assertSeedWriteAllowed({
    apply: process.env.CATALOG_SEED_APPLY === 'true',
    target: process.env.CATALOG_SEED_TARGET,
    targetUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    stagingUrl: process.env.CATALOG_SEED_STAGING_URL,
    confirmationUrl: process.env.CATALOG_SEED_CONFIRM_URL,
    allowWrite: process.env.CATALOG_SEED_ALLOW_WRITE === 'true',
    allowRemoteStaging: process.env.CATALOG_SEED_ALLOW_REMOTE_STAGING === 'true',
  });

  if (mode.mode === 'dry-run') {
    console.info(`Dry-run concluído: ${seed.lines.length} linhas e ${seed.products.length} produtos aprovados; nenhuma escrita foi realizada.`);
    return;
  }

  const serviceRoleKey = nonEmptyText(process.env.SUPABASE_SERVICE_ROLE_KEY, 'SUPABASE_SERVICE_ROLE_KEY');
  await applySeed(seed, mode.targetUrl, serviceRoleKey);
  console.info(`Seed concluído no staging: ${seed.lines.length} linhas e ${seed.products.length} produtos. Nenhuma exclusão foi executada.`);
}

const executedDirectly = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (executedDirectly) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Seed do catálogo falhou.');
    process.exitCode = 1;
  });
}
