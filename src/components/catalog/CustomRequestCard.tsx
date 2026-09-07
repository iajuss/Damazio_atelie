import Link from 'next/link';

export function CustomRequestCard() {
  return <article className="custom-request-card"><Link className="custom-request-card__link" href="/solicitar-orcamento"><p className="eyebrow">Sem inspiração em mente?</p><h3>Crie a sua peça</h3><p>Conte a ideia que você quer transformar em uma criação com a Damazio.</p><span className="custom-request-card__cta">Criar a sua peça <span aria-hidden="true">→</span></span></Link></article>;
}
