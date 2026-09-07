import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { INQUIRY_EMAIL_ADDRESS, WHATSAPP_CONTACT_URL, publicPageMetadata } from '@/lib/site';

export const metadata = publicPageMetadata('Contato', 'Fale com a Damazio Atelier por e-mail ou WhatsApp.', '/contato');

export default function ContatoPage() {
  return <main id="conteudo" tabIndex={-1}><section className="institutional-hero"><Container><p className="eyebrow">Vamos conversar</p><h1>Fale com a Damazio</h1><p>Conte sua ideia por e-mail ou pelo WhatsApp oficial. O atendimento acontece de forma humana, para entender cada criação com o cuidado que ela pede.</p><div className="contact-actions"><Button href={`mailto:${INQUIRY_EMAIL_ADDRESS}`}>Enviar e-mail para a Damazio</Button><Button href={WHATSAPP_CONTACT_URL} target="_blank" rel="noreferrer" variant="secondary">Abrir WhatsApp da Damazio</Button></div></Container></section></main>;
}
