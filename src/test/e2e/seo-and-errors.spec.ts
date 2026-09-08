import { expect, test } from '@playwright/test';

const publicPaths = [
  '/',
  '/catalogo',
  '/catalogo/bordados-em-roupas',
  '/produtos/camisa-bordada',
  '/solicitar-orcamento/camisa-bordada',
  '/sobre',
  '/como-funciona',
  '/envio-nacional',
  '/perguntas-frequentes',
  '/contato',
  '/privacidade',
  '/termos',
] as const;

test('o sitemap relaciona somente rotas públicas do atelier', async ({ request }) => {
  const response = await request.get('/sitemap.xml');

  expect(response.ok()).toBe(true);
  const sitemap = await response.text();
  expect(sitemap).toContain('http://localhost:3000/catalogo');
  expect(sitemap).toContain('http://localhost:3000/privacidade');
  expect(sitemap).not.toContain('/api/');
  expect(sitemap).not.toContain('inquiry-references');
});

test('robots protege as rotas de API e uploads privados', async ({ request }) => {
  const response = await request.get('/robots.txt');

  expect(response.ok()).toBe(true);
  const robots = await response.text();
  expect(robots).toContain('Disallow: /api/');
  expect(robots).toContain('Disallow: /storage/v1/object/private/');
  expect(robots).toContain('Sitemap: http://localhost:3000/sitemap.xml');
});

test('as páginas públicas emitem headers de segurança', async ({ request }) => {
  const response = await request.get('/');
  const headers = response.headers();

  expect(headers['strict-transport-security']).toBe('max-age=63072000; includeSubDomains; preload');
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['x-frame-options']).toBe('DENY');
  expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  expect(headers['permissions-policy']).toBe('camera=(), geolocation=(), microphone=()');
  expect(headers['cross-origin-opener-policy']).toBe('same-origin');
  expect(headers['cross-origin-resource-policy']).toBe('same-origin');
  expect(headers['content-security-policy']).toContain("default-src 'self'");
  expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
});

test('a página não encontrada recupera a navegação pelo catálogo', async ({ page }) => {
  const response = await page.goto('/catalogo/nao-existe');

  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1, name: 'Página não encontrada' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Voltar ao catálogo' })).toHaveAttribute('href', '/catalogo');
});

test('as rotas públicas têm title, canonical e exatamente um H1', async ({ page }) => {
  for (const path of publicPaths) {
    await page.goto(path);
    await expect(page).toHaveTitle(/Damazio Atelier/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `http://localhost:3000${path === '/' ? '' : path}`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  }
});
