import type { Metadata } from 'next';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { INSTAGRAM_PROFILE_URL } from '@/lib/site';

export const metadata: Metadata = { title: 'Contato | Damazio Atelier', description: 'Fale com a Damazio Atelier pelo Instagram.' };

export default function ContatoPage() {
  return <main id="conteudo"><section className="institutional-hero"><Container><p className="eyebrow">Vamos conversar</p><h1>Contato pelo Instagram</h1><p>Para conversar sobre uma criação, fale com a Damazio pelo perfil oficial no Instagram. O atendimento acontece de forma humana, para entender cada ideia com o cuidado que ela pede.</p><Button href={INSTAGRAM_PROFILE_URL} target="_blank" rel="noreferrer">Abrir Instagram da Damazio</Button></Container></section></main>;
}
