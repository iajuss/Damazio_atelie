import { INQUIRY_EMAIL_ADDRESS, SITE_NAME } from './site';

export function buildInquiryEmailUrl(requestCode: string): string {
  const parameters = new URLSearchParams({ subject: `Solicitação ${requestCode} | ${SITE_NAME}`, body: `Olá, gostaria de continuar sobre a solicitação ${requestCode}.` });
  return `mailto:${INQUIRY_EMAIL_ADDRESS}?${parameters.toString()}`;
}
