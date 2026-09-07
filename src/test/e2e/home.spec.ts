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

  const homeLink = page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: 'Home' });
  const privacyLink = page.locator('footer').getByRole('link', { name: 'Privacidade' });
  await expect(homeLink).toHaveAttribute('href', '/#inicio');
  await expect(homeLink).toHaveCSS('min-height', '44px');
  await expect(privacyLink).toHaveCSS('min-height', '44px');
});

test('a home apresenta a história do atelier antes dos caminhos e do catálogo', async ({ page }) => {
  await page.goto('/');

  const aboutTop = await page.locator('#sobre').evaluate((section) => Math.round(section.getBoundingClientRect().top));
  const pathsTop = await page.locator('.interaction-paths').evaluate((section) => Math.round(section.getBoundingClientRect().top));
  const linesTop = await page.locator('#linhas').evaluate((section) => Math.round(section.getBoundingClientRect().top));

  expect(aboutTop).toBeLessThan(pathsTop);
  expect(pathsTop).toBeLessThan(linesTop);
});

test('a home móvel prioriza a marca visual, imagens, carrossel e FAQ', async ({ page }) => {
  await page.goto('/');

  const brand = page.getByRole('banner').getByRole('link', { name: /Damazio Atelier/i });
  await expect(brand.locator('span')).toHaveCount(0);
  await expect(brand.getByAltText('Logotipo Damazio Atelier')).toHaveCSS('width', '64px');
  await expect(page.locator('.hero__slide')).toHaveCount(3);
  await expect(page.getByAltText('Bolsa de crochê artesanal')).toBeVisible();
  await expect(page.locator('[data-home-screen]')).toHaveCount(7);

  const about = page.locator('#sobre');
  await expect(about).toHaveAttribute('aria-label', 'Sobre a Damazio Atelier');
  await expect(about.getByRole('heading', { name: 'O afeto encontra forma nos detalhes' })).toBeVisible();

  const carousel = page.getByRole('region', { name: 'Personalização com calma' });
  await expect(carousel).toBeVisible();
  await expect(carousel.getByRole('heading', { name: 'Escolha uma inspiração' })).toBeVisible();
  await carousel.getByRole('button', { name: 'Próxima etapa' }).click();
  await expect(carousel.getByRole('heading', { name: 'Conte sua ideia' })).toBeVisible();

  const faq = page.getByRole('region', { name: 'Perguntas frequentes' });
  await expect(faq.getByRole('heading', { name: 'Dúvidas que a gente esclarece' })).toBeVisible();
  await expect(faq.getByRole('button')).toHaveCount(4);
});

test('a home transforma os caminhos de criação em uma escolha interativa e evita a seção duplicada', async ({ page }) => {
  await page.goto('/');

  const paths = page.getByRole('region', { name: 'Quatro caminhos de interação' });
  await expect(paths.getByRole('tab', { name: 'Bordado afetivo' })).toBeVisible();
  await paths.getByRole('tab', { name: 'Bordado afetivo' }).click();
  await expect(paths.getByText(/um nome, uma data ou uma mensagem/i)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Inspirações para começar' })).toHaveCount(0);
});

test('a home combina logo transparente, hero em transição e FAQ expansível', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('banner').getByAltText('Logotipo Damazio Atelier')).toHaveAttribute('src', /damazio-logo-transparent\.png/);
  await expect(page.locator('.hero__slide')).toHaveCount(3);
  await expect(page.getByAltText('Bolsa de crochê artesanal')).toBeVisible();

  const faqQuestion = page.getByRole('button', { name: 'Vocês enviam para todo o Brasil?' });
  await expect(faqQuestion).toHaveAttribute('aria-expanded', 'false');
  await faqQuestion.click();
  await expect(faqQuestion).toHaveAttribute('aria-expanded', 'true');
});

