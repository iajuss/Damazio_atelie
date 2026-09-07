import { expect, test } from '@playwright/test';

const institutionalPages = [
  ['/sobre', /feito à mão para guardar afeto/i],
  ['/como-funciona', /personalização feita em conversa/i],
  ['/envio-nacional', /envio para todo o brasil/i],
  ['/perguntas-frequentes', /perguntas frequentes/i],
  ['/contato', /fale com a damazio/i],
] as const;

for (const [path, heading] of institutionalPages) {
  test(`${path} tem metadata, um H1 e conteúdo principal`, async ({ page }) => {
    await page.goto(path);

    await expect(page).toHaveTitle(/Damazio Atelier/);
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: heading })).toHaveCount(1);
  });
}

test('a home apresenta as cinco linhas e FAQ sobre o envio nacional', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('.line-card')).toHaveCount(5);
  const faq = page.getByRole('region', { name: 'Perguntas frequentes' });
  const shippingQuestion = faq.getByText('Vocês enviam para todo o Brasil?');
  await expect(shippingQuestion).toBeVisible();
  await shippingQuestion.click();
  await expect(faq.getByText(/envio é combinado caso a caso/i)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Conheça o catálogo' })).toBeVisible();
});

test('a rota de entrega orienta a continuação no WhatsApp oficial', async ({ page }) => {
  await page.goto('/envio-nacional');

  await expect(page.getByRole('link', { name: 'Continuar no WhatsApp' })).toHaveAttribute('href', 'https://wa.me/5511910771179');
});

test('as três páginas informativas do rodapé usam o header marrom', async ({ page }) => {
  for (const path of ['/envio-nacional', '/perguntas-frequentes', '/privacidade']) {
    await page.goto(path);
    await expect(page.getByRole('banner')).toHaveCSS('background-color', 'rgb(47, 42, 39)');
  }
});

test('o contato oferece e-mail e WhatsApp', async ({ page }) => {
  await page.goto('/contato');
  await expect(page.getByRole('link', { name: 'Enviar e-mail para a Damazio' })).toHaveAttribute('href', 'mailto:damazioatelier@gmail.com');
  await expect(page.getByRole('link', { name: 'Abrir WhatsApp da Damazio' })).toHaveAttribute('href', 'https://wa.me/5511910771179');
});

test('a política explica a notificação operacional pelo Gmail', async ({ page }) => {
  await page.goto('/privacidade');

  await expect(page.getByText(/podem ser transmitidos ao Gmail somente/i)).toBeVisible();
  await expect(page.getByText(/pelo endereço damazioatelier@gmail\.com/i)).toBeVisible();
  await expect(page.getByText(/referências visuais.*não são anexadas/i)).toBeVisible();
});

test('o CTA do catálogo permanece visível em celular sem overflow horizontal', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/');

  await expect(page.getByRole('link', { name: 'Conheça o catálogo' })).toBeVisible();
  await expect(page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).resolves.toBe(true);
});
