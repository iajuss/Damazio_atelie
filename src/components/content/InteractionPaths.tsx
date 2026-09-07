'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';

const paths = [
  ['Bordado afetivo', 'Um nome, uma data ou uma mensagem pode virar um gesto guardado na peça.', '/catalogo/bordado'],
  ['Crochê autoral', 'Texturas, cores e formas feitas à mão para acompanhar sua rotina com presença.', '/catalogo/croche'],
  ['Presentes com história', 'A escolha parte da ocasião e ganha detalhes pensados para quem vai receber.', '/catalogo/presentes'],
  ['Criação sob medida', 'Conte o que imagina para que a Damazio avalie uma peça criada a partir da sua ideia.', '/catalogo'],
] as const;

export function InteractionPaths() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [title, description, href] = paths[activeIndex];
  const panelId = 'caminho-de-criacao';

  return <section className="content-section interaction-paths home-screen" data-home-screen aria-labelledby="titulo-caminhos"><Container><div className="interaction-paths__layout"><div className="interaction-paths__intro home-reveal"><p className="eyebrow">Quatro caminhos de criação</p><SectionHeading id="titulo-caminhos">Encontre a forma do seu afeto</SectionHeading><p>Escolha um ponto de partida e descubra como a sua história pode ganhar matéria.</p></div><div className="interaction-paths__chooser home-reveal" role="region" aria-label="Quatro caminhos de interação"><div className="interaction-paths__tabs" role="tablist" aria-label="Caminhos de criação">{paths.map(([path], index) => <button type="button" role="tab" key={path} id={`caminho-${index}`} aria-controls={panelId} aria-selected={activeIndex === index} onClick={() => setActiveIndex(index)}>{path}</button>)}</div><div className="interaction-paths__panel" id={panelId} role="tabpanel" aria-labelledby={`caminho-${activeIndex}`}><p className="eyebrow">{String(activeIndex + 1).padStart(2, '0')}</p><h3>{title}</h3><p>{description}</p><Button href={href}>Conhecer essa linha</Button></div></div></div></Container></section>;
}
