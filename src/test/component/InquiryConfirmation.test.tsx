import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { InquiryConfirmation } from '@/components/inquiries/InquiryConfirmation';
import { INSTAGRAM_PROFILE_URL } from '@/lib/site';

describe('InquiryConfirmation', () => {
  it('mantém o código e o próximo passo no HTML, inclusive sem JavaScript', () => {
    render(<InquiryConfirmation result={{ requestCode: 'AB12CD34EF56GH78IJ90', message: 'Solicitação registrada com sucesso.' }} />);

    expect(screen.getByText('AB12CD34EF56GH78IJ90')).toBeInTheDocument();
    expect(screen.getByText(/o orçamento, o prazo e o frete serão confirmados no Direct/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Abrir Instagram' })).toHaveAttribute('href', INSTAGRAM_PROFILE_URL);
  });

  it('copia o código de forma segura quando a área de transferência é suportada', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(<InquiryConfirmation result={{ requestCode: 'AB12CD34EF56GH78IJ90', message: 'Solicitação registrada com sucesso.' }} />);

    const button = screen.getByRole('button', { name: 'Copiar código' });
    await waitFor(() => expect(button).toBeEnabled());
    fireEvent.click(button);

    expect(writeText).toHaveBeenCalledWith('AB12CD34EF56GH78IJ90');
    expect(await screen.findByText('Código copiado.')).toBeInTheDocument();
  });

  it('explica quando a cópia não é suportada em vez de oferecer uma ação enganosa', () => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
    render(<InquiryConfirmation result={{ requestCode: 'AB12CD34EF56GH78IJ90', message: 'Solicitação registrada com sucesso.' }} />);

    expect(screen.getByRole('button', { name: 'Copiar código' })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('A cópia automática não está disponível neste navegador.');
    expect(screen.getByText('AB12CD34EF56GH78IJ90')).toBeInTheDocument();
  });

  it('informa a falha de cópia e mantém o código para seleção manual', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('blocked'));
    Object.assign(navigator, { clipboard: { writeText } });
    render(<InquiryConfirmation result={{ requestCode: 'AB12CD34EF56GH78IJ90', message: 'Solicitação registrada com sucesso.' }} />);

    const button = screen.getByRole('button', { name: 'Copiar código' });
    await waitFor(() => expect(button).toBeEnabled());
    fireEvent.click(button);

    expect(await screen.findByRole('status')).toHaveTextContent('Não foi possível copiar o código automaticamente.');
    expect(screen.getByText('AB12CD34EF56GH78IJ90')).toBeInTheDocument();
  });
});
