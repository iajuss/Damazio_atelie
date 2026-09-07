import { LineCard } from '@/components/catalog/LineCard';
import { CustomRequestCard } from '@/components/catalog/CustomRequestCard';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { catalogMetadata } from '@/features/catalog/metadata';
import { getCatalogContent } from '@/features/content/repository';

export const metadata = catalogMetadata();

export default async function CatalogPage() {
  const { lines } = await getCatalogContent();

  return (
    <main id="conteudo" tabIndex={-1}>
      <section className="catalog-hero catalog-screen" data-catalog-screen aria-labelledby="titulo-catalogo">
        <Container className="catalog-hero__content">
          <p className="eyebrow">Catálogo consultivo</p>
          <h1 id="titulo-catalogo">Criações para inspirar a sua história</h1>
          <p>Escolha uma linha, descubra possibilidades e conte à Damazio o que deseja criar.</p>
          <Button href="#linhas-catalogo">Explorar linhas</Button>
        </Container>
      </section>

      <section className="content-section catalog-lines catalog-screen" data-catalog-screen aria-labelledby="linhas-catalogo">
        <Container className="catalog-section__content">
          <header className="catalog-section__intro">
            <p className="eyebrow">Feito para guardar</p>
            <SectionHeading id="linhas-catalogo">Linhas do atelier</SectionHeading>
            <p>Encontre o ponto de partida para uma peça feita com intenção, cuidado e identidade.</p>
          </header>
          <div className="line-grid">{lines.map((line) => <LineCard key={line.id} line={line} />)}<CustomRequestCard /></div>
        </Container>
      </section>
    </main>
  );
}
