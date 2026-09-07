import { WHATSAPP_CONTACT_URL } from '@/lib/site';

export function WhatsAppContactBubble() {
  return <nav aria-label="Contato pelo WhatsApp">
    <a className="whatsapp-contact-bubble" href={WHATSAPP_CONTACT_URL} target="_blank" rel="noreferrer" aria-label="Falar com a Damazio pelo WhatsApp">
      <svg aria-hidden="true" viewBox="0 0 32 32" focusable="false">
        <path d="M16 3.5a12.5 12.5 0 0 0-10.7 19l-1.7 6 6.2-1.6A12.5 12.5 0 1 0 16 3.5Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
        <path d="M12.1 10.1c.4-.8.8-.8 1.2-.8h.7c.2 0 .5.1.6.5l1.2 2.8c.1.3.1.5 0 .7l-.8 1c-.2.2-.2.4-.1.6.5 1 1.3 1.9 2.2 2.5.7.5 1.4.8 2.2 1.1.2.1.4 0 .6-.2l1-1.2c.2-.2.4-.2.7-.1l2.7 1.3c.3.1.4.3.4.6v.7c0 .5-.2.9-.7 1.2-.6.4-1.5.5-2.6.2-1.3-.4-2.7-1.1-4-2.1a15.5 15.5 0 0 1-3.5-4.1c-.6-1.1-1-2.1-.8-3.1.1-.7.3-1.1.5-1.4Z" fill="currentColor" />
      </svg>
    </a>
  </nav>;
}
