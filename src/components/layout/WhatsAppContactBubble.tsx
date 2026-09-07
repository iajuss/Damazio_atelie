import { WHATSAPP_CONTACT_URL } from '@/lib/site';

export function WhatsAppContactBubble() {
  return <nav aria-label="Contato pelo WhatsApp">
    <a className="whatsapp-contact-bubble" href={WHATSAPP_CONTACT_URL} target="_blank" rel="noreferrer" aria-label="Falar com a Damazio pelo WhatsApp">
      <svg aria-hidden="true" viewBox="0 0 32 32" focusable="false">
        <path d="M16 3.5a12.5 12.5 0 0 0-10.7 19l-1.7 6 6.2-1.6A12.5 12.5 0 1 0 16 3.5Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
      </svg>
    </a>
  </nav>;
}
