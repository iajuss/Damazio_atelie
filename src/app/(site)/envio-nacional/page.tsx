import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { INSTAGRAM_PROFILE_URL, publicPageMetadata } from '@/lib/site';

export const metadata = publicPageMetadata('Envio nacional', 'A Damazio Atelier envia criações para todo o Brasil.', '/envio-nacional');

export default function EnvioNacionalPage() {
  return <main id="conteudo" tabIndex={-1}><section className="institutional-hero"><Container><p className="eyebrow">Para chegar até você</p><h1>Envio para todo o Brasil</h1><p>As criações da Damazio Atelier podem seguir para todo o Brasil. Como cada peça é feita sob encomenda, frete e prazo são confirmados caso a caso no Direct, depois de entendermos a sua ideia e o destino.</p><Button href={INSTAGRAM_PROFILE_URL} target="_blank" rel="noreferrer">Continuar no Direct</Button></Container></section></main>;
}
