import type { Metadata } from 'next';
import type { CatalogLine, CatalogProduct } from './types';

export function catalogMetadata(): Metadata {
  return { title: 'Catálogo | Damazio Atelier', description: 'Conheça as linhas e inspirações criadas sob encomenda pela Damazio Atelier.' };
}

export function lineMetadata(line: CatalogLine): Metadata {
  return { title: `${line.name} | Damazio Atelier`, description: line.description ?? `Peças da linha ${line.name} da Damazio Atelier.` };
}

export function productMetadata(product: CatalogProduct): Metadata {
  return { title: `${product.name} | Damazio Atelier`, description: product.description ?? `Conheça ${product.name}, uma criação sob encomenda da Damazio Atelier.` };
}
