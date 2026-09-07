import { Container } from '@/components/ui/Container';
import { publicPageMetadata } from '@/lib/site';

export const metadata = publicPageMetadata('Perguntas frequentes', 'Dúvidas frequentes sobre as criações da Damazio Atelier.', '/perguntas-frequentes');

const questions = [['As peças são feitas sob encomenda?', 'Sim. Cada criação é preparada com atenção aos detalhes que você deseja personalizar.'], ['Como começo uma solicitação?', 'Escolha uma inspiração no catálogo e conte a sua ideia. Depois, seguimos a conversa pelo WhatsApp.'], ['Vocês enviam para minha cidade?', 'Enviamos para todo o Brasil. Frete e prazo são avaliados caso a caso de acordo com a peça e o destino.']];

export default function PerguntasFrequentesPage() {
  return <main id="conteudo" tabIndex={-1}><section className="institutional-hero"><Container><p className="eyebrow">Dúvidas comuns</p><h1>Perguntas frequentes</h1><div className="faq-list">{questions.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div></Container></section></main>;
}
