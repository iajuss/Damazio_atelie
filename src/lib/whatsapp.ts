import { WHATSAPP_CONTACT_URL } from './site';

/** Returns the single public WhatsApp destination for customer service handoffs. */
export function buildWhatsAppContactUrl(): string {
  return WHATSAPP_CONTACT_URL;
}
