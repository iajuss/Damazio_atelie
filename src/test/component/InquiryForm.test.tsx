import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { InquiryForm } from '@/components/inquiries/InquiryForm';
import type { CatalogProduct } from '@/features/catalog/types';

const product: CatalogProduct = {
  id: 'produto-1', lineSlug: 'enxovais-e-toalhas', slug: 'toalha-personalizada', name: 'Toalha personalizada',
  description: null, materials: [], availability: 'available', media: [],
  customizationFields: [
    { key: 'nome', label: 'Nome a bordar', type: 'text', required: true, options: [], helpText: 'Escreva como deseja ver o nome.', sortOrder: 1 },
    { key: 'cor', label: 'Cor da linha', type: 'select', required: false, options: ['Areia', 'Rosé'], helpText: null, sortOrder: 2 },
  ],
};

function response(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

describe('InquiryForm', () => {
  it('leva a pessoa à política antes de consentir com o envio', () => {
    render(<InquiryForm product={product} />);

    expect(screen.getByRole('link', { name: 'política de privacidade' })).toHaveAttribute('href', '/privacidade');
    expect(screen.getByRole('link', { name: 'Continuar pelo WhatsApp' })).toHaveAttribute('href', 'https://wa.me/5511910771179');
  });

  it('pede a ideia e envia uma criação livre sem inspiração', async () => {
    const fetcher = vi.fn().mockResolvedValue(response(201, { requestCode: 'AB12CD34EF56GH78IJ90', message: 'Solicitação registrada com sucesso.' }));
    render(<InquiryForm requestKind="custom" fetcher={fetcher} />);
    const idea = screen.getByRole('textbox', { name: /conte a sua ideia/i });
    expect(idea).toBeRequired();
    fireEvent.change(screen.getByRole('textbox', { name: /seu nome/i }), { target: { value: 'Ana' } });
    fireEvent.change(screen.getByRole('textbox', { name: /contato/i }), { target: { value: 'ana@example.com' } });
    fireEvent.change(screen.getByRole('textbox', { name: /cidade/i }), { target: { value: 'São Paulo' } });
    fireEvent.change(screen.getByRole('textbox', { name: /estado/i }), { target: { value: 'SP' } });
    fireEvent.change(idea, { target: { value: 'Uma bolsa para presentear.' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /política de privacidade/i }));
    fireEvent.submit(screen.getByRole('button', { name: 'Enviar solicitação' }).closest('form')!);
    await screen.findByRole('heading', { name: 'Solicitação enviada' });
    const payload = fetcher.mock.calls[0][1].body as FormData;
    expect(payload.get('requestKind')).toBe('custom');
    expect(payload.get('productSlug')).toBe('');
    expect(payload.get('answers')).toBe('{}');
  });

  it('renderiza campos de personalização específicos da peça e não pede endereço completo', () => {
    render(<InquiryForm product={product} />);

    expect(screen.getByRole('textbox', { name: /nome a bordar/i })).toBeRequired();
    expect(screen.getByRole('combobox', { name: /cor da linha/i })).toBeInTheDocument();
    expect(screen.getByText('Escreva como deseja ver o nome.')).toBeInTheDocument();
    expect(screen.queryByLabelText(/endereço|rua|número|cep/i)).not.toBeInTheDocument();
  });

  it('associa os erros recebidos aos campos e move o foco ao resumo', async () => {
    const fetcher = vi.fn().mockResolvedValue(response(400, { error: { message: 'Confira os campos informados.', fields: { name: 'Informe seu nome.', 'answers.nome': 'Informe o nome a bordar.' } } }));
    render(<InquiryForm product={product} fetcher={fetcher} />);
    fireEvent.click(screen.getByRole('checkbox', { name: /política de privacidade/i }));

    fireEvent.submit(screen.getByRole('button', { name: 'Enviar solicitação' }).closest('form')!);

    const summary = await screen.findByRole('alert');
    await waitFor(() => expect(summary).toHaveFocus());
    await waitFor(() => expect(screen.getByRole('textbox', { name: /seu nome/i })).toHaveAttribute('aria-describedby', expect.stringContaining('erro-name')));
    expect(screen.getByRole('textbox', { name: /nome a bordar/i })).toHaveAttribute('aria-describedby', expect.stringContaining('erro-answers-nome'));
    expect(screen.getAllByText('Informe seu nome.')).toHaveLength(2);
  });

  it('preserva entradas e arquivos selecionados após falha recuperável, permitindo removê-los', async () => {
    const fetcher = vi.fn().mockResolvedValue(response(500, { error: { message: 'Tente novamente em instantes.' } }));
    render(<InquiryForm product={product} fetcher={fetcher} />);
    fireEvent.change(screen.getByRole('textbox', { name: /seu nome/i }), { target: { value: 'Ana' } });
    const input = screen.getByLabelText(/adicionar referências/i);
    const file = new File(['imagem'], 'referencia.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });
    expect(screen.getByRole('status')).toHaveTextContent('1 referência selecionada');

    fireEvent.submit(screen.getByRole('button', { name: 'Enviar solicitação' }).closest('form')!);
    await screen.findByRole('alert');

    expect(screen.getByRole('textbox', { name: /seu nome/i })).toHaveValue('Ana');
    expect(screen.getByText('referencia.png')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Remover referencia.png' }));
    expect(screen.queryByText('referencia.png')).not.toBeInTheDocument();
  });

  it('preserva as entradas quando a API devolve erros de campo', async () => {
    const fetcher = vi.fn().mockResolvedValue(response(400, { error: { message: 'Confira os campos informados.', fields: { name: 'Informe seu nome.' } } }));
    render(<InquiryForm product={product} fetcher={fetcher} />);
    fireEvent.change(screen.getByRole('textbox', { name: /seu nome/i }), { target: { value: 'Ana' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /política de privacidade/i }));

    fireEvent.submit(screen.getByRole('button', { name: 'Enviar solicitação' }).closest('form')!);

    await screen.findAllByText('Informe seu nome.');
    expect(screen.getByRole('textbox', { name: /seu nome/i })).toHaveValue('Ana');
  });

  it('preserva o valor digitado antes da hidratação quando a API devolve erro', async () => {
    const fetcher = vi.fn().mockResolvedValue(response(400, { error: { message: 'Confira os campos informados.', fields: { name: 'Informe seu nome.' } } }));
    render(<InquiryForm product={product} fetcher={fetcher} />);
    const name = screen.getByRole('textbox', { name: /seu nome/i }) as HTMLInputElement;
    name.value = 'Ana';
    fireEvent.click(screen.getByRole('checkbox', { name: /política de privacidade/i }));

    fireEvent.submit(screen.getByRole('button', { name: 'Enviar solicitação' }).closest('form')!);

    await screen.findAllByText('Informe seu nome.');
    expect(screen.getByRole('textbox', { name: /seu nome/i })).toHaveValue('Ana');
  });

  it('envia multipart com privacidade aceita e mostra a confirmação apenas após sucesso', async () => {
    const fetcher = vi.fn().mockResolvedValue(response(201, { requestCode: 'AB12CD34EF56GH78IJ90', message: 'Solicitação registrada com sucesso.' }));
    render(<InquiryForm product={product} fetcher={fetcher} />);
    fireEvent.change(screen.getByRole('textbox', { name: /seu nome/i }), { target: { value: 'Ana' } });
    fireEvent.change(screen.getByRole('textbox', { name: /contato/i }), { target: { value: 'ana@example.com' } });
    fireEvent.change(screen.getByRole('textbox', { name: /cidade/i }), { target: { value: 'São Paulo' } });
    fireEvent.change(screen.getByRole('textbox', { name: /estado/i }), { target: { value: 'SP' } });
    fireEvent.change(screen.getByRole('textbox', { name: /nome a bordar/i }), { target: { value: 'Ana' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /política de privacidade/i }));
    fireEvent.submit(screen.getByRole('button', { name: 'Enviar solicitação' }).closest('form')!);

    await screen.findByRole('heading', { name: 'Solicitação enviada' });
    const payload = fetcher.mock.calls[0][1].body as FormData;
    expect(payload.get('productSlug')).toBe('toalha-personalizada');
    expect(payload.get('privacyAccepted')).toBe('true');
    expect(payload.get('answers')).toBe(JSON.stringify({ nome: 'Ana' }));
    expect(screen.queryByRole('form')).not.toBeInTheDocument();
  });

  it('informa quando as referências estão sendo enviadas', async () => {
    let resolveResponse!: (value: Response) => void;
    const fetcher = vi.fn().mockReturnValue(new Promise<Response>((resolve) => { resolveResponse = resolve; }));
    render(<InquiryForm product={product} fetcher={fetcher} />);
    fireEvent.change(screen.getByRole('textbox', { name: /seu nome/i }), { target: { value: 'Ana' } });
    fireEvent.change(screen.getByRole('textbox', { name: /contato/i }), { target: { value: 'ana@example.com' } });
    fireEvent.change(screen.getByRole('textbox', { name: /cidade/i }), { target: { value: 'São Paulo' } });
    fireEvent.change(screen.getByRole('textbox', { name: /estado/i }), { target: { value: 'SP' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /política de privacidade/i }));
    fireEvent.change(screen.getByLabelText(/adicionar referências/i), { target: { files: [new File(['imagem'], 'referencia.png', { type: 'image/png' })] } });
    fireEvent.submit(screen.getByRole('button', { name: 'Enviar solicitação' }).closest('form')!);

    expect(await screen.findByRole('status')).toHaveTextContent('Enviando 1 referência');
    resolveResponse(response(201, { requestCode: 'AB12CD34EF56GH78IJ90', message: 'Solicitação registrada com sucesso.' }));
  });

  it('informa localmente que a privacidade é obrigatória antes de enviar', async () => {
    const fetcher = vi.fn();
    render(<InquiryForm product={product} fetcher={fetcher} />);

    fireEvent.submit(screen.getByRole('button', { name: 'Enviar solicitação' }).closest('form')!);

    await waitFor(() => expect(screen.getAllByText(/aceitar a política de privacidade/i)).toHaveLength(2));
    expect(fetcher).not.toHaveBeenCalled();
  });
});
