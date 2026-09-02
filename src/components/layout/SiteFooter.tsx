import { Container } from '@/components/ui/Container';
import { INSTAGRAM_PROFILE_URL, SITE_NAME } from '@/lib/site';

const footerLinks = [
  { href: '#entrega', label: 'Entrega' },
  { href: '#perguntas-frequentes', label: 'Perguntas frequentes' },
  { href: '#privacidade', label: 'Privacidade' },
  { href: '#termos', label: 'Termos de uso' },
];

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <Container className="footer-content">
        <p>{SITE_NAME}</p>
        <nav aria-label="Navegação complementar">
          {footerLinks.map((link) => <a href={link.href} key={link.href}>{link.label}</a>)}
          <a href={INSTAGRAM_PROFILE_URL} target="_blank" rel="noreferrer">Instagram</a>
        </nav>
      </Container>
    </footer>
  );
}
