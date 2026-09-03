'use client';

import { useState } from 'react';
import type { InquiryResult } from '@/features/inquiries/types';
import { buildInstagramProfileUrl } from '@/lib/instagram';

type InquiryConfirmationProps = { result: InquiryResult };

export function InquiryConfirmation({ result }: InquiryConfirmationProps) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    if (!navigator.clipboard?.writeText) return;
    try {
      await navigator.clipboard.writeText(result.requestCode);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return <section className="inquiry-confirmation" aria-labelledby="solicitacao-enviada">
    <p className="eyebrow">Próximo passo</p>
    <h1 id="solicitacao-enviada">Solicitação enviada</h1>
    <p>{result.message}</p>
    <p>Guarde este código para identificar sua conversa:</p>
    <p className="inquiry-confirmation__code" aria-label="Código da solicitação">{result.requestCode}</p>
    <button type="button" className="button button--secondary" onClick={copyCode}>Copiar código</button>
    {copied ? <p role="status">Código copiado.</p> : null}
    <p>O orçamento, o prazo e o frete serão confirmados no Direct.</p>
    <a className="button button--primary" href={buildInstagramProfileUrl()} target="_blank" rel="noreferrer">Abrir Instagram</a>
  </section>;
}
