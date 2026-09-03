import { InquirySubmissionError } from './types';

export const INQUIRY_REFERENCES_BUCKET = 'inquiry-references';
export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
export const MAX_ATTACHMENTS = 3;

export type InspectedAttachment = {
  file: File;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  byteSize: number;
};

function detectedMimeType(bytes: Uint8Array): InspectedAttachment['mimeType'] | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length >= 8 && bytes.slice(0, 8).every((byte, index) => byte === [137, 80, 78, 71, 13, 10, 26, 10][index])) return 'image/png';
  if (bytes.length >= 12 && new TextDecoder().decode(bytes.slice(0, 4)) === 'RIFF' && new TextDecoder().decode(bytes.slice(8, 12)) === 'WEBP') return 'image/webp';
  return null;
}

export async function inspectAttachments(files: File[]): Promise<InspectedAttachment[]> {
  if (files.length > MAX_ATTACHMENTS) {
    throw new InquirySubmissionError('payload_too_large', { attachments: 'Envie no máximo três referências.' });
  }

  return Promise.all(files.map(async (file) => {
    if (file.size === 0) throw new InquirySubmissionError('validation', { attachments: 'A referência enviada está vazia.' });
    if (file.size > MAX_ATTACHMENT_BYTES) throw new InquirySubmissionError('payload_too_large', { attachments: 'Cada referência pode ter até 5 MB.' });
    const mimeType = detectedMimeType(new Uint8Array(await file.arrayBuffer()));
    if (!mimeType || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.type !== mimeType) {
      throw new InquirySubmissionError('validation', { attachments: 'Envie referências em JPEG, PNG ou WebP.' });
    }
    return { file, mimeType, byteSize: file.size };
  }));
}
