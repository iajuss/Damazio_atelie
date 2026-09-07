import { fireEvent, render, screen } from '@testing-library/react';
import { HomeFaq } from '@/components/content/HomeFaq';

describe('HomeFaq', () => {
  it('expande uma resposta ao escolher uma pergunta', () => {
    render(<HomeFaq />);

    const question = screen.getByRole('button', { name: 'Posso personalizar uma peça que vi no catálogo?' });
    expect(question.getElementsByClassName('faq-item__chevron')).toHaveLength(1);
    expect(question).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(question);

    expect(question).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/escolha a inspiração mais próxima/i)).toBeVisible();
  });
});
