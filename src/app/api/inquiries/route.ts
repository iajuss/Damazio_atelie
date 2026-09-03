import type { CatalogProduct } from '@/features/catalog/types';
import { validateInquiryInput } from '@/features/inquiries/schema';
import type { InquiryInput, InquiryResult } from '@/features/inquiries/types';
import { allowInquiryRequest } from '@/lib/rate-limit';
import { isTrustedOrigin, requestClientKey } from '@/lib/security';

type InquiryHandlerDependencies = {
  expectedOrigin?: string;
  loadProduct?: (slug: string) => Promise<CatalogProduct | null>;
  rateLimit?: (key: string) => boolean;
  createInquiry?: (input: InquiryInput, product: CatalogProduct | null) => Promise<InquiryResult>;
};

function errorResponse(status: 400 | 404 | 413 | 429 | 500, code: string, message: string, fields?: Record<string, string>): Response {
  return Response.json({ error: { code, message, ...(fields ? { fields } : {}) } }, { status, headers: { 'cache-control': 'no-store' } });
}

function asText(data: FormData, key: string): string {
  const value = data.get(key);
  return typeof value === 'string' ? value : '';
}

function parseInput(data: FormData): InquiryInput | null {
  let answers: Record<string, string> = {};
  const rawAnswers = asText(data, 'answers');
  if (rawAnswers) {
    try {
      const parsed: unknown = JSON.parse(rawAnswers);
      if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object' || Object.values(parsed).some((value) => typeof value !== 'string')) return null;
      answers = parsed as Record<string, string>;
    } catch { return null; }
  }
  return {
    productSlug: asText(data, 'productSlug'), name: asText(data, 'name'), contact: asText(data, 'contact'), city: asText(data, 'city'),
    state: asText(data, 'state'), occasion: asText(data, 'occasion'), description: asText(data, 'description'), answers,
    privacyAccepted: asText(data, 'privacyAccepted') === 'true', attachments: data.getAll('attachments').filter((value): value is File => typeof value !== 'string'),
  };
}

export function createInquiryPostHandler(dependencies: InquiryHandlerDependencies = {}) {
  return async function post(request: Request): Promise<Response> {
    const expectedOrigin = dependencies.expectedOrigin ?? process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
    if (!isTrustedOrigin(request, expectedOrigin)) return errorResponse(400, 'VALIDACAO', 'Não foi possível validar o envio.');
    if (!(dependencies.rateLimit ?? allowInquiryRequest)(requestClientKey(request))) return errorResponse(429, 'LIMITE_DE_ENVIO', 'Aguarde um instante antes de tentar novamente.');

    try {
      const data = await request.formData();
      if (asText(data, 'website')) return errorResponse(400, 'VALIDACAO', 'Não foi possível validar o envio.');
      const input = parseInput(data);
      if (!input) return errorResponse(400, 'VALIDACAO', 'Confira os dados informados.');
      const loadProduct = dependencies.loadProduct ?? (await import('@/features/catalog/repository')).getPublishedProductBySlug;
      const product = await loadProduct(input.productSlug);
      const validation = validateInquiryInput(input, product);
      if (!validation.success) return errorResponse(400, 'VALIDACAO', 'Confira os campos informados.', validation.errors);
      const saveInquiry = dependencies.createInquiry ?? (await import('@/features/inquiries/service')).createInquiry;
      const result = await saveInquiry(input, product);
      return Response.json(result, { status: 201, headers: { 'cache-control': 'no-store' } });
    } catch (error) {
      if (typeof error === 'object' && error && 'kind' in error) {
        const submission = error as { kind: string; errors?: Record<string, string> };
        if (submission.kind === 'validation') return errorResponse(400, 'VALIDACAO', 'Confira os campos informados.', submission.errors);
        if (submission.kind === 'payload_too_large') return errorResponse(413, 'ARQUIVO_MUITO_GRANDE', 'A referência excede o limite permitido.', submission.errors);
      }
      return errorResponse(500, 'ERRO_INTERNO', 'Não foi possível enviar a solicitação. Tente novamente em instantes.');
    }
  };
}

export const POST = createInquiryPostHandler();

export async function GET(): Promise<Response> {
  return errorResponse(404, 'NAO_ENCONTRADO', 'Referências de clientes são privadas.');
}
