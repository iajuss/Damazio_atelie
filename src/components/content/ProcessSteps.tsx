import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';

const steps = [['01', 'Escolha uma inspiração', 'Explore as linhas e encontre uma peça que converse com a sua ocasião.'], ['02', 'Conte sua ideia', 'Compartilhe os detalhes que tornam a criação única para você.'], ['03', 'Alinhe os detalhes no Direct', 'A Damazio conversa com você sobre viabilidade, orçamento, prazo e envio.']];

export function ProcessSteps() {
  return <section className="content-section process-steps" aria-labelledby="titulo-como-funciona"><Container><p className="eyebrow">Personalização com calma</p><SectionHeading id="titulo-como-funciona">Como nasce sua peça</SectionHeading><ol className="process-steps__list">{steps.map(([number, title, description]) => <li key={number}><span>{number}</span><h3>{title}</h3><p>{description}</p></li>)}</ol></Container></section>;
}
