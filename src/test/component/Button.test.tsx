import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('renderiza o rótulo em português e expõe os ganchos semânticos das variantes', () => {
    const { rerender } = render(<Button>Conheça o catálogo</Button>);
    expect(screen.getByRole('button', { name: 'Conheça o catálogo' })).toHaveAttribute('data-variant', 'primary');
    rerender(<Button variant="secondary">Saiba mais</Button>);
    expect(screen.getByRole('button', { name: 'Saiba mais' })).toHaveAttribute('data-variant', 'secondary');
  });

  it('impede interação quando está desabilitado', () => {
    render(<Button disabled>Indisponível</Button>);
    expect(screen.getByRole('button', { name: 'Indisponível' })).toBeDisabled();
  });

  it('oferece modo de link acessível quando recebe um destino', () => {
    render(<Button href="/catalogo">Ver catálogo</Button>);
    expect(screen.getByRole('link', { name: 'Ver catálogo' })).toHaveAttribute('href', '/catalogo');
  });
});
