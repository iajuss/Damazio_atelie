import { render, screen } from '@testing-library/react';
import { LineCard } from '@/components/catalog/LineCard';
import { ProductCard } from '@/components/catalog/ProductCard';
import type { CatalogLine, CatalogProduct } from '@/features/catalog/types';

const line: CatalogLine = {
  id: 'linha-1',
  slug: 'bordados-em-roupas',
  name: 'Bordados em roupas',
  description: 'Peças afetivas para acompanhar histórias.',
  coverImage: '/placeholder-bordado.svg',
  sortOrder: 1,
};

const product: CatalogProduct = {
  id: 'produto-1',
  lineSlug: 'bordados-em-roupas',
  slug: 'camisa-bordada',
  name: 'Camisa bordada',
  description: 'Uma inspiração para presentear com intenção.',
  materials: ['Algodão'],
  availability: 'available',
  media: [{
    url: '/placeholder-camisa.svg',
    altText: 'Camisa com bordado delicado em composição neutra',
    caption: null,
    sortOrder: 1,
    isFeatured: true,
  }],
  customizationFields: [],
};

describe('LineCard', () => {
  it('leva à linha publicada e oferece texto alternativo para a imagem', () => {
    render(<LineCard line={line} />);

    expect(screen.getByRole('link', { name: /bordados em roupas/i })).toHaveAttribute(
      'href',
      '/catalogo/bordados-em-roupas',
    );
    expect(screen.getByRole('img', { name: /bordados em roupas/i })).toBeInTheDocument();
  });

  it('exibe mídia pública HTTPS sem depender de uma origem remota configurada no Next', () => {
    render(<LineCard line={{ ...line, coverImage: 'https://media.example.test/bordado.jpg' }} />);

    expect(screen.getByRole('img', { name: /bordados em roupas/i })).toHaveAttribute(
      'src',
      'https://media.example.test/bordado.jpg',
    );
  });
});

describe('ProductCard', () => {
  it('leva aos detalhes consultivos sem exibir preço', () => {
    render(<ProductCard product={product} />);

    expect(screen.getByText('Sob encomenda')).toBeInTheDocument();
    expect(screen.getByText('Personalizável')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver detalhes de Camisa bordada' })).toHaveAttribute(
      'href',
      '/produtos/camisa-bordada',
    );
    expect(screen.queryByText(/R\$|preço|valor/i)).not.toBeInTheDocument();
  });

  it('exibe mídia pública HTTPS do produto sem depender do otimizador remoto', () => {
    render(<ProductCard product={{ ...product, media: [{ ...product.media[0], url: 'https://media.example.test/camisa.jpg' }] }} />);

    expect(screen.getByRole('img', { name: /camisa com bordado delicado/i })).toHaveAttribute(
      'src',
      'https://media.example.test/camisa.jpg',
    );
  });
});
