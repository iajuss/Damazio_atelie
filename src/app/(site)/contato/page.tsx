import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { INSTAGRAM_PROFILE_URL, publicPageMetadata } from '@/lib/site';

export const metadata = publicPageMetadata('Contato', 'Fale com a Damazio Atelier pelo Instagram.', '/contato');

export default function ContatoPage() {
  return <main id="conteudo" tabIndex={-1}><section className="institutional-hero"><Container><p className="eyebrow">Vamos conversar</p><h1>Contato pelo Instagram</h1><p>Para conversar sobre uma criação, fale com a Damazio pelo perfil oficial no Instagram. O atendimento acontece de forma humana, para entender cada ideia com o cuidado que ela pede.</p><Button href={INSTAGRAM_PROFILE_URL} target="_blank" rel="noreferrer">Abrir Instagram da Damazio</Button></Container></section></main>;
}
