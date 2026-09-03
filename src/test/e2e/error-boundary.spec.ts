import { expect, test } from '@playwright/test';

test('o error boundary oferece recuperação sem expor detalhes internos', async ({ page }) => {
  await page.goto('/erro-e2e');

  await expect(page.getByRole('heading', { level: 1, name: 'Não foi possível abrir esta página' })).toBeVisible();
  await expect(page.getByText('segredo-interno-e2e')).toHaveCount(0);
  const retry = page.getByRole('button', { name: 'Tentar novamente' });
  await expect(retry).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ir ao catálogo' })).toHaveAttribute('href', '/catalogo');

  await retry.click();
  await expect(page.getByRole('heading', { level: 1, name: 'Não foi possível abrir esta página' })).toBeVisible();
});
