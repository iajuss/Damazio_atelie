import { expect, test } from '@playwright/test';

const configuredBaseUrl = process.env.LAUNCH_SMOKE_BASE_URL?.trim();
const launchBaseUrl = configuredBaseUrl ?? 'https://staging-indisponivel.damazio.invalid';
const productSlug = process.env.LAUNCH_SMOKE_PRODUCT_SLUG?.trim();
const officialWhatsAppUrl = 'https://wa.me/5511910771179';
const smokeSupabaseUrl = process.env.LAUNCH_SMOKE_SUPABASE_URL?.trim();
const smokeSupabaseAnonKey = process.env.LAUNCH_SMOKE_SUPABASE_ANON_KEY?.trim();
const remoteSmokeEnabled = Boolean(
  configuredBaseUrl
  && process.env.LAUNCH_SMOKE_TARGET === 'staging'
  && process.env.LAUNCH_SMOKE_CONFIRM_URL === configuredBaseUrl
  && process.env.LAUNCH_SMOKE_ALLOW_REMOTE_STAGING === 'true',
);

function launchUrl(path: string): string {
  return new URL(path, launchBaseUrl).toString();
}

function requiredProductSlug(): string {
  expect(productSlug, 'Defina LAUNCH_SMOKE_PRODUCT_SLUG com um produto aprovado e publicado.').toBeTruthy();
  return productSlug as string;
}

async function fillRequiredFields(page: import('@playwright/test').Page) {
  await page.getByRole('textbox', { name: /seu nome/i }).fill('Ensaio operacional Damazio');
  await page.getByRole('textbox', { name: /contato/i }).fill('operacao@example.invalid');
  await page.getByRole('textbox', { name: /cidade/i }).fill('São Paulo');
  await page.getByRole('textbox', { name: /estado/i }).fill('SP');
  await page.getByRole('checkbox', { name: /política de privacidade/i }).check();

  const customizationFields = page.locator('[name^="answers."][required]');
  for (let index = 0; index < await customizationFields.count(); index += 1) {
    const field = customizationFields.nth(index);
    if (await field.evaluate((element) => element.tagName === 'SELECT')) {
      await field.selectOption({ index: 1 });
    } else {
      await field.fill('Detalhe de ensaio operacional');
    }
  }
}

test.describe('smoke de lançamento em staging', () => {
  test.skip(!remoteSmokeEnabled, 'Defina uma URL de staging HTTPS e as confirmações explícitas antes de executar smoke remoto.');
  test.describe.configure({ mode: 'serial' });

  test('o staging usa HTTPS e responde', async ({ request }) => {
    expect(new URL(launchBaseUrl).protocol).toBe('https:');
    const response = await request.get(launchUrl('/'));
    expect(response.ok()).toBe(true);
  });

  test('o catálogo publica as quatro linhas aprovadas', async ({ page }) => {
    await page.goto(launchUrl('/catalogo'));

    for (const line of ['Bordados em roupas', 'Enxovais e toalhas', 'Bolsas de crochê', 'Presentes e embalagens']) {
      await expect(page.getByRole('heading', { name: line })).toBeVisible();
    }
    await expect(page.locator('.line-card')).toHaveCount(4);
  });

  test('um produto publicado conduz ao formulário consultivo', async ({ page }) => {
    const slug = requiredProductSlug();
    await page.goto(launchUrl(`/produtos/${slug}`));
    const requestLink = page.getByRole('link', { name: 'Solicitar orçamento' });
    await expect(requestLink).toHaveAttribute('href', `/solicitar-orcamento/${slug}`);
    await requestLink.click();
    await expect(page).toHaveURL(new RegExp(`/solicitar-orcamento/${slug}/?$`));
    await expect(page.getByRole('button', { name: 'Enviar solicitação' })).toBeVisible();
  });

  test('uma solicitação de ensaio retorna protocolo e leva ao WhatsApp oficial', async ({ page }) => {
    test.skip(process.env.LAUNCH_SMOKE_ALLOW_WRITE !== 'true', 'Requer autorização explícita para criar uma solicitação de ensaio em staging.');
    const slug = requiredProductSlug();
    await page.goto(launchUrl(`/solicitar-orcamento/${slug}`));
    await fillRequiredFields(page);
    await page.getByRole('button', { name: 'Enviar solicitação' }).click();

    await expect(page.getByRole('heading', { name: 'Solicitação enviada' })).toBeVisible();
    await expect(page.getByLabel('Código da solicitação')).toHaveText(/^[A-Z0-9]{8,32}$/);
    await expect(page.getByRole('link', { name: 'Abrir WhatsApp' })).toHaveAttribute('href', officialWhatsAppUrl);
  });

  test('a API não permite listar referências anonimamente', async ({ request }) => {
    test.skip(!smokeSupabaseUrl || !smokeSupabaseAnonKey, 'Defina a URL e a chave anônima de staging para verificar a política real do bucket privado.');
    const headers = { apikey: smokeSupabaseAnonKey as string, authorization: `Bearer ${smokeSupabaseAnonKey as string}` };
    const catalogResponse = await request.get(new URL('/rest/v1/product_lines?select=slug&limit=1', smokeSupabaseUrl).toString(), { headers });
    expect(catalogResponse.ok()).toBe(true);
    const response = await request.post(new URL('/storage/v1/object/list/inquiry-references', smokeSupabaseUrl).toString(), {
      headers: { ...headers, 'content-type': 'application/json' },
      data: { prefix: '', limit: 1 },
    });
    expect(response.ok()).toBe(false);
    expect([400, 401, 403]).toContain(response.status());
  });

  test('o destino público do WhatsApp é o canal oficial', async ({ page }) => {
    await page.goto(launchUrl('/contato'));
    await expect(page.getByRole('link', { name: 'Abrir WhatsApp da Damazio' })).toHaveAttribute('href', officialWhatsAppUrl);
  });

  test('o catálogo não oferece preço, compra, carrinho, checkout ou pagamento', async ({ page }) => {
    const slug = requiredProductSlug();
    await page.goto(launchUrl(`/produtos/${slug}`));
    await expect(page.getByText(/R\$|preço|comprar|carrinho|checkout|pagamento/i)).toHaveCount(0);
  });
});
