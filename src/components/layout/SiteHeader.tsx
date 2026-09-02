'use client';

import { useState } from 'react';
import Image from 'next/image';
import { SITE_NAME } from '@/lib/site';
import { Container } from '@/components/ui/Container';

const navigation = [
  { href: '#catalogo', label: 'Catálogo' },
  { href: '#sobre', label: 'Sobre' },
  { href: '#como-funciona', label: 'Como funciona' },
];

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="site-header">
      <Container className="header-content">
        <a className="brand" href="#conteudo" aria-label={`${SITE_NAME}, ir ao conteúdo`}>
          <Image src="/damazio-logo.jpeg" alt="Logotipo Damazio Atelier" width={96} height={96} priority />
          <span>{SITE_NAME}</span>
        </a>
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
      </Container>
    </header>
  );
}
