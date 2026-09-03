'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import type { CatalogProduct } from '@/features/catalog/types';
import type { InquiryResult } from '@/features/inquiries/types';
import { CustomizationInput } from './CustomizationInput';
import { InquiryConfirmation } from './InquiryConfirmation';
import { ReferenceUpload } from './ReferenceUpload';

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
type InquiryFormProps = { product: CatalogProduct; fetcher?: Fetcher };
type FormValues = { name: string; contact: string; city: string; state: string; occasion: string; description: string; answers: Record<string, string>; privacyAccepted: boolean };

function initialValues(product: CatalogProduct): FormValues {
  return { name: '', contact: '', city: '', state: '', occasion: '', description: '', privacyAccepted: false, answers: Object.fromEntries(product.customizationFields.map((field) => [field.key, ''])) };
}

function inputErrorId(name: string): string { return `erro-${name.replace('.', '-')}`; }

export function InquiryForm({ product, fetcher = fetch }: InquiryFormProps) {
  const [values, setValues] = useState(() => initialValues(product));
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submissionError, setSubmissionError] = useState('');
  const [result, setResult] = useState<InquiryResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);
  const fields = [...product.customizationFields].sort((a, b) => a.sortOrder - b.sortOrder);

  useEffect(() => { if (Object.keys(errors).length > 0 || submissionError) summaryRef.current?.focus(); }, [errors, submissionError]);

  function update<K extends Exclude<keyof FormValues, 'answers'>>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function fieldProps(name: keyof Omit<FormValues, 'answers' | 'privacyAccepted'>) {
    const error = errors[name];
    return { 'aria-invalid': Boolean(error), 'aria-describedby': error ? inputErrorId(name) : undefined };
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!values.privacyAccepted) {
      setErrors({ privacyAccepted: 'É necessário aceitar a política de privacidade para enviar a solicitação.' });
      return;
    }
    setErrors({});
    setSubmissionError('');
    setIsSubmitting(true);
    const data = new FormData();
    data.set('productSlug', product.slug);
    data.set('name', values.name);
    data.set('contact', values.contact);
    data.set('city', values.city);
    data.set('state', values.state);
    data.set('occasion', values.occasion);
    data.set('description', values.description);
    data.set('answers', JSON.stringify(values.answers));
    data.set('privacyAccepted', 'true');
    data.set('website', '');
    files.forEach((file) => data.append('attachments', file));
    try {
      const response = await fetcher('/api/inquiries', { method: 'POST', body: data });
      const payload = await response.json() as InquiryResult | { error?: { message?: string; fields?: Record<string, string> } };
      if (!response.ok) {
        const apiError = 'error' in payload ? payload.error : undefined;
        setErrors(apiError?.fields ?? {});
        setSubmissionError(apiError?.message ?? 'Não foi possível enviar a solicitação. Tente novamente em instantes.');
        return;
      }
      setValues(initialValues(product));
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
    {summaryMessages.length > 0 ? <div className="inquiry-form__errors" ref={summaryRef} role="alert" tabIndex={-1}><strong>Confira sua solicitação</strong><ul>{summaryMessages.map((message) => <li key={message}>{message}</li>)}</ul></div> : null}
    <div className="inquiry-form__grid">
      <div className="inquiry-field"><label htmlFor="name">Seu nome *</label><input id="name" name="name" type="text" value={values.name} onChange={(event) => update('name', event.target.value)} {...fieldProps('name')} />{errors.name ? <p id={inputErrorId('name')} className="inquiry-field__error">{errors.name}</p> : null}</div>
      <div className="inquiry-field"><label htmlFor="contact">Contato *</label><input id="contact" name="contact" type="text" autoComplete="email" value={values.contact} onChange={(event) => update('contact', event.target.value)} {...fieldProps('contact')} />{errors.contact ? <p id={inputErrorId('contact')} className="inquiry-field__error">{errors.contact}</p> : null}</div>
      <div className="inquiry-field"><label htmlFor="city">Cidade *</label><input id="city" name="city" type="text" value={values.city} onChange={(event) => update('city', event.target.value)} {...fieldProps('city')} />{errors.city ? <p id={inputErrorId('city')} className="inquiry-field__error">{errors.city}</p> : null}</div>
      <div className="inquiry-field"><label htmlFor="state">Estado (UF) *</label><input id="state" name="state" type="text" inputMode="text" maxLength={2} value={values.state} onChange={(event) => update('state', event.target.value.toUpperCase())} {...fieldProps('state')} />{errors.state ? <p id={inputErrorId('state')} className="inquiry-field__error">{errors.state}</p> : null}</div>
    </div>
    {fields.length > 0 ? <fieldset className="inquiry-form__customization"><legend>Personalize sua peça</legend>{fields.map((field) => <CustomizationInput key={field.key} field={field} value={values.answers[field.key] ?? ''} error={errors[`answers.${field.key}`]} onChange={(answer) => setValues((current) => ({ ...current, answers: { ...current.answers, [field.key]: answer } }))} />)}</fieldset> : null}
    <div className="inquiry-field"><label htmlFor="occasion">Ocasião ou momento especial <span className="reference-upload__optional">(opcional)</span></label><input id="occasion" name="occasion" type="text" value={values.occasion} onChange={(event) => update('occasion', event.target.value)} {...fieldProps('occasion')} />{errors.occasion ? <p id={inputErrorId('occasion')} className="inquiry-field__error">{errors.occasion}</p> : null}</div>
    <div className="inquiry-field"><label htmlFor="description">Conte um pouco mais sobre sua ideia <span className="reference-upload__optional">(opcional)</span></label><textarea id="description" name="description" rows={5} value={values.description} onChange={(event) => update('description', event.target.value)} {...fieldProps('description')} />{errors.description ? <p id={inputErrorId('description')} className="inquiry-field__error">{errors.description}</p> : null}</div>
    <ReferenceUpload files={files} isUploading={isSubmitting} error={errors.attachments} onAdd={(selected) => setFiles((current) => [...current, ...selected].slice(0, 3))} onRemove={(index) => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))} />
    <div className="inquiry-form__privacy"><label><input type="checkbox" checked={values.privacyAccepted} onChange={(event) => update('privacyAccepted', event.target.checked)} aria-invalid={Boolean(errors.privacyAccepted)} aria-describedby={errors.privacyAccepted ? inputErrorId('privacyAccepted') : undefined} /> Li e aceito a política de privacidade para que a Damazio Atelier responda a esta solicitação.</label>{errors.privacyAccepted ? <p id={inputErrorId('privacyAccepted')} className="inquiry-field__error">{errors.privacyAccepted}</p> : null}</div>
    <button type="submit" className="button button--primary inquiry-form__submit" disabled={isSubmitting}>{isSubmitting ? 'Enviando solicitação…' : 'Enviar solicitação'}</button>
  </form>;
}
