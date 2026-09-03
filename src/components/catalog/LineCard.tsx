import Image from 'next/image';
import type { CatalogLine } from '@/features/catalog/types';

type LineCardProps = { line: CatalogLine };

export function LineCard({ line }: LineCardProps) {
  const imageAlt = `Linha ${line.name} da Damazio Atelier`;
  return <article className="line-card">
    {line.coverImage ? <div className="line-card__image-wrap"><Image className="line-card__image" src={line.coverImage} alt={imageAlt} fill sizes="(min-width: 64rem) 25vw, (min-width: 42rem) 50vw, 100vw" unoptimized /></div> : <div className="line-card__visual" aria-hidden="true" />}
    <div className="line-card__body"><h3>{line.name}</h3>{line.description ? <p>{line.description}</p> : null}<a href={`/catalogo/${line.slug}`}>Ver peças da linha {line.name}</a></div>
  </article>;
}
