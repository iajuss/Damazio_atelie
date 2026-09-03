import { randomBytes, randomUUID } from 'node:crypto';

export function createRequestCode(): string {
  return randomBytes(10).toString('hex').toUpperCase();
}

export function createPrivateAttachmentPath(requestCode: string, originalFile: string): string {
  const extension = originalFile.toLowerCase().match(/\.(jpe?g|png|webp)$/)?.[1]?.replace('jpeg', 'jpg') ?? 'bin';
  return `${requestCode}/${randomUUID()}.${extension}`;
}
