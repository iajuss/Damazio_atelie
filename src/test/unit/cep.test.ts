import { describe, expect, it, vi } from 'vitest';
import { CepLookupError, lookupCep } from '@/features/address/cep';
import { createCepGetHandler } from '@/app/api/cep/[postalCode]/route';

describe('consulta segura de CEP', () => {
  it('normaliza a resposta do ViaCEP sem expor o payload original', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      cep: '01001-000',
      logradouro: 'Praça da Sé',
      complemento: 'lado ímpar',
      bairro: 'Sé',
      localidade: 'São Paulo',
      uf: 'SP',
      ibge: '3550308',
      erro: false,
    }), { status: 200 }));

    await expect(lookupCep('01001-000', fetcher)).resolves.toEqual({
      street: 'Praça da Sé',
      neighborhood: 'Sé',
      city: 'São Paulo',
      state: 'SP',
    });
    expect(fetcher).toHaveBeenCalledWith('https://viacep.com.br/ws/01001000/json/', expect.objectContaining({
      headers: { accept: 'application/json' },
      signal: expect.any(AbortSignal),
    }));
  });

  it('converte uma falha do provedor em erro de consulta recuperável', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('detalhe do provedor', { status: 503 }));

    await expect(lookupCep('01001000', fetcher)).rejects.toEqual(new CepLookupError('lookup_failed'));
  });

  it('rejeita CEP inválido com HTTP 400 sem consultar o provedor', async () => {
    const lookup = vi.fn();
    const get = createCepGetHandler({ lookup });

    const response = await get(new Request('https://damazio.example/api/cep/invalido'), {
      params: Promise.resolve({ postalCode: 'invalido' }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: { message: 'Informe um CEP válido.' } });
    expect(lookup).not.toHaveBeenCalled();
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it('expõe somente os campos normalizados pela rota', async () => {
    const get = createCepGetHandler({
      lookup: async () => ({ street: 'Rua A', neighborhood: 'Centro', city: 'Recife', state: 'PE', ignored: 'secret' }) as never,
    });

    const response = await get(new Request('https://damazio.example/api/cep/50000000'), {
      params: Promise.resolve({ postalCode: '50000000' }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ street: 'Rua A', neighborhood: 'Centro', city: 'Recife', state: 'PE' });
    expect(response.headers.get('cache-control')).toBe('no-store');
  });
});
