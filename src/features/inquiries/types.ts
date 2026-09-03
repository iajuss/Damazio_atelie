import type { CatalogProduct } from '@/features/catalog/types';

export type InquiryInput = {
  productSlug: string;
  name: string;
  contact: string;
  city: string;
  state: string;
  occasion?: string;
  description?: string;
  answers: Record<string, string>;
  privacyAccepted: boolean;
  attachments: File[];
};

export type ValidInquiryInput = Omit<InquiryInput, 'occasion' | 'description'> & {
  occasion: string | null;
  description: string | null;
};

export type InquiryResult = {
  requestCode: string;
  message: string;
};

export type InquiryValidation =
  | { success: true; data: ValidInquiryInput }
  | { success: false; errors: Record<string, string> };

export type InquirySubmissionErrorKind = 'validation' | 'payload_too_large' | 'provider';

export class InquirySubmissionError extends Error {
  constructor(
    public readonly kind: InquirySubmissionErrorKind,
    public readonly errors: Record<string, string> = {},
  ) {
    super('Não foi possível registrar a solicitação.');
  }
}

export type InquiryProduct = CatalogProduct;
