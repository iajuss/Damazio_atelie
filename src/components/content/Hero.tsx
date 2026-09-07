import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';

type HeroProps = { eyebrow: string; title: string; description: string };

export function Hero({ eyebrow, title, description }: HeroProps) {
  const photos = [
    ['/images/catalogo/camisa-bordada-sem-marca.jpeg', 'Peça bordada da Damazio Atelier'],
    ['/images/catalogo/bolsa-croche-sem-marca.jpeg', 'Bolsa de crochê artesanal'],
    ['/images/catalogo/presente-embalado-sem-marca.jpeg', 'Presente preparado pela Damazio Atelier'],
  ] as const;

  return <section id="inicio" className="hero hero--editorial home-screen" data-home-screen aria-labelledby="titulo-principal"><div className="hero__backdrop" aria-label="Criações da Damazio Atelier">{photos.map(([src, alt], index) => <Image className={`hero__slide${index === 0 ? ' hero__slide--shirt' : ''}`} key={src} src={src} alt={alt} fill sizes="100vw" priority={index === 0} unoptimized />)}</div><div className="hero__veil" aria-hidden="true" /><Container className="hero__grid"><div className="hero__content home-reveal"><p className="eyebrow">{eyebrow}</p><h1 id="titulo-principal">{title}</h1><p>{description}</p><Button href="/catalogo">Solicitar orçamento</Button></div></Container></section>;
}
