import type { Metadata } from 'next';

export const SITE_NAME = 'Damazio Atelier';
export const INSTAGRAM_PROFILE_URL = 'https://www.instagram.com/damazio.atelier/';
export const INQUIRY_EMAIL_ADDRESS = 'damazioatelier@gmail.com';

const FALLBACK_SITE_URL = 'http://localhost:3000';

function siteUrlValue(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!configured) return FALLBACK_SITE_URL;

  try {
    const url = new URL(configured);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.origin : FALLBACK_SITE_URL;
  } catch {
    return FALLBACK_SITE_URL;
  }
}

export const SITE_URL = new URL(siteUrlValue());

export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

export function publicPageMetadata(title: string, description: string, path: string): Metadata {
  return {
    title: `${title} | ${SITE_NAME}`,
    description,
    alternates: { canonical: path },
  };
}
