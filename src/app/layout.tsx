import type { Metadata } from 'next';
import { Bodoni_Moda, DM_Sans } from 'next/font/google';
import '@/styles/globals.css';
import { SITE_NAME, SITE_URL } from '@/lib/site';
import { SkipLink } from '@/components/ui/SkipLink';
import { WhatsAppContactBubble } from '@/components/layout/WhatsAppContactBubble';

const displayFont = Bodoni_Moda({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const bodyFont = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: SITE_URL,
  title: SITE_NAME,
  description: 'Peças autorais para descobrir com calma.',
  icons: {
    icon: '/damazio-logo-transparent.png',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body className={`${displayFont.variable} ${bodyFont.variable}`}><SkipLink />{children}<WhatsAppContactBubble /></body></html>;
}
