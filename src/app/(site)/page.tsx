import { LineCard } from '@/components/catalog/LineCard';
import { ProductCard } from '@/components/catalog/ProductCard';
import { DetailStory } from '@/components/content/DetailStory';
import { Hero } from '@/components/content/Hero';
import { ProcessSteps } from '@/components/content/ProcessSteps';
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
      <section id="linhas" className="content-section" aria-labelledby="titulo-linhas"><Container><p className="eyebrow">Quatro caminhos de criação</p><SectionHeading id="titulo-linhas">Encontre a forma do seu afeto</SectionHeading><div className="line-grid">{content.lines.map((line) => <LineCard key={line.id} line={line} />)}</div></Container></section>
      <section className="content-section editorial-products" aria-labelledby="titulo-produtos"><Container><p className="eyebrow">Peças que contam histórias</p><SectionHeading id="titulo-produtos">Inspirações para começar</SectionHeading><div className="product-grid">{content.products.map((product) => <ProductCard key={product.id} product={product} />)}</div></Container></section>
      <ProcessSteps />
      <DetailStory />
      <section className="content-section delivery-story" aria-labelledby="titulo-envio"><Container><p className="eyebrow">De onde você estiver</p><SectionHeading id="titulo-envio">Envio para todo o Brasil</SectionHeading><p>Frete e prazo são alinhados caso a caso no Direct, para respeitar o cuidado de cada criação e o seu destino.</p><Button href="/envio-nacional" variant="secondary">Conheça o envio nacional</Button></Container></section>
      <section className="catalog-cta" aria-labelledby="titulo-cta-catalogo"><Container><p className="eyebrow">Sua história começa aqui</p><SectionHeading id="titulo-cta-catalogo">Descubra as criações do atelier</SectionHeading><p>Escolha uma inspiração e conte o que imagina. A Damazio acompanha os próximos detalhes com você.</p><Button href="/catalogo">Conheça o catálogo</Button></Container></section>
    </main>
  );
}
