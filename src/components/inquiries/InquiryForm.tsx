'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import type { CatalogProduct } from '@/features/catalog/types';
import type { InquiryKind, InquiryResult } from '@/features/inquiries/types';
import { CustomizationInput } from './CustomizationInput';
import { InquiryConfirmation } from './InquiryConfirmation';
import { ReferenceUpload } from './ReferenceUpload';
import { CepAddressFields } from './CepAddressFields';
import { ErrorSummary } from '@/components/ui/ErrorSummary';
import { WHATSAPP_CONTACT_URL } from '@/lib/site';

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
type InquiryFormProps = { product?: CatalogProduct; requestKind?: InquiryKind; fetcher?: Fetcher };

function inputErrorId(name: string): string { return `erro-${name.replace('.', '-')}`; }

function formText(data: FormData, key: string): string {
  const value = data.get(key);
  return typeof value === 'string' ? value : '';
}

export function InquiryForm({ product, requestKind = 'product', fetcher = fetch }: InquiryFormProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submissionError, setSubmissionError] = useState('');
  const [result, setResult] = useState<InquiryResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fields = [...(product?.customizationFields ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);

  function fieldProps(name: string) {
    const error = errors[name];
    return { 'aria-invalid': Boolean(error), 'aria-describedby': error ? inputErrorId(name) : undefined };
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const submittedValues = {
      name: formText(formData, 'name'), email: formText(formData, 'email'), phone: formText(formData, 'phone'), postalCode: formText(formData, 'postalCode'), street: formText(formData, 'street'), addressNumber: formText(formData, 'addressNumber'), complement: formText(formData, 'complement'), neighborhood: formText(formData, 'neighborhood'), city: formText(formData, 'city'), state: formText(formData, 'state'),
      occasion: formText(formData, 'occasion'), description: formText(formData, 'description'), privacyAccepted: formData.has('privacyAccepted'),
      answers: Object.fromEntries(fields.map((field) => [field.key, formText(formData, `answers.${field.key}`)]).filter(([, value]) => value.trim().length > 0)),
    };
    const formFiles = formData.getAll('attachments').filter((item): item is File => item instanceof File && item.size > 0);
    const submittedFiles = formFiles.length > 0 ? formFiles : files;
    setFiles(submittedFiles);
    if (!submittedValues.privacyAccepted) {
      setErrors({ privacyAccepted: 'É necessário aceitar a política de privacidade para enviar a solicitação.' });
      return;
    }
    setErrors({});
    setSubmissionError('');
    setIsSubmitting(true);
    const data = new FormData();
    data.set('requestKind', requestKind);
    data.set('productSlug', product?.slug ?? '');
    data.set('name', submittedValues.name);
    data.set('email', submittedValues.email);
    data.set('phone', submittedValues.phone);
    data.set('postalCode', submittedValues.postalCode);
    data.set('street', submittedValues.street);
    data.set('addressNumber', submittedValues.addressNumber);
    data.set('complement', submittedValues.complement);
    data.set('neighborhood', submittedValues.neighborhood);
    data.set('city', submittedValues.city);
    data.set('state', submittedValues.state);
    data.set('occasion', submittedValues.occasion);
    data.set('description', submittedValues.description);
    data.set('answers', JSON.stringify(submittedValues.answers));
    data.set('privacyAccepted', 'true');
    data.set('website', '');
    submittedFiles.forEach((file) => data.append('attachments', file));
    try {
      const response = await fetcher('/api/inquiries', { method: 'POST', body: data });
      const payload = await response.json() as InquiryResult | { error?: { message?: string; fields?: Record<string, string> } };
      if (!response.ok) {
        const apiError = 'error' in payload ? payload.error : undefined;
        setErrors(apiError?.fields ?? {});
        setSubmissionError(apiError?.message ?? 'Não foi possível enviar a solicitação. Tente novamente em instantes.');
        return;
      }
      setFiles([]);
      setResult(payload as InquiryResult);
    } catch {
      setSubmissionError('Não foi possível enviar a solicitação. Tente novamente em instantes.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (result) return <InquiryConfirmation result={result} />;

  const summaryMessages = [...new Set([submissionError, ...Object.values(errors)].filter(Boolean))];
  return <form className="inquiry-form" noValidate onSubmit={submit}>
    <input className="sr-only" type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
    {summaryMessages.length > 0 ? <ErrorSummary messages={summaryMessages} /> : null}
    <div className="inquiry-form__grid">
      <div className="inquiry-field"><label htmlFor="name">Seu nome *</label><input id="name" name="name" type="text" {...fieldProps('name')} />{errors.name ? <p id={inputErrorId('name')} className="inquiry-field__error">{errors.name}</p> : null}</div>
      <div className="inquiry-field"><label htmlFor="email">E-mail *</label><input id="email" name="email" type="email" autoComplete="email" required {...fieldProps('email')} />{errors.email ? <p id={inputErrorId('email')} className="inquiry-field__error">{errors.email}</p> : null}</div>
      <div className="inquiry-field"><label htmlFor="phone">Telefone *</label><input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" required {...fieldProps('phone')} />{errors.phone ? <p id={inputErrorId('phone')} className="inquiry-field__error">{errors.phone}</p> : null}</div>
    </div>
    <CepAddressFields fetcher={fetcher} errors={errors} fieldProps={fieldProps} inputErrorId={inputErrorId} />
    {fields.length > 0 ? <fieldset className="inquiry-form__customization"><legend>Personalize sua peça</legend>{fields.map((field) => <CustomizationInput key={field.key} field={field} error={errors[`answers.${field.key}`]} />)}</fieldset> : null}
    <div className="inquiry-field"><label htmlFor="occasion">Ocasião ou momento especial <span className="reference-upload__optional">(opcional)</span></label><input id="occasion" name="occasion" type="text" {...fieldProps('occasion')} />{errors.occasion ? <p id={inputErrorId('occasion')} className="inquiry-field__error">{errors.occasion}</p> : null}</div>
    <div className="inquiry-field"><label htmlFor="description">{requestKind === 'custom' ? 'Conte a sua ideia *' : <>Conte um pouco mais sobre sua ideia <span className="reference-upload__optional">(opcional)</span></>}</label><textarea id="description" name="description" rows={5} required={requestKind === 'custom'} {...fieldProps('description')} />{errors.description ? <p id={inputErrorId('description')} className="inquiry-field__error">{errors.description}</p> : null}</div>
    <ReferenceUpload files={files} isUploading={isSubmitting} error={errors.attachments} onAdd={(selected) => setFiles((current) => [...current, ...selected].slice(0, 3))} onRemove={(index) => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))} />
    <div className="inquiry-form__privacy"><div className="inquiry-form__privacy-copy"><input id="privacyAccepted" type="checkbox" name="privacyAccepted" aria-invalid={Boolean(errors.privacyAccepted)} aria-describedby={errors.privacyAccepted ? inputErrorId('privacyAccepted') : undefined} aria-labelledby="privacy-consent privacy-policy privacy-response" /><label id="privacy-consent" htmlFor="privacyAccepted">Li e aceito a </label><Link id="privacy-policy" href="/privacidade">política de privacidade</Link><span id="privacy-response"> para que a Damazio Atelier responda a esta solicitação.</span></div>{errors.privacyAccepted ? <p id={inputErrorId('privacyAccepted')} className="inquiry-field__error">{errors.privacyAccepted}</p> : null}</div>
    <div className="inquiry-form__actions">
      <button type="submit" className="button button--primary inquiry-form__submit" disabled={isSubmitting}>{isSubmitting ? 'Enviando solicitação…' : 'Enviar solicitação'}</button>
      <a className="button button--secondary" href={WHATSAPP_CONTACT_URL} target="_blank" rel="noreferrer">Continuar pelo WhatsApp</a>
    </div>
  </form>;
}
