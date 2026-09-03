'use client';

export function SkipLink() {
  return <a className="skip-link" href="#conteudo" onClick={() => document.getElementById('conteudo')?.focus()}>Pular para o conteúdo principal</a>;
}
