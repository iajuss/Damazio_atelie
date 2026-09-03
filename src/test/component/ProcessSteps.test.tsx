import { render, screen } from '@testing-library/react';
import { ProcessSteps } from '@/components/content/ProcessSteps';

describe('ProcessSteps', () => {
  it('explica a jornada da inspiração ao alinhamento no Direct', () => {
    render(<ProcessSteps />);

    expect(screen.getByRole('heading', { name: 'Como nasce sua peça' })).toBeInTheDocument();
    expect(screen.getByText(/escolha uma inspiração/i)).toBeInTheDocument();
    expect(screen.getByText(/conte sua ideia/i)).toBeInTheDocument();
    expect(screen.getByText(/alinhe os detalhes no Direct/i)).toBeInTheDocument();
  });
});
