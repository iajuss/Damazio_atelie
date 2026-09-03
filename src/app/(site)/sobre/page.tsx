import { Container } from '@/components/ui/Container';
import { publicPageMetadata } from '@/lib/site';

export const metadata = publicPageMetadata('Sobre', 'Conheça o olhar artesanal da Damazio Atelier.', '/sobre');

export default function SobrePage() {
  return <main id="conteudo" tabIndex={-1}><section className="institutional-hero"><Container><p className="eyebrow">Sobre a Damazio</p><h1>Feito à mão para guardar afeto</h1><p>A Damazio Atelier transforma memórias, celebrações e gestos de carinho em bordados, crochês e presentes autorais. Cada criação nasce de uma conversa atenta e ganha forma com cuidado nos materiais, no acabamento e na apresentação.</p><p>O nosso tempo é o do fazer artesanal: uma peça de cada vez, pensada para que a sua história apareça nos detalhes.</p></Container></section></main>;
}
