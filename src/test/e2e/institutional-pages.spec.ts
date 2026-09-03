import { expect, test } from '@playwright/test';

const institutionalPages = [
  ['/sobre', /feito à mão para guardar afeto/i],
  ['/como-funciona', /personalização feita em conversa/i],
  ['/envio-nacional', /envio para todo o brasil/i],
  ['/perguntas-frequentes', /perguntas frequentes/i],
  ['/contato', /contato pelo instagram/i],
] as const;

for (const [path, heading] of institutionalPages) {
  test(`${path} tem metadata, um H1 e conteúdo principal`, async ({ page }) => {
    await page.goto(path);

    await expect(page).toHaveTitle(/Damazio Atelier/);
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: heading })).toHaveCount(1);
  });
}

test('a home apresenta as quatro linhas e a mensagem de envio nacional', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('.line-card')).toHaveCount(4);
  await expect(page.getByText('Envio para todo o Brasil')).toBeVisible();
  await expect(page.getByText(/frete e prazo são alinhados caso a caso no Direct/i)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Conheça o catálogo' })).toBeVisible();
});

test('a rota de entrega orienta a continuação no Direct oficial', async ({ page }) => {
  await page.goto('/envio-nacional');

  await expect(page.getByRole('link', { name: 'Continuar no Direct' })).toHaveAttribute('href', 'https://www.instagram.com/damazio.atelier/');
});

test('o CTA do catálogo permanece visível em celular sem overflow horizontal', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/');

  await expect(page.getByRole('link', { name: 'Conheça o catálogo' })).toBeVisible();
  await expect(page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).resolves.toBe(true);
});
