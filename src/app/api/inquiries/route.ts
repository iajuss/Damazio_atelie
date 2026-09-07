import type { CatalogProduct } from '@/features/catalog/types';
import { normalizeProductSlug, validateInquiryInput } from '@/features/inquiries/schema';
import type { InquiryInput, InquiryKind, InquiryResult } from '@/features/inquiries/types';
import { allowInquiryRequest } from '@/lib/rate-limit';
import { configuredInquiryOrigins, isTrustedOrigin, requestClientKey, trustProxyHeaders } from '@/lib/security';

type DeliverNotifications = (options: { requestCode?: string; limit?: number }) => Promise<void>;

type InquiryHandlerDependencies = {
  expectedOrigin?: string;
  allowedOrigins?: readonly string[];
  loadProduct?: (slug: string) => Promise<CatalogProduct | null>;
  rateLimit?: (key: string) => boolean;
  createInquiry?: (input: InquiryInput, product: CatalogProduct | null) => Promise<InquiryResult>;
  deliverNotifications?: DeliverNotifications;
};

const MAX_ANSWERS_JSON_LENGTH = 16_384;
const MAX_ANSWER_FIELDS = 20;
const MAX_ANSWER_KEY_LENGTH = 64;
const MAX_ANSWER_VALUE_LENGTH = 4_000;

const privateResponseHeaders = { 'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow, noarchive' };

function errorResponse(status: 400 | 404 | 413 | 429 | 500, code: string, message: string, fields?: Record<string, string>): Response {
  return Response.json({ error: { code, message, ...(fields ? { fields } : {}) } }, { status, headers: privateResponseHeaders });
}

function asText(data: FormData, key: string): string {
  const value = data.get(key);
  return typeof value === 'string' ? value : '';
}

function parseInput(data: FormData): InquiryInput | null {
  let answers: Record<string, string> = {};
  const rawAnswers = asText(data, 'answers');
  if (rawAnswers) {
    if (rawAnswers.length > MAX_ANSWERS_JSON_LENGTH) return null;
    try {
      const parsed: unknown = JSON.parse(rawAnswers);
      if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') return null;
      const entries = Object.entries(parsed);
      if (entries.length > MAX_ANSWER_FIELDS || entries.some(([key, value]) => key.length > MAX_ANSWER_KEY_LENGTH || typeof value !== 'string' || value.length > MAX_ANSWER_VALUE_LENGTH)) return null;
      answers = parsed as Record<string, string>;
    } catch { return null; }
  }
  const requestKind = asText(data, 'requestKind') || 'product';
  if (requestKind !== 'product' && requestKind !== 'custom') return null;
  return {
    requestKind: requestKind as InquiryKind,
    productSlug: normalizeProductSlug(asText(data, 'productSlug')), name: asText(data, 'name'), contact: asText(data, 'contact'), city: asText(data, 'city'),
    state: asText(data, 'state'), occasion: asText(data, 'occasion'), description: asText(data, 'description'), answers,
    privacyAccepted: asText(data, 'privacyAccepted') === 'true', attachments: data.getAll('attachments').filter((value): value is File => typeof value !== 'string'),
  };
}

function internalFailureDetails(error: unknown): { name: string; message: string } {
  if (error instanceof Error) return { name: error.name, message: error.message.slice(0, 200) };
  return { name: 'UnknownError', message: 'Unknown inquiry submission failure.' };
}

export function createInquiryPostHandler(dependencies: InquiryHandlerDependencies = {}) {
  return async function post(request: Request): Promise<Response> {
    const allowedOrigins = dependencies.allowedOrigins ?? (dependencies.expectedOrigin ? [dependencies.expectedOrigin] : configuredInquiryOrigins());
    if (!isTrustedOrigin(request, allowedOrigins)) return errorResponse(400, 'VALIDACAO', 'Não foi possível validar o envio.');
    if (!(dependencies.rateLimit ?? allowInquiryRequest)(requestClientKey(request, trustProxyHeaders()))) return errorResponse(429, 'LIMITE_DE_ENVIO', 'Aguarde um instante antes de tentar novamente.');

    let stage: 'read_form' | 'load_product' | 'persist_inquiry' = 'read_form';

    try {
      const data = await request.formData();
      if (asText(data, 'website')) return errorResponse(400, 'VALIDACAO', 'Não foi possível validar o envio.');
      const input = parseInput(data);
      if (!input) return errorResponse(400, 'VALIDACAO', 'Confira os dados informados.');
      stage = 'load_product';
      const loadProduct = dependencies.loadProduct ?? (await import('@/features/catalog/repository')).getPublishedProductBySlug;
      const product = input.requestKind === 'product' ? await loadProduct(input.productSlug) : null;
      const validation = validateInquiryInput(input, product);
      if (!validation.success) return errorResponse(400, 'VALIDACAO', 'Confira os campos informados.', validation.errors);
      stage = 'persist_inquiry';
      const saveInquiry = dependencies.createInquiry ?? (await import('@/features/inquiries/service')).createInquiry;
      const result = await saveInquiry(input, product);
      const deliverNotifications = dependencies.deliverNotifications ?? (await import('@/features/inquiries/lead-notifications')).deliverLeadNotifications;
      try {
        await deliverNotifications({ requestCode: result.requestCode, limit: 1 });
      } catch {
        // O lead já foi persistido de forma atômica e será recuperado pelo cron protegido.
      }
      return Response.json(result, { status: 201, headers: privateResponseHeaders });
    } catch (error) {
      if (typeof error === 'object' && error && 'kind' in error) {
        const submission = error as { kind: string; errors?: Record<string, string> };
        if (submission.kind === 'validation') return errorResponse(400, 'VALIDACAO', 'Confira os campos informados.', submission.errors);
        if (submission.kind === 'payload_too_large') return errorResponse(413, 'ARQUIVO_MUITO_GRANDE', 'A referência excede o limite permitido.', submission.errors);
      }
      console.error('inquiry_submission_failed', { stage, ...internalFailureDetails(error) });
      return errorResponse(500, 'ERRO_INTERNO', 'Não foi possível enviar a solicitação. Tente novamente em instantes.');
    }
  };
}

export const POST = createInquiryPostHandler();

export async function GET(): Promise<Response> {
  return errorResponse(404, 'NAO_ENCONTRADO', 'Referências de clientes são privadas.');
}
