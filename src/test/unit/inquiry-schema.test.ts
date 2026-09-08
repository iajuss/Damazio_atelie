import { describe, expect, it } from 'vitest';
import { validateInquiryInput } from '@/features/inquiries/schema';
import type { CatalogProduct } from '@/features/catalog/types';
import type { InquiryInput } from '@/features/inquiries/types';

const product: CatalogProduct = {
  id: 'product-1', lineSlug: 'enxovais', slug: 'toalha-bordada', name: 'Toalha bordada',
  description: null, materials: [], availability: 'available', media: [],
  customizationFields: [
    { key: 'nome_bordado', label: 'Nome', type: 'text', required: true, options: [], helpText: null, sortOrder: 1 },
    { key: 'cor', label: 'Cor', type: 'select', required: false, options: ['areia', 'rosé'], helpText: null, sortOrder: 2 },
  ],
};

function validInput(overrides: Record<string, unknown> = {}) {
  return {
    productSlug: 'toalha-bordada', name: '  Ana   Silva ', contact: ' ana@example.com ', email: 'ana@example.com', phone: '11910771179',
    postalCode: '01310100', street: 'Avenida Paulista', addressNumber: '1578', complement: '', neighborhood: 'Bela Vista', city: ' São Paulo ',
    state: 'sp', description: 'Uma peça especial', privacyAccepted: true, answers: { nome_bordado: '  Ana  ' }, attachments: [], ...overrides,
  };
}

describe('validação de solicitação', () => {
  it('aceita os dados mínimos e normaliza textos antes de persistir', () => {
    expect(validateInquiryInput(validInput(), product)).toEqual({
      success: true,
      data: expect.objectContaining({
        requestKind: 'product', productSlug: 'toalha-bordada', name: 'Ana Silva', contact: 'ana@example.com', city: 'São Paulo', state: 'SP',
        answers: { nome_bordado: 'Ana' }, privacyAccepted: true,
      }),
    });
  });

  it('normaliza telefone, e-mail e endereço completo', () => {
    expect(validateInquiryInput(validInput({
      email: ' ANA@EXAMPLE.COM ', phone: '(11) 91077-1179', postalCode: '01310-100',
      street: '  Avenida Paulista ', addressNumber: ' 1578 ', complement: ' ap. 12 ',
      neighborhood: ' Bela Vista ', city: ' São Paulo ', state: 'sp',
    }), product)).toMatchObject({
      success: true,
      data: {
        email: 'ana@example.com', phone: '11910771179', postalCode: '01310100',
        street: 'Avenida Paulista', addressNumber: '1578', complement: 'ap. 12',
        neighborhood: 'Bela Vista', city: 'São Paulo', state: 'SP',
      },
    });
  });

  it('aceita complemento omitido e o persiste como texto normalizado vazio', () => {
    const { complement: _complement, ...inputWithoutComplement }: InquiryInput = validInput();

    expect(validateInquiryInput(inputWithoutComplement, product)).toMatchObject({
      success: true,
      data: { complement: '' },
    });
  });

  it.each(['email', 'phone', 'postalCode', 'street', 'addressNumber', 'neighborhood'])(
    'rejeita %s ausente ou inválido',
    (field) => expect(validateInquiryInput(validInput({ [field]: '' }), product)).toMatchObject({ success: false }),
  );

  it('aceita uma criação livre com ideia e sem inspiração selecionada', () => {
    expect(validateInquiryInput(validInput({ requestKind: 'custom', productSlug: '', description: 'Uma bolsa com flores bordadas', answers: {} }), null)).toEqual({
      success: true,
      data: expect.objectContaining({ requestKind: 'custom', productSlug: null, description: 'Uma bolsa com flores bordadas' }),
    });
  });

  it('exige ideia e rejeita respostas de produto na criação livre', () => {
    expect(validateInquiryInput(validInput({ requestKind: 'custom', productSlug: '', description: '', answers: {} }), null)).toMatchObject({
      success: false, errors: { description: 'Conte a sua ideia para continuar.' },
    });
    expect(validateInquiryInput(validInput({ requestKind: 'custom', productSlug: '', description: 'Uma criação especial', answers: { nome_bordado: 'Ana' } }), null)).toMatchObject({
      success: false, errors: { answers: expect.any(String) },
    });
  });

  it('exige a descrição também para uma solicitação de peça', () => {
    expect(validateInquiryInput(validInput({ description: '' }), product)).toMatchObject({
      success: false, errors: { description: 'Conte a sua ideia para continuar.' },
    });
  });

  it.each([
    ['name', { name: '' }], ['contact', { contact: '' }], ['city', { city: '' }],
    ['state', { state: '' }], ['privacyAccepted', { privacyAccepted: false }],
  ])('rejeita %s ausente', (field, overrides) => {
    const result = validateInquiryInput(validInput(overrides), product);
    expect(result).toMatchObject({ success: false, errors: { [field]: expect.any(String) } });
  });

  it('rejeita produto desconhecido ou indisponível', () => {
    expect(validateInquiryInput(validInput(), null)).toMatchObject({ success: false, errors: { productSlug: expect.any(String) } });
    expect(validateInquiryInput(validInput(), { ...product, availability: 'unavailable' })).toMatchObject({ success: false, errors: { productSlug: expect.any(String) } });
  });

  it('rejeita respostas de personalização que não pertencem ao produto e opções inválidas', () => {
    expect(validateInquiryInput(validInput({ answers: { nome_bordado: 'Ana', tamanho: 'M' } }), product)).toMatchObject({
      success: false, errors: { answers: expect.any(String) },
    });
    expect(validateInquiryInput(validInput({ answers: { nome_bordado: 'Ana', cor: 'azul' } }), product)).toMatchObject({
      success: false, errors: { 'answers.cor': expect.any(String) },
    });
  });
});
