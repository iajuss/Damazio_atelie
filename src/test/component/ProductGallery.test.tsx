import { fireEvent, render, screen } from '@testing-library/react';
import { ProductGallery } from '@/components/catalog/ProductGallery';
import type { CatalogMedia } from '@/features/catalog/types';

const media: CatalogMedia[] = [
  { url: '/camisa-frente.jpg', altText: 'Camisa bordada vista de frente', caption: 'Frente', sortOrder: 1, isFeatured: true },
  { url: '/camisa-detalhe.jpg', altText: 'Detalhe do bordado na camisa', caption: 'Detalhe', sortOrder: 2, isFeatured: false },
];

describe('ProductGallery', () => {
  it('troca a mídia com controles de teclado e preserva o texto alternativo descritivo', () => {
    render(<ProductGallery media={media} productName="Camisa bordada" />);

    expect(screen.getByRole('img', { name: 'Camisa bordada vista de frente' })).toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole('region', { name: 'Galeria de imagens de Camisa bordada' }), { key: 'ArrowRight' });

    expect(screen.getByRole('img', { name: 'Detalhe do bordado na camisa' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Imagem 2 de 2');
  });

  it('permite avançar com gesto de toque sem depender de hover', () => {
    render(<ProductGallery media={media} productName="Camisa bordada" />);

    const gallery = screen.getByRole('region', { name: 'Galeria de imagens de Camisa bordada' });
    fireEvent.touchStart(gallery, { touches: [{ clientX: 280 }] });
    fireEvent.touchEnd(gallery, { changedTouches: [{ clientX: 120 }] });

    expect(screen.getByRole('img', { name: 'Detalhe do bordado na camisa' })).toBeInTheDocument();
  });
});
