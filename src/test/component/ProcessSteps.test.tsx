import { fireEvent, render, screen } from '@testing-library/react';
import { ProcessSteps } from '@/components/content/ProcessSteps';

describe('ProcessSteps', () => {
  it('avança pela jornada da inspiração ao alinhamento no WhatsApp', () => {
    render(<ProcessSteps />);

    expect(screen.getByRole('heading', { name: 'Como nasce sua peça' })).toBeInTheDocument();
    expect(screen.getByText(/escolha uma inspiração/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Próxima etapa' }));
    expect(screen.getByText(/conte sua ideia/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Próxima etapa' }));
    expect(screen.getByText(/alinhe os detalhes pelo WhatsApp/i)).toBeInTheDocument();
  });

  it('mantém a experiência de personalização em um painel de alto contraste', () => {
    render(<ProcessSteps />);

    expect(screen.getByRole('region', { name: 'Personalização com calma' })).toHaveClass('process-carousel--card');
    expect(screen.getByText('Etapa 1 de 3')).toBeInTheDocument();
  });

  it('diferencia o selo dourado do título e do texto de apoio', () => {
    render(<ProcessSteps />);

    expect(screen.getByText('Personalização com calma')).toHaveClass('process-steps__eyebrow');
  });
});
