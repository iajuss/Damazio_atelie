import { render, screen } from '@testing-library/react';
import { DetailStory } from '@/components/content/DetailStory';

describe('DetailStory', () => {
  it('mostra a embalagem como detalhe do cuidado da Damazio', () => {
    render(<DetailStory />);

    expect(screen.getByRole('img', { name: 'Embalagem de presente da Damazio Atelier' })).toHaveAttribute(
      'src',
      '/images/catalogo/detalhe-embalagem.jpeg',
    );
  });
});
