'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { CatalogMedia } from '@/features/catalog/types';

type ProductGalleryProps = {
  media: CatalogMedia[];
  productName: string;
};

export function ProductGallery({ media, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  if (media.length === 0) {
    return <div className="product-gallery__placeholder" aria-label={`Imagem de ${productName} indisponível`} />;
  }

  const activeMedia = media[activeIndex];
  const hasMultipleMedia = media.length > 1;
  const showPrevious = () => setActiveIndex((index) => (index - 1 + media.length) % media.length);
  const showNext = () => setActiveIndex((index) => (index + 1) % media.length);

  return (
    <section
      className="product-gallery"
      aria-label={`Galeria de imagens de ${productName}`}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') showPrevious();
        if (event.key === 'ArrowRight') showNext();
      }}
      onTouchStart={(event) => setTouchStartX(event.touches[0]?.clientX ?? null)}
      onTouchEnd={(event) => {
        const endX = event.changedTouches[0]?.clientX;
        if (touchStartX === null || endX === undefined || Math.abs(endX - touchStartX) < 40) return;
        if (endX < touchStartX) showNext(); else showPrevious();
        setTouchStartX(null);
      }}
    >
      <div className="product-gallery__image-wrap">
        <Image className="product-gallery__image" src={activeMedia.url} alt={activeMedia.altText} fill sizes="(min-width: 64rem) 50vw, 100vw" unoptimized />
      </div>
      {activeMedia.caption ? <p className="product-gallery__caption">{activeMedia.caption}</p> : null}
      {hasMultipleMedia ? <div className="product-gallery__controls" aria-label="Controles da galeria">
        <button type="button" onClick={showPrevious} aria-label="Imagem anterior">Anterior</button>
        <p aria-live="polite" role="status">Imagem {activeIndex + 1} de {media.length}</p>
        <button type="button" onClick={showNext} aria-label="Próxima imagem">Próxima</button>
      </div> : <p className="sr-only" aria-live="polite" role="status">Imagem 1 de 1</p>}
    </section>
  );
}
