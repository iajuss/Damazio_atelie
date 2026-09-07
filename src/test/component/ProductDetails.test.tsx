import { render, screen } from '@testing-library/react';
import { ProductDetails } from '@/components/catalog/ProductDetails';
import type { CatalogProduct } from '@/features/catalog/types';

const product: CatalogProduct = {
  id: 'produto-1',
  lineSlug: 'enxovais-e-toalhas',
  slug: 'toalha-personalizada',
  name: 'Toalha personalizada',
  description: 'Uma peça criada para acompanhar rituais de cuidado.',
  materials: ['Algodão', 'Linha de bordado'],
  availability: 'available',
  media: [],
  customizationFields: [
    { key: 'nome', label: 'Nome a bordar', type: 'text', required: true, options: [], helpText: 'Conte como deseja escrever.', sortOrder: 1 },
    { key: 'cor', label: 'Cor da linha', type: 'select', required: false, options: ['Areia', 'Rosé'], helpText: null, sortOrder: 2 },
  ],
};

describe('ProductDetails', () => {
  it('apresenta materiais e possibilidades de personalização sem controles de checkout', () => {
    render(<ProductDetails product={product} />);

    expect(screen.getByRole('heading', { name: 'Toalha personalizada' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Materiais' })).toBeInTheDocument();
    expect(screen.getByText('Algodão')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Possibilidades de personalização' })).toBeInTheDocument();
    expect(screen.getByText('Nome a bordar')).toBeInTheDocument();
    expect(screen.getByText(/Areia e Rosé/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Solicitar orçamento' })).toHaveAttribute(
      'href',
      '/solicitar-orcamento/toalha-personalizada',
    );
    expect(screen.queryByRole('button', { name: /comprar|adicionar/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/R\$|preço|carrinho/i)).not.toBeInTheDocument();
  });

  it('informa indisponibilidade e oferece WhatsApp sem CTA de solicitação', () => {
    render(<ProductDetails product={{ ...product, availability: 'unavailable' }} />);

    expect(screen.getByRole('status')).toHaveTextContent('Esta peça não está disponível para solicitação no momento.');
    expect(screen.getByRole('link', { name: 'Conversar pelo WhatsApp' })).toHaveAttribute('href', 'https://wa.me/5511910771179');
    expect(screen.queryByRole('link', { name: 'Solicitar orçamento' })).not.toBeInTheDocument();
  });
});
