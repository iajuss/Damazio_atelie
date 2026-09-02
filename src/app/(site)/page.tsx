import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';

export default function HomePage() {
  return (
    <main id="conteudo">
      <section className="hero" aria-labelledby="titulo-principal">
        <Container>
          <p className="eyebrow">Damazio Atelier</p>
          <h1 id="titulo-principal">Peças que contam histórias</h1>
          <p>Conheça o universo do atelier e encontre uma peça que faça sentido para você.</p>
          <Button href="/catalogo">Solicitar orçamento</Button>
        </Container>
      </section>
      <section id="catalogo" className="content-section" aria-labelledby="titulo-catalogo">
        <Container>
          <SectionHeading id="titulo-catalogo">Catálogo em breve</SectionHeading>
          <p>Estamos preparando uma seleção especial para você descobrir com calma.</p>
        </Container>
      </section>
      <section id="sobre" className="content-section" aria-labelledby="titulo-sobre">
        <Container><SectionHeading id="titulo-sobre">Sobre o atelier</SectionHeading></Container>
      </section>
      <section id="como-funciona" className="content-section" aria-labelledby="titulo-como-funciona">
        <Container><SectionHeading id="titulo-como-funciona">Como funciona</SectionHeading></Container>
      </section>
    </main>
  );
}
