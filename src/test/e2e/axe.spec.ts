import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const auditedPaths = [
  '/',
  '/catalogo',
  '/produtos/camisa-bordada',
  '/solicitar-orcamento/camisa-bordada',
  '/privacidade',
  '/catalogo/nao-existe',
] as const;

for (const path of auditedPaths) {
  test(`${path} não apresenta violações axe`, async ({ page }) => {
    await page.goto(path);

    const results = await new AxeBuilder({ page }).analyze();

    expect(results.violations).toEqual([]);
  });
}

