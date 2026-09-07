import Image from 'next/image';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';

export function HomeAbout() {
  return (
    <section id="sobre" className="content-section home-about home-screen" data-home-screen aria-label="Sobre a Damazio Atelier">
      <Container className="home-about__grid">
        <div className="home-about__content home-reveal">
          <p className="eyebrow">Sobre a Damazio</p>
          <SectionHeading id="titulo-sobre">O afeto encontra forma nos detalhes</SectionHeading>
          <p>Entre fios, bordados e gestos de cuidado, a Damazio Atelier transforma lembranças em peças feitas para acompanhar histórias.</p>
          <p>Cada criação nasce de uma conversa atenta e ganha forma com materiais, acabamento e apresentação escolhidos com intenção.</p>
        </div>
        <div className="home-about__image home-reveal">
          <Image src="/images/catalogo/camisa-familia.jpeg" alt="Camiseta branca bordada com ilustração de família" fill sizes="(min-width: 64rem) 40vw, 100vw" unoptimized />
        </div>
      </Container>
    </section>
  );
}
