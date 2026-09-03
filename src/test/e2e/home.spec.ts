import { expect, test } from '@playwright/test';

test('a página inicial móvel oferece CTA consultivo e links institucionais com rotas futuras', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('button', { name: 'Abrir menu de navegação' })).toBeVisible();
  await expect(page.getByRole('main')).toBeVisible();
  await expect(page.locator('.hero').getByRole('link', { name: 'Solicitar orçamento' })).toHaveAttribute('href', '/catalogo');
  await expect(page.getByRole('link', { name: 'Entrega' })).toHaveAttribute('href', '/envio-nacional');
  await expect(page.getByRole('link', { name: 'Perguntas frequentes' })).toHaveAttribute('href', '/perguntas-frequentes');
  await expect(page.getByRole('link', { name: 'Privacidade' })).toHaveAttribute('href', '/privacidade');
  await expect(page.getByRole('link', { name: 'Termos de uso' })).toHaveAttribute('href', '/termos');
});

test('o menu móvel alterna o nome acessível e mantém alvos de toque utilizáveis', async ({ page }) => {
  await page.goto('/');

  const menuControl = page.getByRole('button', { name: 'Abrir menu de navegação' });
  await menuControl.click();
  await expect(page.getByRole('button', { name: 'Fechar menu de navegação' })).toHaveAttribute('aria-expanded', 'true');

  const catalogLink = page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: 'Catálogo' });
  const privacyLink = page.locator('footer').getByRole('link', { name: 'Privacidade' });
  await expect(catalogLink).toHaveCSS('min-height', '44px');
  await expect(privacyLink).toHaveCSS('min-height', '44px');
});

test('a etiqueta visual usa o dourado antigo do atelier', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('.hero .eyebrow')).toHaveCSS('color', 'rgb(154, 123, 52)');
});
