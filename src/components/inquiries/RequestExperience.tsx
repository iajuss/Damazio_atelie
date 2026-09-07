import type { CatalogProduct } from '@/features/catalog/types';
import type { InquiryKind } from '@/features/inquiries/types';
import { InquiryForm } from './InquiryForm';
import { Container } from '@/components/ui/Container';

type RequestExperienceProps = { requestKind: InquiryKind; product?: CatalogProduct };

export function RequestExperience({ requestKind, product }: RequestExperienceProps) {
  const isCustom = requestKind === 'custom';
  return <main id="conteudo" className="request-page-editorial" tabIndex={-1}><Container className="request-page"><section className="request-page__intro"><p className="eyebrow">{isCustom ? 'Criação livre' : product?.name}</p><h1>{isCustom ? 'Crie a sua peça' : 'Solicite sua peça'}</h1><p>{isCustom ? 'Conte a ideia que você quer transformar em uma criação da Damazio.' : 'Conte sua ideia com calma. A Damazio entra em contato pelo Direct para alinhar os próximos detalhes.'}</p></section><section className="request-page__surface"><InquiryForm product={product} requestKind={requestKind} /></section></Container></main>;
}
