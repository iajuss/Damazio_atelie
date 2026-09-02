import { expect, test } from '@playwright/test';

test('a página inicial móvel oferece navegação e links institucionais', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('button', { name: 'Abrir menu de navegação' })).toBeVisible();
  await expect(page.getByRole('main')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Conheça o catálogo' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Privacidade' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Termos de uso' })).toBeVisible();
});
