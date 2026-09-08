export type CepAddress = {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
};

type ViaCepResponse = {
  logradouro?: unknown;
  bairro?: unknown;
  localidade?: unknown;
  uf?: unknown;
  erro?: unknown;
};

export type CepFetcher = (input: string, init: RequestInit) => Promise<Response>;

export class CepLookupError extends Error {
  readonly kind: 'invalid_postal_code' | 'lookup_failed';

  constructor(kind: CepLookupError['kind']) {
    super(kind);
    this.name = 'CepLookupError';
    this.kind = kind;
  }
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export async function lookupCep(postalCode: string, fetcher: CepFetcher = fetch): Promise<CepAddress> {
  const cep = postalCode.replace(/\D/g, '');
  if (cep.length !== 8) throw new CepLookupError('invalid_postal_code');

  let response: Response;
  try {
    response = await fetcher(`https://viacep.com.br/ws/${cep}/json/`, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(5_000),
    });
  } catch {
    throw new CepLookupError('lookup_failed');
  }

  if (!response.ok) throw new CepLookupError('lookup_failed');

  let data: ViaCepResponse;
  try {
    data = await response.json() as ViaCepResponse;
  } catch {
    throw new CepLookupError('lookup_failed');
  }

  if (data.erro === true) throw new CepLookupError('lookup_failed');

  return {
    street: text(data.logradouro),
    neighborhood: text(data.bairro),
    city: text(data.localidade),
    state: text(data.uf),
  };
}
