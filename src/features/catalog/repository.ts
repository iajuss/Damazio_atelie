import 'server-only';

import { createPublicSupabaseClient } from '@/lib/supabase/public';
import type {
  Availability,
  CatalogLine,
  CatalogProduct,
  CustomizationField,
} from './types';

type CatalogQuery = {
  select: (columns: string) => CatalogQuery;
  eq: (column: string, value: unknown) => CatalogQuery;
  neq: (column: string, value: unknown) => CatalogQuery;
  order: (column: string, options?: { ascending?: boolean; referencedTable?: string }) => CatalogQuery | PromiseLike<{ data: unknown; error: { message: string } | null }>;
  limit: (count: number) => CatalogQuery;
  maybeSingle: () => Promise<{ data: unknown; error: { message: string } | null }>;
};

export type CatalogDataSource = {
  from: (table: 'product_lines' | 'products') => CatalogQuery;
};

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  materials: string[] | null;
  availability: Availability;
  published: boolean;
  sort_order: number;
  product_line: { slug: string; published: boolean } | null;
  product_media: Array<{
    url: string;
    alt_text: string;
    caption: string | null;
    sort_order: number;
    is_featured: boolean;
  }> | null;
  customization_fields: Array<{
    key: string;
    label: string;
    field_type: CustomizationField['type'];
    required: boolean;
    options: string[] | null;
    help_text: string | null;
    sort_order: number;
  }> | null;
};

type ProductLineRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  cover_image: string | null;
  sort_order: number;
  published: boolean;
};

const productColumns = `
  id,
  slug,
  name,
  description,
  materials,
  availability,
  published,
  sort_order,
  product_line:product_lines!inner(slug, published),
  product_media(url, alt_text, caption, sort_order, is_featured),
  customization_fields(key, label, field_type, required, options, help_text, sort_order)
`;

function throwQueryError(error: { message: string } | null): void {
  if (error) {
    throw new Error('Não foi possível carregar o catálogo publicado.');
  }
}

function isPublishedProduct(row: ProductRow): boolean {
  return row.published && row.product_line?.published === true && row.availability !== 'unavailable';
}

function mapProduct(row: ProductRow): CatalogProduct | null {
  if (!isPublishedProduct(row)) {
    return null;
  }

  const line = row.product_line;

  if (!line) {
    return null;
  }

  return {
    id: row.id,
    lineSlug: line.slug,
    slug: row.slug,
    name: row.name,
    description: row.description,
    materials: row.materials ?? [],
    availability: row.availability,
    media: [...(row.product_media ?? [])]
      .sort((left, right) => left.sort_order - right.sort_order)
      .map((media) => ({
        url: media.url,
        altText: media.alt_text,
        caption: media.caption,
        sortOrder: media.sort_order,
        isFeatured: media.is_featured,
      })),
    customizationFields: [...(row.customization_fields ?? [])]
      .sort((left, right) => left.sort_order - right.sort_order)
      .map((field) => ({
        key: field.key,
        label: field.label,
        type: field.field_type,
        required: field.required,
        options: field.options ?? [],
        helpText: field.help_text,
        sortOrder: field.sort_order,
      })),
  };
}

function mapLine(row: ProductLineRow): CatalogLine | null {
  if (!row.published) {
    return null;
  }

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    coverImage: row.cover_image,
    sortOrder: row.sort_order,
  };
}

function createDefaultDataSource(): CatalogDataSource {
  return createPublicSupabaseClient() as unknown as CatalogDataSource;
}

export function createCatalogRepository(source: CatalogDataSource = createDefaultDataSource()) {
  return {
    async listPublishedLines(): Promise<CatalogLine[]> {
      const response = await source
        .from('product_lines')
        .select('id, slug, name, description, cover_image, sort_order, published')
        .eq('published', true)
        .order('sort_order', { ascending: true });
      const { data, error } = response as { data: ProductLineRow[] | null; error: { message: string } | null };
      throwQueryError(error);

      return (data ?? [])
        .map(mapLine)
        .filter((line): line is CatalogLine => line !== null);
    },

    async listPublishedProducts(): Promise<CatalogProduct[]> {
      const response = await source
        .from('products')
        .select(productColumns)
        .eq('published', true)
        .eq('product_line.published', true)
        .neq('availability', 'unavailable')
        .order('sort_order', { ascending: true });
      const { data, error } = response as { data: ProductRow[] | null; error: { message: string } | null };
      throwQueryError(error);

      return (data ?? [])
        .map(mapProduct)
        .filter((product): product is CatalogProduct => product !== null);
    },

    async getPublishedLineBySlug(slug: string): Promise<CatalogLine | null> {
      const { data, error } = await source
        .from('product_lines')
        .select('id, slug, name, description, cover_image, sort_order, published')
        .eq('slug', slug)
        .eq('published', true)
        .limit(1)
        .maybeSingle();
      throwQueryError(error);

      return data ? mapLine(data as ProductLineRow) : null;
    },

    async getPublishedProductBySlug(slug: string): Promise<CatalogProduct | null> {
      const { data, error } = await source
        .from('products')
        .select(productColumns)
        .eq('slug', slug)
        .eq('published', true)
        .eq('product_line.published', true)
        .neq('availability', 'unavailable')
        .limit(1)
        .maybeSingle();
      throwQueryError(error);

      return data ? mapProduct(data as ProductRow) : null;
    },
  };
}

export async function listPublishedLines(): Promise<CatalogLine[]> {
  return createCatalogRepository().listPublishedLines();
}

export async function listPublishedProducts(): Promise<CatalogProduct[]> {
  return createCatalogRepository().listPublishedProducts();
}

export async function getPublishedLineBySlug(slug: string): Promise<CatalogLine | null> {
  return createCatalogRepository().getPublishedLineBySlug(slug);
}

export async function getPublishedProductBySlug(slug: string): Promise<CatalogProduct | null> {
  return createCatalogRepository().getPublishedProductBySlug(slug);
}
