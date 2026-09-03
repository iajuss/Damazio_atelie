import { render, screen } from '@testing-library/react';
import { ErrorSummary } from '@/components/ui/ErrorSummary';

describe('ErrorSummary', () => {
  it('recebe o foco e anuncia os erros para orientar a correção', () => {
    render(<ErrorSummary messages={['Informe seu nome.', 'Informe um contato válido.']} />);

    expect(screen.getByRole('alert')).toHaveFocus();
    expect(screen.getByRole('alert')).toHaveTextContent('Confira sua solicitação');
    expect(screen.getByRole('alert')).toHaveTextContent('Informe seu nome.');
    expect(screen.getByRole('alert')).toHaveTextContent('Informe um contato válido.');
  });
});

