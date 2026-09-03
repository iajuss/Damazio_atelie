import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';

export function DetailStory() {
  return <section className="content-section detail-story" aria-labelledby="titulo-detalhes"><Container className="detail-story__grid"><div className="detail-story__visual" aria-hidden="true" /><div><p className="eyebrow">Cuidado em cada camada</p><SectionHeading id="titulo-detalhes">Detalhes que acolhem antes mesmo de abrir</SectionHeading><p>Do material escolhido à embalagem, cada acabamento recebe atenção para que a peça chegue como um presente: bonito, afetivo e pronto para guardar uma história.</p></div></Container></section>;
}
