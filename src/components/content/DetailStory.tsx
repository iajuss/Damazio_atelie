import Image from 'next/image';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';

export function DetailStory() {
  return <section className="content-section detail-story" aria-labelledby="titulo-detalhes"><Container className="detail-story__grid"><Image className="detail-story__image" src="/images/catalogo/detalhe-embalagem.jpeg" alt="Embalagem de presente da Damazio Atelier" width={1080} height={1440} sizes="(min-width: 48rem) 50vw, 100vw" unoptimized /><div><p className="eyebrow">Cuidado em cada camada</p><SectionHeading id="titulo-detalhes">Detalhes que acolhem antes mesmo de abrir</SectionHeading><p>Do material escolhido à embalagem, cada acabamento recebe atenção para que a peça chegue como um presente: bonito, afetivo e pronto para guardar uma história.</p></div></Container></section>;
}
