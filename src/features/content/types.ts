import type { CatalogLine, CatalogProduct } from '@/features/catalog/types';

export type HomeContent = {
  hero: { eyebrow: string; title: string; description: string };
  lines: CatalogLine[];
  products: CatalogProduct[];
};
