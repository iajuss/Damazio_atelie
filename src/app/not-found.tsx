import type { Metadata } from 'next';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';

export const metadata: Metadata = {
  title: 'Página não encontrada | Damazio Atelier',
  description: 'A página procurada não está disponível.',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return <main id="conteudo" className="not-found-page" tabIndex={-1}><section className="institutional-hero"><Container><p className="eyebrow">Caminho não encontrado</p><h1>Página não encontrada</h1><p>Esta página não está disponível. Você pode voltar ao catálogo para encontrar uma nova inspiração.</p><Button href="/catalogo">Voltar ao catálogo</Button></Container></section></main>;
}

