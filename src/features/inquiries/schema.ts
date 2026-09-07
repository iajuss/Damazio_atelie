import type { CatalogProduct } from '@/features/catalog/types';
import type { InquiryInput, InquiryKind, InquiryValidation, ValidInquiryInput } from './types';

const limits = { name: 160, contact: 200, city: 120, occasion: 160, description: 4000, answer: 4000 } as const;
const answerKeyPattern = /^[a-z][a-z0-9_]{0,63}$/;
const maxAnswerFields = 20;

function normalize(value: unknown): string {
  return typeof value === 'string' ? value.normalize('NFKC').replace(/\s+/g, ' ').trim() : '';
}

export function normalizeProductSlug(value: unknown): string {
  return normalize(value).toLowerCase();
}

function validateRequired(errors: Record<string, string>, key: keyof typeof limits | 'state', value: string): void {
  if (!value) {
    errors[key] = 'Este campo é obrigatório.';
    return;
  }

  if (key !== 'state' && value.length > limits[key]) {
    errors[key] = 'O texto informado é maior do que o permitido.';
  }
}

export function validateInquiryInput(input: InquiryInput, product: CatalogProduct | null): InquiryValidation {
  const errors: Record<string, string> = {};
  const name = normalize(input.name);
  const contact = normalize(input.contact);
  const city = normalize(input.city);
  const state = normalize(input.state).toUpperCase();
  const occasion = normalize(input.occasion);
  const description = normalize(input.description);
  const answerEntries = Object.entries(input.answers ?? {});
  const answers = Object.fromEntries(answerEntries.map(([key, value]) => [key, normalize(value)]));
  const requestKind: InquiryKind = input.requestKind ?? 'product';

  validateRequired(errors, 'name', name);
  validateRequired(errors, 'contact', contact);
  validateRequired(errors, 'city', city);
  if (!/^[A-Z]{2}$/.test(state)) errors.state = 'Informe a sigla do estado com duas letras.';
  if (!input.privacyAccepted) errors.privacyAccepted = 'É necessário aceitar a política de privacidade para enviar a solicitação.';
  if (occasion.length > limits.occasion) errors.occasion = 'O texto informado é maior do que o permitido.';
  if (description.length > limits.description) errors.description = 'O texto informado é maior do que o permitido.';

  if (answerEntries.length > maxAnswerFields || answerEntries.some(([key, value]) => !answerKeyPattern.test(key) || normalize(value).length > limits.answer)) {
    errors.answers = 'Confira os campos de personalização informados.';
  }

  const normalizedProductSlug = normalizeProductSlug(input.productSlug);
  if (requestKind === 'custom') {
    if (!description) errors.description = 'Conte a sua ideia para continuar.';
    if (normalizedProductSlug) errors.productSlug = 'Confira a criação informada.';
    if (answerEntries.length > 0) errors.answers = 'Confira os campos de personalização informados.';
  } else if (!product || product.slug !== normalizedProductSlug) {
    errors.productSlug = 'A peça selecionada não foi encontrada.';
  } else if (product.availability === 'unavailable') {
    errors.productSlug = 'Esta peça não está disponível para solicitação no momento.';
  } else {
    const fields = new Map(product.customizationFields.map((field) => [field.key, field]));
    for (const [key, answer] of Object.entries(answers)) {
      const field = fields.get(key);
      if (!field) {
        errors.answers = 'Confira os campos de personalização informados.';
      } else if (!answer && field.required) {
        errors[`answers.${key}`] = 'Este campo é obrigatório.';
      } else if (answer.length > limits.answer) {
        errors[`answers.${key}`] = 'O texto informado é maior do que o permitido.';
      } else if (field.type === 'select' && answer && !field.options.includes(answer)) {
        errors[`answers.${key}`] = 'Escolha uma opção disponível para esta peça.';
      }
    }
    for (const field of product.customizationFields) {
      if (field.required && !answers[field.key]) errors[`answers.${field.key}`] = 'Este campo é obrigatório.';
    }
  }

  if (Object.keys(errors).length > 0) return { success: false, errors };

  const data: ValidInquiryInput = {
    requestKind, productSlug: requestKind === 'custom' ? null : normalizedProductSlug, name, contact, city, state, occasion: occasion || null,
    description: description || null, answers, privacyAccepted: true, attachments: input.attachments,
  };
  return { success: true, data };
}
