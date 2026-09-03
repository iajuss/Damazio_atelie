import { describe, expect, it } from 'vitest';
import { assertSeedWriteAllowed, validateCatalogSeed } from '../../../scripts/seed-catalog';

const lineSlugs = [
  'bordados-em-roupas',
  'enxovais-e-toalhas',
  'bolsas-de-croche',
  'presentes-e-embalagens',
] as const;

function approvedCatalog() {
  return {
    approvedForLaunch: true,
    lines: lineSlugs.map((slug, index) => ({
      slug,
      name: `Linha ${index + 1}`,
      description: `Descrição aprovada da linha ${index + 1}`,
      coverImage: `https://cdn.example.invalid/${slug}.webp`,
      mediaApprovedForLaunch: true,
      sortOrder: index + 1,
      published: true,
    })),
    products: lineSlugs.map((lineSlug, index) => ({
      lineSlug,
      slug: `produto-${index + 1}`,
      name: `Produto ${index + 1}`,
      description: `Descrição aprovada do produto ${index + 1}`,
      materials: ['Material aprovado'],
      availability: 'available',
      sortOrder: index + 1,
      published: true,
      media: [{
        url: `https://cdn.example.invalid/produto-${index + 1}.webp`,
        altText: `Produto artesanal ${index + 1}`,
        caption: null,
        sortOrder: 1,
        isFeatured: true,
        mediaApprovedForLaunch: true,
      }],
      customizationFields: [{
        key: 'detalhes',
        label: 'Detalhes desejados',
        type: 'textarea',
        required: false,
        options: [],
        helpText: 'Descreva a personalização desejada.',
        sortOrder: 1,
      }],
    })),
  };
}

describe('seed controlado do catálogo', () => {
  it('aceita somente um catálogo completo e explicitamente aprovado', () => {
    const result = validateCatalogSeed(approvedCatalog());

    expect(result.lines).toHaveLength(4);
    expect(result.products).toHaveLength(4);
  });

  it('recusa mídia temporária, relativa ou sem aprovação de lançamento', () => {
    const input = approvedCatalog();
    input.products[0].media[0].url = '/images/catalogo/camisa-bordada.jpeg';
    input.products[0].media[0].mediaApprovedForLaunch = false;

    expect(() => validateCatalogSeed(input)).toThrow(/mídia web aprovada/i);
  });

  it('recusa catálogo sem exemplar completo para cada uma das quatro linhas', () => {
    const input = approvedCatalog();
    input.products.pop();

    expect(() => validateCatalogSeed(input)).toThrow(/exemplar publicado/i);
  });

  it('recusa produto associado a uma linha inexistente antes de qualquer escrita', () => {
    const input = approvedCatalog();
    input.products.push({ ...input.products[0], slug: 'produto-sem-linha', lineSlug: 'linha-inexistente' as never });

    expect(() => validateCatalogSeed(input)).toThrow(/linha existente/i);
  });

  it('mantém a escrita bloqueada sem todas as confirmações do staging', () => {
    const base = {
      apply: true,
      target: 'staging',
      targetUrl: 'https://project.supabase.co',
      stagingUrl: 'https://project.supabase.co',
      confirmationUrl: 'https://project.supabase.co',
      allowWrite: true,
      allowRemoteStaging: true,
    } as const;

    expect(() => assertSeedWriteAllowed({ ...base, allowWrite: false })).toThrow(/CATALOG_SEED_ALLOW_WRITE/i);
    expect(() => assertSeedWriteAllowed({ ...base, confirmationUrl: 'https://outro.supabase.co' })).toThrow(/não corresponde/i);
    expect(() => assertSeedWriteAllowed({ ...base, targetUrl: 'https://producao.supabase.co', confirmationUrl: 'https://producao.supabase.co' })).toThrow(/allowlist/i);
    expect(() => assertSeedWriteAllowed({ ...base, target: 'production' })).toThrow(/produção/i);
    expect(assertSeedWriteAllowed(base)).toEqual({ mode: 'apply', targetUrl: 'https://project.supabase.co' });
  });

  it('permite validação dry-run sem credenciais ou acesso remoto', () => {
    expect(assertSeedWriteAllowed({
      apply: false,
      target: undefined,
      targetUrl: undefined,
      stagingUrl: undefined,
      confirmationUrl: undefined,
      allowWrite: false,
      allowRemoteStaging: false,
    })).toEqual({ mode: 'dry-run' });
  });
});
