import { expect, test } from '@playwright/test';

test('a jornada vai da home à linha, produto e destino futuro de solicitação', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Conheça o catálogo' }).click();
  await expect(page).toHaveURL(/\/catalogo$/);

  await page.getByRole('link', { name: 'Ver peças da linha Bordados em roupas' }).click();
  await expect(page).toHaveURL(/\/catalogo\/bordados-em-roupas$/);

  await page.getByRole('link', { name: 'Ver detalhes de Camisa bordada' }).click();
  await expect(page).toHaveURL(/\/produtos\/camisa-bordada$/);
  await expect(page.getByRole('link', { name: 'Solicitar orçamento' })).toHaveAttribute(
    'href',
    '/solicitar-orcamento/camisa-bordada',
  );
});

test('o catálogo consultivo não exibe preço, compra ou carrinho', async ({ page }) => {
  await page.goto('/produtos/camisa-bordada');

  await expect(page.getByText(/R\$|preço|comprar|carrinho/i)).toHaveCount(0);
});

test('slugs inexistentes retornam 404', async ({ page }) => {
  const missingProduct = await page.goto('/produtos/nao-existe');
  expect(missingProduct?.status()).toBe(404);

  const missingLine = await page.goto('/catalogo/nao-existe');
  expect(missingLine?.status()).toBe(404);
});

test('um slug de produto não publicado não fica disponível publicamente', async ({ page }) => {
  const unpublishedProduct = await page.goto('/produtos/rascunho');

  expect(unpublishedProduct?.status()).toBe(404);
});

test('a página do produto não cria overflow horizontal em 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto('/produtos/camisa-bordada');

  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
