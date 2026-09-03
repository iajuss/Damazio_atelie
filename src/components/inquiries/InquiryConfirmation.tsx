'use client';

import { useState, useSyncExternalStore } from 'react';
import type { InquiryResult } from '@/features/inquiries/types';
import { buildInstagramProfileUrl } from '@/lib/instagram';

type InquiryConfirmationProps = { result: InquiryResult };

function subscribeToClipboardSupport(): () => void { return () => {}; }

function clipboardSupport(): boolean {
  return typeof navigator !== 'undefined' && Boolean(navigator.clipboard?.writeText);
}

export function InquiryConfirmation({ result }: InquiryConfirmationProps) {
  const canCopy = useSyncExternalStore(subscribeToClipboardSupport, clipboardSupport, () => false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');

  async function copyCode() {
    if (!canCopy) return;
    try {
      await navigator.clipboard.writeText(result.requestCode);
      setCopyStatus('copied');
    } catch {
      setCopyStatus('failed');
    }
  }

  return <section className="inquiry-confirmation" aria-labelledby="solicitacao-enviada">
    <p className="eyebrow">Próximo passo</p>
    <h1 id="solicitacao-enviada">Solicitação enviada</h1>
    <p>{result.message}</p>
    <p>Guarde este código para identificar sua conversa:</p>
    <p className="inquiry-confirmation__code" aria-label="Código da solicitação">{result.requestCode}</p>
    <button type="button" className="button button--secondary" onClick={copyCode} disabled={!canCopy}>Copiar código</button>
    {!canCopy ? <p role="status">A cópia automática não está disponível neste navegador. Selecione o código acima para copiá-lo.</p> : null}
    {copyStatus === 'copied' ? <p role="status">Código copiado.</p> : null}
    {copyStatus === 'failed' ? <p role="status">Não foi possível copiar o código automaticamente. Selecione o código acima para copiá-lo.</p> : null}
    <p>O orçamento, o prazo e o frete serão confirmados no Direct.</p>
    <a className="button button--primary" href={buildInstagramProfileUrl()} target="_blank" rel="noreferrer">Abrir Instagram</a>
  </section>;
}
