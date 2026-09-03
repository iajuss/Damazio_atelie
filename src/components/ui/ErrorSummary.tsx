'use client';

import { useEffect, useRef } from 'react';

type ErrorSummaryProps = { messages: string[] };

export function ErrorSummary({ messages }: ErrorSummaryProps) {
  const summaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    summaryRef.current?.focus();
  }, []);

  return <div className="inquiry-form__errors" ref={summaryRef} role="alert" tabIndex={-1}>
    <strong>Confira sua solicitação</strong>
    <ul>{messages.map((message) => <li key={message}>{message}</li>)}</ul>
  </div>;
}

