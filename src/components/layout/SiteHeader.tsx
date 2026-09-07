'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SITE_NAME } from '@/lib/site';
import { Container } from '@/components/ui/Container';

const navigation = [
  { href: '/#inicio', label: 'Home' },
  { href: '/#sobre', label: 'Sobre' },
  { href: '/#como-funciona', label: 'Como funciona' },
];

const footerInformationRoutes = new Set(['/envio-nacional', '/perguntas-frequentes', '/privacidade']);

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const usesEditorialHero = pathname === '/' || pathname.startsWith('/catalogo');
  const isRequestRoute = pathname.startsWith('/solicitar-orcamento');
  const isFooterInformationRoute = footerInformationRoutes.has(pathname);

  useEffect(() => {
    const updateScrollState = () => setIsScrolled(window.scrollY > 24);
    updateScrollState();
    window.addEventListener('scroll', updateScrollState, { passive: true });
    return () => window.removeEventListener('scroll', updateScrollState);
  }, []);

  const headerClassName = isRequestRoute
    ? 'site-header site-header--request'
    : isFooterInformationRoute
      ? 'site-header site-header--footer-info'
    : usesEditorialHero
      ? isScrolled ? 'site-header site-header--scrolled' : 'site-header site-header--overlay'
      : 'site-header site-header--standard';

  return (
    <header className={headerClassName}>
      <Container className="header-content">
        <Link className="brand" href="/#inicio" aria-label={`${SITE_NAME}, ir ao início`}>
          <Image src="/damazio-logo-transparent.png" alt="Logotipo Damazio Atelier" width={128} height={128} priority />
        </Link>
        <button
          className="menu-toggle"
          type="button"
          aria-label={isOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
          aria-expanded={isOpen}
          aria-controls="navegacao-principal"
          onClick={() => setIsOpen((open) => !open)}
        >
          Menu
        </button>
        <nav id="navegacao-principal" className={isOpen ? 'site-nav site-nav--open' : 'site-nav'} aria-label="Navegação principal">
          {navigation.map((item) => (
            <a href={item.href} key={item.href} onClick={() => setIsOpen(false)}>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="header-actions"><Link className="header-catalog-link" href="/catalogo">Ver catálogo</Link></div>
      </Container>
    </header>
  );
}
