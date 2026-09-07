import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import type { CatalogProduct } from '@/features/catalog/types';
import { lineMetadata } from '@/features/catalog/metadata';
import { getCatalogContent } from '@/features/content/repository';

type LinePageProps = { params: Promise<{ lineSlug: string }> };

function requestLabel(product: CatalogProduct): string {
  const name = product.name.toLocaleLowerCase('pt-BR');
  if (name.startsWith('sousplats')) return `Solicitar seus ${name}`;
  if (name.startsWith('enxovais') || name.startsWith('presentes')) return `Solicitar seus ${name}`;
  if (name.startsWith('enxoval') || name.startsWith('presente')) return `Solicitar seu ${name}`;
  return `Solicitar sua ${name}`;
}

export async function generateMetadata({ params }: LinePageProps) {
  const { lineSlug } = await params;
  const { lines } = await getCatalogContent();
  const line = lines.find((item) => item.slug === lineSlug);
  return line ? lineMetadata(line) : {};
}

export default async function CatalogLinePage({ params }: LinePageProps) {
  const { lineSlug } = await params;
  const { lines, products } = await getCatalogContent();
  const line = lines.find((item) => item.slug === lineSlug);
  if (!line) notFound();

  const lineProducts = products.filter((product) => product.lineSlug === line.slug);
  const examples = lineProducts.flatMap((product) =>
    [...product.media]
      .sort((first, second) => first.sortOrder - second.sortOrder)
      .map((media) => ({ product, media })),
  );

  return (
    <main id="conteudo" className="catalog-line-page" tabIndex={-1}>
      <section className="catalog-line-hero catalog-line-screen" data-catalog-line-screen>
        <Container className="catalog-line-hero__content">
          <div className="catalog-line-hero__intro">
            <p className="eyebrow">Linha do atelier</p>
            <h1>{line.name}</h1>
            {line.description ? <p>{line.description}</p> : null}
          </div>
          <div className="catalog-line-hero__details">
            <p className="catalog-line-hero__statement">Cada modelo é um ponto de partida para uma criação feita com os seus detalhes, cores e memórias.</p>
            <ul className="catalog-line-hero__marks" aria-label="Características da linha">
              <li>Feito sob encomenda</li>
              <li>Detalhes personalizáveis</li>
              <li>Atendimento pelo WhatsApp</li>
            </ul>
            <Button href="#modelos">Ver modelos</Button>
          </div>
        </Container>
      </section>

      <section id="modelos" className="content-section catalog-line-products catalog-line-screen" data-catalog-line-screen aria-labelledby="pecas-da-linha">
        <Container className="catalog-line-products__content">
          <div>
            <p className="eyebrow">Modelos para inspirar</p>
          <SectionHeading id="pecas-da-linha">Peças da linha</SectionHeading>
          </div>
          {examples.length > 0 ? (
            <div className="line-example-grid">
              {examples.map(({ product, media }) => <article className={`line-example-card line-example-card--${product.lineSlug}`} key={`${product.id}-${media.url}`}>
                <div className="line-example-card__image-wrap"><Image src={media.url} alt={media.altText} fill sizes="(min-width: 64rem) 33vw, (min-width: 42rem) 50vw, 100vw" unoptimized /></div>
                <div className="line-example-card__body"><p className="eyebrow">Modelo</p><h3>{product.name}</h3><p>{media.caption ?? product.description ?? 'Uma criação feita para ganhar os seus detalhes.'}</p><Button href={`/solicitar-orcamento/${product.slug}`}>{requestLabel(product)}</Button></div>
              </article>)}
            </div>
          ) : (
            <p className="catalog-empty">
              Novas inspirações desta linha estarão disponíveis em breve. Enquanto isso, conte sua ideia pelo WhatsApp.
            </p>
          )}
        </Container>
      </section>
    </main>
  );
}
