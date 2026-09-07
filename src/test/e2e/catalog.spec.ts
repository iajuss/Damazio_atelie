import { expect, test } from '@playwright/test';

test('a jornada vai da home à linha e ao pedido contextual da criação', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Conheça o catálogo' }).click();
  await expect(page).toHaveURL(/\/catalogo$/);

  await page.getByRole('link', { name: 'Ver peças da linha Bordados em roupas' }).click();
  await expect(page).toHaveURL(/\/catalogo\/bordados-em-roupas$/);

  await page.getByRole('link', { name: 'Solicitar sua camisa bordada' }).first().click();
  await expect(page).toHaveURL(/\/solicitar-orcamento\/camisa-bordada$/);
  await expect(page.getByRole('heading', { name: 'Solicite sua peça' })).toBeVisible();
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

test('a página do produto não cria overflow horizontal em 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto('/produtos/camisa-bordada');

  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('o catálogo apresenta somente as linhas e inclui a coleção de sousplats', async ({ page }) => {
  await page.goto('/catalogo');

  await expect(page.getByRole('heading', { name: 'Inspirações sob encomenda' })).toHaveCount(0);
  await expect(page.locator('.product-card')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Ver peças da linha Sousplats de crochê' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Linha Sousplats de crochê da Damazio Atelier' })).toHaveAttribute('src', /sousplat-rosa-croche\.jpeg/);
  await expect(page.getByRole('img', { name: 'Linha Presentes e embalagens da Damazio Atelier' })).toHaveAttribute('src', /presente-embalado\.jpeg/);
  await expect(page.locator('.line-card')).toHaveCount(5);
  await expect(page.getByRole('link', { name: 'Criar a sua peça' })).toHaveAttribute('href', '/solicitar-orcamento');
});

test('o catálogo aplica a jornada editorial em tela cheia e preserva a navegação por linhas', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/catalogo');

  const hero = page.locator('.catalog-hero');
  await expect(hero).toHaveCSS('background-color', 'rgb(47, 42, 39)');
  await expect(hero.getByRole('heading', { level: 1 })).toHaveCSS('color', 'rgb(255, 250, 242)');
  await expect(hero.getByRole('link', { name: 'Explorar linhas' })).toHaveAttribute('href', '#linhas-catalogo');
  await expect(page.locator('.catalog-lines')).toHaveCSS('background-color', 'rgb(251, 248, 243)');
  await expect(page.locator('.catalog-inspirations')).toHaveCount(0);

  const heights = await page.locator('[data-catalog-screen]').evaluateAll((sections) =>
    sections.map((section) => Math.round(section.getBoundingClientRect().height)),
  );
  expect(heights).toHaveLength(2);
  expect(heights.every((height) => height >= 768)).toBe(true);
});

test('o catálogo usa o header sobreposto da home e CTA terracota', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/catalogo');

  const header = page.getByRole('banner');
  const exploreLines = page.getByRole('link', { name: 'Explorar linhas' });

  await expect(header).toHaveClass(/site-header--overlay/);
  await expect(exploreLines).toHaveCSS('background-color', 'rgb(158, 96, 73)');
  await expect(exploreLines).toHaveCSS('color', 'rgb(255, 255, 255)');

  await page.evaluate(() => window.scrollTo(0, 120));
  await expect(header).toHaveClass(/site-header--scrolled/);
});

test('as áreas visuais do catálogo conduzem à linha e ao pedido contextual', async ({ page }) => {
  await page.goto('/catalogo');

  await page.locator('.line-card').first().locator('.line-card__image-wrap').click();
  await expect(page).toHaveURL(/\/catalogo\/bordados-em-roupas$/);

  await page.getByRole('link', { name: 'Solicitar sua camisa bordada' }).first().click();
  await expect(page).toHaveURL(/\/solicitar-orcamento\/camisa-bordada$/);
});

