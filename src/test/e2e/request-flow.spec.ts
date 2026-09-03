import { expect, test } from '@playwright/test';

async function fillRequiredFields(page: import('@playwright/test').Page) {
  await page.getByRole('textbox', { name: /seu nome/i }).fill('Ana');
  await page.getByRole('textbox', { name: /contato/i }).fill('ana@example.com');
  await page.getByRole('textbox', { name: /cidade/i }).fill('São Paulo');
  await page.getByRole('textbox', { name: /estado/i }).fill('SP');
  await page.getByRole('checkbox', { name: /política de privacidade/i }).check();
}

test('o formulário mantém a experiência consultiva em viewport de 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto('/solicitar-orcamento/camisa-bordada');

  await expect(page.getByRole('heading', { name: /solicite sua peça/i })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Enviar solicitação' })).toHaveCSS('min-height', '44px');
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect(page.getByText(/R\$|carrinho|checkout|pagamento/i)).toHaveCount(0);
});

test('sucesso revela o código, permite cópia e entrega ao Instagram oficial', async ({ page }) => {
  await page.route('**/api/inquiries', async (route) => {
    await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ requestCode: 'AB12CD34EF56GH78IJ90', message: 'Solicitação registrada com sucesso.' }) });
  });
  await page.goto('/solicitar-orcamento/camisa-bordada');
  await fillRequiredFields(page);
  await page.getByRole('button', { name: 'Enviar solicitação' }).click();

  await expect(page.getByRole('heading', { name: 'Solicitação enviada' })).toBeVisible();
  await expect(page.getByText('AB12CD34EF56GH78IJ90')).toBeVisible();
  await page.getByRole('button', { name: 'Copiar código' }).click();
  await expect(page.getByRole('status')).toHaveText('Código copiado.');
  await expect(page.getByRole('link', { name: 'Abrir Instagram' })).toHaveAttribute('href', 'https://www.instagram.com/damazio.atelier/');
});

test('erro de envio mantém os dados digitados e associa o feedback ao campo', async ({ page }) => {
  await page.route('**/api/inquiries', async (route) => {
    await route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: { message: 'Confira os campos informados.', fields: { name: 'Informe seu nome.' } } }) });
  });
  await page.goto('/solicitar-orcamento/camisa-bordada');
  await fillRequiredFields(page);
  await page.getByRole('button', { name: 'Enviar solicitação' }).click();

  await expect(page.locator('.inquiry-form__errors')).toBeFocused();
  await expect(page.getByRole('textbox', { name: /seu nome/i })).toHaveValue('Ana');
  await expect(page.getByRole('textbox', { name: /seu nome/i })).toHaveAttribute('aria-describedby', /erro-name/);
});

test('erro de upload preserva a referência selecionada para nova tentativa', async ({ page }) => {
  await page.route('**/api/inquiries', async (route) => {
    await route.fulfill({ status: 413, contentType: 'application/json', body: JSON.stringify({ error: { message: 'A referência excede o limite permitido.', fields: { attachments: 'Cada referência pode ter até 5 MB.' } } }) });
  });
  await page.goto('/solicitar-orcamento/camisa-bordada');
  await fillRequiredFields(page);
  await page.getByLabel(/adicionar referências/i).setInputFiles({ name: 'inspiracao.png', mimeType: 'image/png', buffer: Buffer.from('imagem') });
  await page.getByRole('button', { name: 'Enviar solicitação' }).click();

  await expect(page.locator('#erro-attachments')).toHaveText('Cada referência pode ter até 5 MB.');
  await expect(page.getByText('inspiracao.png')).toBeVisible();
});

test('uma rota de solicitação inexistente retorna 404', async ({ page }) => {
  const response = await page.goto('/solicitar-orcamento/nao-existe');

  expect(response?.status()).toBe(404);
});
