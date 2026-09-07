'use client';

import { useId, useState } from 'react';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';

const questions = [
  ['Posso personalizar uma peça que vi no catálogo?', 'Sim. Escolha a inspiração mais próxima da sua ideia e conte os detalhes no formulário. A Damazio confirma as possibilidades pelo WhatsApp.'],
  ['Como recebo orçamento e prazo?', 'Depois de avaliar a personalização, a Damazio alinha orçamento, prazo e frete pelo WhatsApp.'],
  ['Vocês enviam para todo o Brasil?', 'Sim. O envio é combinado caso a caso, de acordo com a criação e o destino.'],
  ['Preciso criar uma conta para solicitar?', 'Não. Basta enviar sua ideia; ao final, você recebe um código para continuar a conversa pelo WhatsApp.'],
] as const;

export function HomeFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const idPrefix = useId();

  return <section className="content-section home-faq home-screen" data-home-screen aria-label="Perguntas frequentes"><Container><div className="home-faq__heading home-reveal"><p className="eyebrow">De onde você estiver</p><SectionHeading id="titulo-faq">Dúvidas que a gente esclarece</SectionHeading></div><div className="faq-list home-reveal">{questions.map(([question, answer], index) => { const isOpen = openIndex === index; const answerId = `${idPrefix}-${index}`; return <article className={isOpen ? 'faq-item faq-item--open' : 'faq-item'} key={question}><button type="button" aria-expanded={isOpen} aria-controls={answerId} onClick={() => setOpenIndex((open) => open === index ? null : index)}><span>{question}</span><span className="faq-item__chevron" aria-hidden="true" /></button><div id={answerId} className="faq-item__answer" role="region" aria-label={`Resposta: ${question}`}><p>{answer}</p></div></article>; })}</div></Container></section>;
}
