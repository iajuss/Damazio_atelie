import { LineCard } from '@/components/catalog/LineCard';
import { HomeFaq } from '@/components/content/HomeFaq';
import { Hero } from '@/components/content/Hero';
import { HomeAbout } from '@/components/content/HomeAbout';
import { InteractionPaths } from '@/components/content/InteractionPaths';
import { ProcessSteps } from '@/components/content/ProcessSteps';
import { ProductMarquee } from '@/components/content/ProductMarquee';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { getHomeContent } from '@/features/content/repository';
import { publicPageMetadata } from '@/lib/site';

export const metadata = publicPageMetadata('Início', 'Peças autorais sob encomenda para transformar afeto em memória.', '/');

export default async function HomePage() {
  const content = await getHomeContent();
  return (
    <main id="conteudo" tabIndex={-1}>
      <Hero {...content.hero} />
      <HomeAbout />
      <InteractionPaths />
      <section id="linhas" className="content-section home-lines home-screen" data-home-screen aria-labelledby="titulo-linhas"><Container className="home-lines__content"><div className="home-reveal"><p className="eyebrow">Linhas do atelier</p><SectionHeading id="titulo-linhas">Conheça as criações</SectionHeading></div><div className="line-grid home-reveal">{content.lines.map((line) => <LineCard key={line.id} line={line} />)}</div></Container></section>
      <ProcessSteps />
      <HomeFaq />
      <section className="catalog-cta home-screen" data-home-screen aria-labelledby="titulo-cta-catalogo"><Container><p className="eyebrow">Sua história começa aqui</p><SectionHeading id="titulo-cta-catalogo">Descubra as criações do atelier</SectionHeading><p>Escolha uma inspiração e conte o que imagina. A Damazio acompanha os próximos detalhes com você.</p><Button href="/catalogo">Conheça o catálogo</Button></Container></section>
      <ProductMarquee />
    </main>
  );
}
