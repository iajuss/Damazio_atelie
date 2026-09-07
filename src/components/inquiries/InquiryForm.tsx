'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import type { CatalogProduct } from '@/features/catalog/types';
import type { InquiryKind, InquiryResult } from '@/features/inquiries/types';
import { CustomizationInput } from './CustomizationInput';
import { InquiryConfirmation } from './InquiryConfirmation';
import { ReferenceUpload } from './ReferenceUpload';
import { ErrorSummary } from '@/components/ui/ErrorSummary';
import { INSTAGRAM_PROFILE_URL } from '@/lib/site';

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

  function fieldProps(name: 'name' | 'contact' | 'city' | 'state' | 'occasion' | 'description') {
    const error = errors[name];
    return { 'aria-invalid': Boolean(error), 'aria-describedby': error ? inputErrorId(name) : undefined };
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const submittedValues = {
      name: formText(formData, 'name'), contact: formText(formData, 'contact'), city: formText(formData, 'city'), state: formText(formData, 'state'),
      occasion: formText(formData, 'occasion'), description: formText(formData, 'description'), privacyAccepted: formData.has('privacyAccepted'),
      answers: Object.fromEntries(fields.map((field) => [field.key, formText(formData, `answers.${field.key}`)])),
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
    data.set('contact', submittedValues.contact);
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
      <div className="inquiry-field"><label htmlFor="contact">Contato *</label><input id="contact" name="contact" type="text" autoComplete="email" {...fieldProps('contact')} />{errors.contact ? <p id={inputErrorId('contact')} className="inquiry-field__error">{errors.contact}</p> : null}</div>
      <div className="inquiry-field"><label htmlFor="city">Cidade *</label><input id="city" name="city" type="text" {...fieldProps('city')} />{errors.city ? <p id={inputErrorId('city')} className="inquiry-field__error">{errors.city}</p> : null}</div>
      <div className="inquiry-field"><label htmlFor="state">Estado (UF) *</label><input id="state" name="state" type="text" inputMode="text" maxLength={2} {...fieldProps('state')} />{errors.state ? <p id={inputErrorId('state')} className="inquiry-field__error">{errors.state}</p> : null}</div>
    </div>
    {fields.length > 0 ? <fieldset className="inquiry-form__customization"><legend>Personalize sua peça</legend>{fields.map((field) => <CustomizationInput key={field.key} field={field} error={errors[`answers.${field.key}`]} />)}</fieldset> : null}
    <div className="inquiry-field"><label htmlFor="occasion">Ocasião ou momento especial <span className="reference-upload__optional">(opcional)</span></label><input id="occasion" name="occasion" type="text" {...fieldProps('occasion')} />{errors.occasion ? <p id={inputErrorId('occasion')} className="inquiry-field__error">{errors.occasion}</p> : null}</div>
    <div className="inquiry-field"><label htmlFor="description">{requestKind === 'custom' ? 'Conte a sua ideia *' : <>Conte um pouco mais sobre sua ideia <span className="reference-upload__optional">(opcional)</span></>}</label><textarea id="description" name="description" rows={5} required={requestKind === 'custom'} {...fieldProps('description')} />{errors.description ? <p id={inputErrorId('description')} className="inquiry-field__error">{errors.description}</p> : null}</div>
    <ReferenceUpload files={files} isUploading={isSubmitting} error={errors.attachments} onAdd={(selected) => setFiles((current) => [...current, ...selected].slice(0, 3))} onRemove={(index) => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))} />
    <div className="inquiry-form__privacy"><div className="inquiry-form__privacy-copy"><input id="privacyAccepted" type="checkbox" name="privacyAccepted" aria-invalid={Boolean(errors.privacyAccepted)} aria-describedby={errors.privacyAccepted ? inputErrorId('privacyAccepted') : undefined} aria-labelledby="privacy-consent privacy-policy privacy-response" /><label id="privacy-consent" htmlFor="privacyAccepted">Li e aceito a </label><Link id="privacy-policy" href="/privacidade">política de privacidade</Link><span id="privacy-response"> para que a Damazio Atelier responda a esta solicitação.</span></div>{errors.privacyAccepted ? <p id={inputErrorId('privacyAccepted')} className="inquiry-field__error">{errors.privacyAccepted}</p> : null}</div>
    <div className="inquiry-form__actions">
      <button type="submit" className="button button--primary inquiry-form__submit" disabled={isSubmitting}>{isSubmitting ? 'Enviando solicitação…' : 'Enviar solicitação'}</button>
      <a className="button button--secondary" href={INSTAGRAM_PROFILE_URL} target="_blank" rel="noreferrer">Continuar pelo Direct</a>
    </div>
  </form>;
}
