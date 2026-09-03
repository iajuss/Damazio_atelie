import { ProcessSteps } from '@/components/content/ProcessSteps';
import { Container } from '@/components/ui/Container';
import { publicPageMetadata } from '@/lib/site';

export const metadata = publicPageMetadata('Como funciona', 'Entenda como personalizar uma criação da Damazio Atelier.', '/como-funciona');

export default function ComoFuncionaPage() {
  return <main id="conteudo" tabIndex={-1}><section className="institutional-hero"><Container><p className="eyebrow">Seu pedido, do seu jeito</p><h1>Personalização feita em conversa</h1><p>Você escolhe uma inspiração, conta o que imagina e alinha os detalhes diretamente com a Damazio no Instagram Direct.</p></Container></section><ProcessSteps /></main>;
}
