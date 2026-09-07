import Image from 'next/image';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { INQUIRY_EMAIL_ADDRESS, INSTAGRAM_PROFILE_URL, SITE_NAME } from '@/lib/site';

const footerLinks = [
  { href: '/envio-nacional', label: 'Entrega' },
  { href: '/perguntas-frequentes', label: 'Perguntas frequentes' },
  { href: '/privacidade', label: 'Privacidade' },
  { href: '/termos', label: 'Termos de uso' },
];

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <Container className="footer-content">
        <Link className="footer-brand" href="/" aria-label={`Página inicial da ${SITE_NAME}`}>
          <Image src="/damazio-logo-transparent.png" alt="Logotipo Damazio Atelier" width={128} height={128} />
        </Link>
        <nav aria-label="Navegação complementar">
          {footerLinks.map((link) => <a href={link.href} key={link.href}>{link.label}</a>)}
          <a href={INSTAGRAM_PROFILE_URL} target="_blank" rel="noreferrer">Instagram</a>
          <a href={`mailto:${INQUIRY_EMAIL_ADDRESS}`}>{INQUIRY_EMAIL_ADDRESS}</a>
        </nav>
      </Container>
    </footer>
  );
}
