import Link from 'next/link';

export function CustomRequestCard() {
  return <article className="custom-request-card"><p className="eyebrow">Sem inspiração em mente?</p><h3>Crie a sua peça</h3><p>Conte a ideia que você quer transformar em uma criação com a Damazio.</p><Link href="/solicitar-orcamento">Criar a sua peça</Link></article>;
}
