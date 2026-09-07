import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { WHATSAPP_CONTACT_URL, publicPageMetadata } from '@/lib/site';

export const metadata = publicPageMetadata('Envio nacional', 'A Damazio Atelier envia criações para todo o Brasil.', '/envio-nacional');

export default function EnvioNacionalPage() {
  return <main id="conteudo" tabIndex={-1}><section className="institutional-hero"><Container><p className="eyebrow">Para chegar até você</p><h1>Envio para todo o Brasil</h1><p>As criações da Damazio Atelier podem seguir para todo o Brasil. Como cada peça é feita sob encomenda, frete e prazo são confirmados caso a caso pelo WhatsApp, depois de entendermos a sua ideia e o destino.</p><Button href={WHATSAPP_CONTACT_URL} target="_blank" rel="noreferrer">Continuar no WhatsApp</Button></Container></section></main>;
}
