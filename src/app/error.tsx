'use client';

import Link from 'next/link';

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ reset }: ErrorPageProps) {
  return <main id="conteudo" tabIndex={-1}><section className="institutional-hero"><div className="container"><p className="eyebrow">Vamos tentar de novo</p><h1>Não foi possível abrir esta página</h1><p>Ocorreu um problema inesperado. Tente novamente ou volte ao catálogo para continuar conhecendo as criações.</p><div className="error-actions"><button className="button button--primary" type="button" onClick={reset}>Tentar novamente</button><Link className="button button--secondary" href="/catalogo">Ir ao catálogo</Link></div></div></section></main>;
}
