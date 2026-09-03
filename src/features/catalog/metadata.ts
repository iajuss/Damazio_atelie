import type { Metadata } from 'next';
import type { CatalogLine, CatalogProduct } from './types';
import { publicPageMetadata } from '@/lib/site';

export function catalogMetadata(): Metadata {
  return publicPageMetadata('Catálogo', 'Conheça as linhas e inspirações criadas sob encomenda pela Damazio Atelier.', '/catalogo');
}

export function lineMetadata(line: CatalogLine): Metadata {
  return publicPageMetadata(line.name, line.description ?? `Peças da linha ${line.name} da Damazio Atelier.`, `/catalogo/${line.slug}`);
}

export function productMetadata(product: CatalogProduct): Metadata {
  return publicPageMetadata(product.name, product.description ?? `Conheça ${product.name}, uma criação sob encomenda da Damazio Atelier.`, `/produtos/${product.slug}`);
}
