import type { Metadata } from 'next';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';

export const metadata: Metadata = { title: 'Envio nacional | Damazio Atelier', description: 'A Damazio Atelier envia criações para todo o Brasil.' };

export default function EnvioNacionalPage() {
  return <main id="conteudo"><section className="institutional-hero"><Container><p className="eyebrow">Para chegar até você</p><h1>Envio para todo o Brasil</h1><p>As criações da Damazio Atelier podem seguir para todo o Brasil. Como cada peça é feita sob encomenda, frete e prazo são confirmados caso a caso no Direct, depois de entendermos a sua ideia e o destino.</p><Button href="https://www.instagram.com/damazio.atelier/" target="_blank" rel="noreferrer">Continuar no Direct</Button></Container></section></main>;
}