test('o catálogo editorial não cria overflow horizontal em 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto('/catalogo');

  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('o header funciona como atalho para as seções da home a partir de uma linha', async ({ page }) => {
  await page.goto('/catalogo/bolsas-de-croche');

  const header = page.getByRole('banner');
  await header.getByRole('button', { name: 'Abrir menu de navegação' }).click();
  await expect(header.getByRole('link', { name: /Damazio Atelier/i })).toHaveAttribute('href', '/#inicio');
  await expect(header.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/#inicio');
  await expect(header.getByRole('link', { name: 'Sobre' })).toHaveAttribute('href', '/#sobre');
  await expect(header.getByRole('link', { name: 'Como funciona' })).toHaveAttribute('href', '/#como-funciona');
  await expect(header.locator('.header-catalog-link')).toHaveAttribute('href', '/catalogo');
  await expect(header.getByRole('link', { name: 'Solicitar sua peça' })).toHaveAttribute('href', '/solicitar-orcamento');
});

test('a linha de sousplats e as novas camisetas têm galerias próprias', async ({ page }) => {
  await page.goto('/produtos/sousplat-de-croche');

  const sousplatGallery = page.getByRole('region', { name: 'Galeria de imagens de Sousplats de crochê' });
  await expect(sousplatGallery.getByAltText('Mesa posta com sousplats de crochê')).toBeVisible();
  await sousplatGallery.getByRole('button', { name: 'Próxima imagem' }).click();
  await expect(sousplatGallery.getByAltText('Sousplat branco de crochê com acabamento dourado')).toBeVisible();
  await sousplatGallery.getByRole('button', { name: 'Próxima imagem' }).click();
  await expect(sousplatGallery.getByAltText('Sousplat rosé de crochê com borda clara')).toBeVisible();

  await page.goto('/produtos/camisa-bordada');
  const shirtGallery = page.getByRole('region', { name: 'Galeria de imagens de Camisa bordada' });
  await shirtGallery.getByRole('button', { name: 'Próxima imagem' }).click();
  await expect(shirtGallery.getByAltText('Camiseta branca bordada com ilustração de família')).toBeVisible();
  await shirtGallery.getByRole('button', { name: 'Próxima imagem' }).click();
  await expect(shirtGallery.getByAltText('Camiseta bordada embalada para presente')).toBeVisible();
});

test('a página de cada linha preserva o padrão visual das seções do site', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/catalogo/sousplats-de-croche');

  await expect(page.getByRole('banner')).toHaveClass(/site-header--overlay/);
  await expect(page.getByRole('banner')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(page.locator('.catalog-line-hero')).toHaveCSS('background-color', 'rgb(47, 42, 39)');
  await expect(page.locator('.catalog-line-products')).toHaveCSS('background-color', 'rgb(243, 225, 223)');
  await expect(page.getByRole('link', { name: 'Ver modelos' })).toHaveAttribute('href', '#modelos');
  await expect(page.getByRole('heading', { name: 'Peças da linha' })).toBeVisible();
  await expect(page.locator('.line-example-card')).toHaveCount(3);
  await expect(page.getByRole('link', { name: 'Solicitar seus sousplats de crochê' })).toHaveCount(3);
  await expect(page.getByRole('link', { name: 'Solicitar seus sousplats de crochê' }).first()).toHaveAttribute('href', '/solicitar-orcamento/sousplat-de-croche');

  const heights = await page.locator('[data-catalog-line-screen]').evaluateAll((sections) =>
    sections.map((section) => Math.round(section.getBoundingClientRect().height)),
  );
  expect(heights).toHaveLength(2);
  expect(heights.every((height) => height >= 768)).toBe(true);
});

test('a abertura de uma linha distribui o conteúdo em duas colunas no desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/catalogo/bordados-em-roupas');

  const intro = page.locator('.catalog-line-hero__intro');
  const details = page.locator('.catalog-line-hero__details');

  await expect(details).toBeVisible();

  const [introBox, detailsBox] = await Promise.all([intro.boundingBox(), details.boundingBox()]);
  expect(introBox).not.toBeNull();
  expect(detailsBox).not.toBeNull();
  expect(detailsBox!.x).toBeGreaterThan(introBox!.x);
});

test('as fotos de blusas e toalhas priorizam a parte inferior da peça', async ({ page }) => {
  await page.goto('/catalogo/bordados-em-roupas');
  const shirts = page.locator('.line-example-card--bordados-em-roupas img');
  await expect(shirts).toHaveCount(3);
  await expect(shirts.first()).toHaveCSS('object-position', '50% 78%');

  await page.goto('/catalogo/enxovais-e-toalhas');
  const towels = page.locator('.line-example-card--enxovais-e-toalhas img');
  await expect(towels).toHaveCount(7);
  await expect(towels.first()).toHaveCSS('object-position', '50% 78%');
});

test('a galeria de bolsas preserva a peça inteira ao navegar pelas amostras', async ({ page }) => {
  await page.goto('/produtos/bolsa-de-croche');

  const gallery = page.getByRole('region', { name: 'Galeria de imagens de Bolsa de crochê' });
  await expect(gallery.getByAltText('Bolsa bege de crochê artesanal da Damazio Atelier')).toHaveCSS('object-fit', 'contain');
  await gallery.getByRole('button', { name: 'Próxima imagem' }).click();
  await expect(gallery.getByAltText('Bolsa marrom de crochê com ferragens douradas')).toBeVisible();
});
