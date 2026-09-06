import 'server-only';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { CatalogProduct } from '@/features/catalog/types';
import { createPrivateAttachmentPath, createRequestCode } from './request-code';
import { INQUIRY_REFERENCES_BUCKET, inspectAttachments } from './storage';
import { validateInquiryInput } from './schema';
import { InquirySubmissionError, type InquiryInput, type InquiryResult } from './types';

type StorageBucket = {
  upload: (path: string, file: File, options: { contentType: string; upsert: false }) => Promise<{ error: unknown | null }>;
  remove: (paths: string[]) => Promise<{ error: unknown | null }>;
};

export type InquiryServerClient = {
  rpc: (name: 'create_inquiry_with_answers', payload: Record<string, unknown>) => Promise<{ data: { inquiry_id: string } | null; error: unknown | null }>;
  storage: { from: (bucket: typeof INQUIRY_REFERENCES_BUCKET) => StorageBucket };
};

export type InquiryServiceDependencies = {
  client?: InquiryServerClient;
  createRequestCode?: () => string;
};

export async function createInquiry(input: InquiryInput, product: CatalogProduct | null, dependencies: InquiryServiceDependencies = {}): Promise<InquiryResult> {
  const validation = validateInquiryInput(input, product);
  if (!validation.success) throw new InquirySubmissionError('validation', validation.errors);
  if (validation.data.requestKind === 'product' && !product) throw new InquirySubmissionError('validation');

  const attachments = await inspectAttachments(validation.data.attachments);
  const requestCode = (dependencies.createRequestCode ?? createRequestCode)();
  const client = dependencies.client ?? (createServerSupabaseClient() as unknown as InquiryServerClient);
  const bucket = client.storage.from(INQUIRY_REFERENCES_BUCKET);
  const uploadedPaths: string[] = [];
  const attachmentRows: Array<{ storage_path: string; original_filename: string; mime_type: string; byte_size: number }> = [];

  try {
    for (const attachment of attachments) {
      const storagePath = createPrivateAttachmentPath(requestCode, attachment.file.name);
      const upload = await bucket.upload(storagePath, attachment.file, { contentType: attachment.mimeType, upsert: false });
      if (upload.error) throw new Error('Falha ao guardar referência privada.');
      uploadedPaths.push(storagePath);
      attachmentRows.push({ storage_path: storagePath, original_filename: attachment.file.name, mime_type: attachment.mimeType, byte_size: attachment.byteSize });
    }

    const persisted = await client.rpc('create_inquiry_with_answers', {
      p_request_code: requestCode, p_product_id: product?.id ?? null, p_request_kind: validation.data.requestKind, p_name: validation.data.name, p_contact: validation.data.contact,
      p_city: validation.data.city, p_state: validation.data.state, p_occasion: validation.data.occasion,
      p_description: validation.data.description, p_privacy_accepted_at: new Date().toISOString(), p_answers: validation.data.answers,
      p_attachments: attachmentRows,
    });
    if (persisted.error || !persisted.data?.inquiry_id) throw new Error('Falha ao registrar solicitação.');
  } catch {
    if (uploadedPaths.length > 0) await bucket.remove(uploadedPaths);
    throw new InquirySubmissionError('provider');
  }

  return { requestCode, message: 'Solicitação registrada com sucesso.' };
}
