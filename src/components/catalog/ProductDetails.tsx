import { AvailabilityBadge } from '@/components/catalog/AvailabilityBadge';
import { Button } from '@/components/ui/Button';
import { WHATSAPP_CONTACT_URL } from '@/lib/site';
import type { CatalogProduct } from '@/features/catalog/types';

type ProductDetailsProps = { product: CatalogProduct };

export function ProductDetails({ product }: ProductDetailsProps) {
  const isUnavailable = product.availability === 'unavailable';

  return <div className="product-details">
    <p className="eyebrow"><a href={`/catalogo/${product.lineSlug}`}>Coleção {product.lineSlug.replaceAll('-', ' ')}</a></p>
    <h1>{product.name}</h1>
    <AvailabilityBadge availability={product.availability} />
    {product.description ? <p className="product-details__description">{product.description}</p> : null}
    <section aria-labelledby="materiais"><h2 id="materiais">Materiais</h2>{product.materials.length > 0 ? <ul>{product.materials.map((material) => <li key={material}>{material}</li>)}</ul> : <p>Os materiais são definidos com cuidado durante a conversa.</p>}</section>
    <section aria-labelledby="personalizacao"><h2 id="personalizacao">Possibilidades de personalização</h2>{product.customizationFields.length > 0 ? <ul>{product.customizationFields.map((field) => <li key={field.key}><strong>{field.label}</strong>{field.options.length > 0 ? <span>: {field.options.join(' e ')}</span> : null}{field.helpText ? <p>{field.helpText}</p> : null}</li>)}</ul> : <p>Conte sua ideia para definirmos os detalhes possíveis para esta peça.</p>}</section>
    {isUnavailable ? <section className="product-details__unavailable" aria-live="polite"><p role="status">Esta peça não está disponível para solicitação no momento.</p><p>Para conhecer alternativas e próximas criações, fale com a Damazio pelo WhatsApp.</p><Button href={WHATSAPP_CONTACT_URL} target="_blank" rel="noreferrer" variant="secondary">Conversar pelo WhatsApp</Button></section> : <section className="product-details__request" aria-labelledby="sob-encomenda"><h2 id="sob-encomenda">Feita sob encomenda</h2><p>Cada criação começa com uma conversa para alinhar referências, materiais, prazo e os detalhes que tornam a peça sua.</p><Button href={`/solicitar-orcamento/${product.slug}`}>Solicitar orçamento</Button></section>}
  </div>;
}
