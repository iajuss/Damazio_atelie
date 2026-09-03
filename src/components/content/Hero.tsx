import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';

type HeroProps = { eyebrow: string; title: string; description: string };

export function Hero({ eyebrow, title, description }: HeroProps) {
  return <section className="hero hero--editorial" aria-labelledby="titulo-principal"><Container><p className="eyebrow">{eyebrow}</p><h1 id="titulo-principal">{title}</h1><p>{description}</p><Button href="/catalogo">Solicitar orçamento</Button></Container></section>;
}
