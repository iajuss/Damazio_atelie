import type { Metadata } from 'next';
import '@/styles/globals.css';
import { SITE_NAME, SITE_URL } from '@/lib/site';
import { SkipLink } from '@/components/ui/SkipLink';

export const metadata: Metadata = {
  metadataBase: SITE_URL,
  title: SITE_NAME,
  description: 'Peças autorais para descobrir com calma.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body><SkipLink />{children}</body></html>;
}
