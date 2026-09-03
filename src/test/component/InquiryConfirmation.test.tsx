import { fireEvent, render, screen } from '@testing-library/react';
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

    fireEvent.click(screen.getByRole('button', { name: 'Copiar código' }));

    expect(writeText).toHaveBeenCalledWith('AB12CD34EF56GH78IJ90');
    expect(await screen.findByText('Código copiado.')).toBeInTheDocument();
  });
});
