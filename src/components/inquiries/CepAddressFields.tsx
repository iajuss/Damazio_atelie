'use client';

import { useRef, useState } from 'react';

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
type AddressKey = 'postalCode' | 'street' | 'addressNumber' | 'complement' | 'neighborhood' | 'city' | 'state';
type AddressValues = Record<AddressKey, string>;

type CepAddressFieldsProps = {
  fetcher?: Fetcher;
  errors: Record<string, string>;
  fieldProps: (name: AddressKey) => Record<string, string | boolean | undefined>;
  inputErrorId: (name: string) => string;
};

const initialValues: AddressValues = {
  postalCode: '', street: '', addressNumber: '', complement: '', neighborhood: '', city: '', state: '',
};

function digits(value: string): string {
  return value.replace(/\D/g, '');
}

function formatCep(value: string): string {
  const normalized = digits(value).slice(0, 8);
  return normalized.length > 5 ? `${normalized.slice(0, 5)}-${normalized.slice(5)}` : normalized;
}

export function CepAddressFields({ fetcher = fetch, errors, fieldProps, inputErrorId }: CepAddressFieldsProps) {
  const [values, setValues] = useState<AddressValues>(initialValues);
  const [lookupError, setLookupError] = useState('');
  const postalCodeRevision = useRef(0);

  function changeField(name: AddressKey, value: string) {
    setValues((current) => ({ ...current, [name]: name === 'postalCode' ? formatCep(value) : value }));
  }

  async function lookup(postalCode: string, revision: number) {
    if (postalCode.length !== 8) return;
    setLookupError('');
    try {
      const response = await fetcher(`/api/cep/${postalCode}`);
      if (!response.ok) throw new Error('CEP lookup failed');
      const address = await response.json() as Partial<Pick<AddressValues, 'street' | 'neighborhood' | 'city' | 'state'>>;
      if (postalCodeRevision.current !== revision) return;
      setValues((current) => ({
        ...current,
        street: address.street || current.street,
        neighborhood: address.neighborhood || current.neighborhood,
        city: address.city || current.city,
        state: address.state || current.state,
      }));
    } catch {
      if (postalCodeRevision.current === revision) setLookupError('Não foi possível localizar o CEP agora. Preencha o endereço manualmente.');
    }
  }

  function field(name: AddressKey, label: React.ReactNode, options: { optional?: boolean; type?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']; maxLength?: number; autoComplete?: string } = {}) {
    const error = errors[name];
    const id = name;
    return <div className="inquiry-field" key={name}>
      <label htmlFor={id}>{label}{options.optional ? <span className="reference-upload__optional"> (opcional)</span> : ' *'}</label>
      <input id={id} name={name} type={options.type ?? 'text'} value={values[name]} onChange={(event) => {
        const value = event.target.value;
        changeField(name, value);
        if (name === 'postalCode') {
          postalCodeRevision.current += 1;
          void lookup(digits(value), postalCodeRevision.current);
        }
      }} inputMode={options.inputMode} maxLength={options.maxLength} autoComplete={options.autoComplete} required={!options.optional} {...fieldProps(name)} />
      {error ? <p id={inputErrorId(name)} className="inquiry-field__error">{error}</p> : null}
    </div>;
  }

  return <fieldset className="inquiry-form__address">
    <legend>Endereço para entrega</legend>
    <div className="inquiry-form__grid">
      {field('postalCode', 'CEP', { inputMode: 'numeric', maxLength: 9, autoComplete: 'postal-code' })}
      {field('street', 'Rua ou logradouro', { autoComplete: 'street-address' })}
      {field('addressNumber', 'Número', { inputMode: 'numeric', autoComplete: 'address-line2' })}
      {field('complement', 'Complemento', { optional: true, autoComplete: 'address-line2' })}
      {field('neighborhood', 'Bairro', { autoComplete: 'address-level3' })}
      {field('city', 'Cidade', { autoComplete: 'address-level2' })}
      {field('state', 'Estado (UF)', { maxLength: 2, autoComplete: 'address-level1' })}
    </div>
    {lookupError ? <p className="inquiry-field__help" role="status">{lookupError}</p> : null}
  </fieldset>;
}
