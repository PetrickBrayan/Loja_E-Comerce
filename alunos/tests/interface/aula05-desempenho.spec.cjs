// Aula 5 — Desempenho da interface (RNF-06, RNF-07, RNF-09, RNF-08), medido no navegador.
// Faz o que o roteiro pede no DevTools (aba Network): contar chamadas a /api/products e /api/orders.
// Antes de rodar: npm run reset e servidor ligado. Para gravar as medidas: defina FASE=antes ou FASE=depois.
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const FASE = process.env.FASE || 'medicao';
const medidas = {};
function registrar(chave, valor) {
  medidas[chave] = valor;
  console.log('MEDIDA', chave, '=', JSON.stringify(valor));
  const pasta = path.join(__dirname, '..', '..', 'evidencias');
  fs.mkdirSync(pasta, { recursive: true });
  fs.writeFileSync(path.join(pasta, `aula05-interface-${FASE}.json`), JSON.stringify(medidas, null, 2));
}
function contarGet(page, caminho) {
  const c = { n: 0 };
  page.on('request', (r) => {
    if (r.method() === 'GET' && new URL(r.url()).pathname === caminho) c.n += 1;
  });
  return c;
}
async function abrirCatalogo(page) {
  await page.goto('/#catalogo');
  await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible();
}

test('RNF-09: em repouso, a tela não repete chamadas a /api/products (janela de 10 s)', async ({ page }) => {
  await abrirCatalogo(page);
  const chamadas = contarGet(page, '/api/products');          // conta só a partir daqui (carga inicial já passou)
  await page.waitForTimeout(10000);
  registrar('ocioso_10s_GET_api_products', chamadas.n);
  expect(chamadas.n, 'a tela parada não deveria chamar a API').toBe(0);
});

test('RNF-06: digitar na busca não refaz a chamada nem reconstrói o catálogo a cada tecla', async ({ page }) => {
  await abrirCatalogo(page);
  await page.evaluate(() => {
    window.__cartoesCriados = 0;
    new MutationObserver((lista) => lista.forEach((m) => { window.__cartoesCriados += m.addedNodes.length; }))
      .observe(document.getElementById('catalog-grid'), { childList: true });
  });
  const chamadas = contarGet(page, '/api/products');
  await page.locator('#search').pressSequentially('item', { delay: 120 });   // 4 teclas
  await page.waitForTimeout(800);
  const criados = await page.evaluate(() => window.__cartoesCriados);
  const total = await page.locator('[data-testid="product-card"]').count();
  registrar('busca_4_teclas_GET_api_products', chamadas.n);
  registrar('busca_4_teclas_cartoes_criados_no_DOM', criados);
  registrar('catalogo_cartoes_no_DOM', total);
  expect(chamadas.n, 'a busca é feita no navegador: não precisa chamar a API').toBe(0);
  expect(criados, 'filtrar não deve recriar os cartões').toBe(0);
});

test('RNF-07: filtrar várias vezes e clicar em "Atualizar lista" uma vez provoca uma única chamada', async ({ page }) => {
  await abrirCatalogo(page);
  for (const indice of [1, 2, 0]) await page.selectOption('#category-filter', { index: indice });
  await page.waitForTimeout(500);
  const chamadas = contarGet(page, '/api/products');
  await page.locator('#refresh-catalog').click();
  await page.waitForTimeout(1500);
  registrar('um_clique_em_Atualizar_lista_GET_api_products', chamadas.n);
  expect(chamadas.n, 'um clique deve gerar uma chamada').toBe(1);
});

test('RNF-09/RNF-08: abrir o histórico faz uma chamada a /api/orders e lista os pedidos', async ({ page }) => {
  await page.goto('/#entrar');
  await page.getByTestId('login-email').fill('cliente-a@loja.test');
  await page.getByTestId('login-password').fill('SenhaDidatica123!');
  await page.locator('#login-form').getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page).toHaveURL(/#catalogo$/);
  const chamadas = contarGet(page, '/api/orders');
  const inicio = Date.now();
  await page.goto('/#pedidos');
  await expect(page.getByTestId('order-card').first()).toBeVisible({ timeout: 60000 });
  const tempoMs = Date.now() - inicio;
  await page.waitForTimeout(500);
  const pedidos = await page.getByTestId('order-card').count();
  registrar('historico_GET_api_orders', chamadas.n);
  registrar('historico_pedidos_listados', pedidos);
  registrar('historico_tempo_ate_primeiro_pedido_ms', tempoMs);
  expect(chamadas.n, 'abrir o histórico deve chamar a API uma vez').toBe(1);
});