test('a hero começa no topo e o header ganha superfície somente após a rolagem', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');

  const header = page.getByRole('banner');
  const hero = page.locator('.hero');

  await expect(header).toHaveClass(/site-header--overlay/);
  expect(await hero.evaluate((element) => Math.round(element.getBoundingClientRect().top))).toBe(0);
  expect(await hero.evaluate((element) => Math.round(element.getBoundingClientRect().height))).toBe(768);
  await expect(header.getByAltText('Logotipo Damazio Atelier')).toHaveCSS('width', '64px');

  await page.evaluate(() => window.scrollTo(0, 120));
  await expect(header).toHaveClass(/site-header--scrolled/);
  await expect(header).toHaveCSS('background-color', 'rgba(47, 42, 39, 0.92)');
  await expect(page.locator('.hero__slide').first()).toHaveCSS('object-position', '50% 72%');
});

test('a hero mantém ao menos uma foto visível durante as trocas da rotação', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('.hero__slide').first()).toHaveCSS('animation-timing-function', 'linear');

  const largestOpacity = () => page.locator('.hero__slide').evaluateAll((slides) =>
    Math.max(...slides.map((slide) => Number.parseFloat(getComputedStyle(slide).opacity))),
  );

  await page.waitForTimeout(5000);
  expect(await largestOpacity()).toBeGreaterThan(.5);
  await page.waitForTimeout(6000);
  expect(await largestOpacity()).toBeGreaterThan(.5);
  await page.waitForTimeout(6000);
  expect(await largestOpacity()).toBeGreaterThan(.5);
});

test('cada seção principal ocupa ao menos a altura útil da tela no notebook', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');

  const heights = await page.locator('[data-home-screen]').evaluateAll((sections) =>
    sections.map((section) => Math.round(section.getBoundingClientRect().height)),
  );

  expect(heights).toHaveLength(7);
  expect(heights.every((height) => height >= 768)).toBe(true);
});

test('a home não mantém a vitrine de cuidado em cada camada', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('.home-detail')).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Vitrine de detalhes do atelier' })).toHaveCount(0);
});

test('a faixa final mantém as amostras em movimento contínuo e pausa ao interagir', async ({ page }) => {
  await page.goto('/');

  const marquee = page.getByRole('region', { name: 'Amostras do atelier' });
  await expect(marquee.locator('img')).toHaveCount(26);
  await expect(marquee.locator('.product-marquee__track')).toHaveCSS('animation-name', 'product-marquee');
  await marquee.hover();
  await expect(marquee.locator('.product-marquee__track')).toHaveCSS('animation-play-state', 'paused');
});

test('a faixa final se integra ao fundo escuro do atelier', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');

  const marquee = page.getByRole('region', { name: 'Amostras do atelier' });

  await expect(marquee).toHaveCSS('background-color', 'rgb(47, 42, 39)');
});

test('a identidade usa a logo no rodapé e a tipografia editorial escolhida', async ({ page }) => {
  await page.goto('/');

  const footerLogo = page.getByRole('contentinfo').getByRole('link', { name: 'Página inicial da Damazio Atelier' });
  await expect(footerLogo.getByAltText('Logotipo Damazio Atelier')).toHaveAttribute('src', /damazio-logo-transparent\.png/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveCSS('font-family', /Bodoni Moda/i);
  await expect(page.locator('body')).toHaveCSS('font-family', /DM Sans/i);
});

test('as descrições das linhas começam alinhadas no grid de desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');

  const descriptionTops = await page.locator('#linhas .line-card__body > p').evaluateAll((descriptions) =>
    descriptions.map((description) => Math.round(description.getBoundingClientRect().top)),
  );

  expect(new Set(descriptionTops).size).toBe(1);
});

test('as fotos das linhas e do detalhe priorizam a parte inferior das peças', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');

  const lineImages = page.locator('#linhas .line-card__image');
  await expect(lineImages).toHaveCount(5);
  const focalPoints = ['50% 72%', '50% 78%', '50% 62%', '50% 78%', '50% 50%'];
  for (let index = 0; index < focalPoints.length; index += 1) {
    await expect(lineImages.nth(index)).toHaveCSS('object-position', focalPoints[index]!);
  }
});

test('a aba usa a logo oficial da Damazio', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('link[rel="icon"]').first()).toHaveAttribute('href', /damazio-logo-transparent\.png/);
});
