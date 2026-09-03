import { expect, test } from '@playwright/test';

const pagesWithImages = ['/', '/catalogo', '/produtos/camisa-bordada'] as const;

test('o atalho de conteúdo pula para a região principal', async ({ page }) => {
  await page.goto('/');

  const skipLink = page.getByRole('link', { name: 'Pular para o conteúdo principal' });
  await skipLink.focus();
  await expect(skipLink).toBeFocused();
  await skipLink.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
});

test('imagens de conteúdo têm texto alternativo útil', async ({ page }) => {
  for (const path of pagesWithImages) {
    await page.goto(path);
    const images = page.locator('main img');
    const count = await images.count();

    expect(count).toBeGreaterThan(0);
    for (let index = 0; index < count; index += 1) {
      await expect(images.nth(index)).not.toHaveAttribute('alt', '');
    }
  }
});
