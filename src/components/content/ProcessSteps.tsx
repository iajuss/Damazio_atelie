'use client';

import { useState } from 'react';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';

const steps = [['01', 'Escolha uma inspiração', 'Explore as linhas e encontre uma peça que converse com a sua ocasião.'], ['02', 'Conte sua ideia', 'Compartilhe os detalhes que tornam a criação única para você.'], ['03', 'Alinhe os detalhes pelo WhatsApp', 'A Damazio conversa com você sobre viabilidade, orçamento, prazo e envio.']] as const;

export function ProcessSteps() {
  const [current, setCurrent] = useState(0);
  const step = steps[current];
  const previous = () => setCurrent((index) => (index + steps.length - 1) % steps.length);
  const next = () => setCurrent((index) => (index + 1) % steps.length);

  return <section id="como-funciona" className="content-section process-steps home-screen" data-home-screen aria-labelledby="titulo-como-funciona"><Container className="process-steps__layout"><div className="process-steps__intro home-reveal"><p className="eyebrow process-steps__eyebrow">Personalização com calma</p><SectionHeading id="titulo-como-funciona">Como nasce sua peça</SectionHeading><p>Um passo de cada vez, para que cada detalhe tenha espaço para ser bem cuidado.</p></div><div className="process-carousel process-carousel--card home-reveal" role="region" aria-label="Personalização com calma"><p className="process-carousel__count" aria-live="polite">Etapa {current + 1} de {steps.length}</p><article className="process-carousel__slide"><span>{step[0]}</span><h3>{step[1]}</h3><p>{step[2]}</p></article><div className="process-carousel__controls"><button type="button" onClick={previous} aria-label="Etapa anterior">Anterior</button><div className="process-carousel__dots" aria-label="Escolher etapa">{steps.map(([number, title], index) => <button type="button" key={number} aria-label={`Etapa ${index + 1}: ${title}`} aria-pressed={index === current} onClick={() => setCurrent(index)}>{index + 1}</button>)}</div><button type="button" onClick={next} aria-label="Próxima etapa">Próxima</button></div></div></Container></section>;
}
