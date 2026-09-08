import { CepLookupError, lookupCep } from '@/features/address/cep';

type CepGetHandlerDependencies = {
  lookup?: typeof lookupCep;
};

const responseHeaders = { 'cache-control': 'no-store' };

function errorResponse(status: 400 | 502, message: string): Response {
  return Response.json({ error: { message } }, { status, headers: responseHeaders });
}

export function createCepGetHandler(dependencies: CepGetHandlerDependencies = {}) {
  return async function get(_request: Request, context: { params: Promise<{ postalCode: string }> }): Promise<Response> {
    const { postalCode } = await context.params;
    if (postalCode.replace(/\D/g, '').length !== 8) return errorResponse(400, 'Informe um CEP válido.');

    try {
      const address = await (dependencies.lookup ?? lookupCep)(postalCode);
      return Response.json({
        street: address.street,
        neighborhood: address.neighborhood,
        city: address.city,
        state: address.state,
      }, { headers: responseHeaders });
    } catch (error) {
      if (error instanceof CepLookupError && error.kind === 'invalid_postal_code') {
        return errorResponse(400, 'Informe um CEP válido.');
      }
      return errorResponse(502, 'Não foi possível consultar o CEP. Tente novamente em instantes.');
    }
  };
}

export const GET = createCepGetHandler();
