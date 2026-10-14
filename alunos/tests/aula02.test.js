const { test,expect } = require('@playwright/test');
async function preparar(page) {
  await page.goto('/#entrar');
  await expect(page.locator('#view-login')).toBeVisible();
  await page.getByTestId('login-email').fill('cliente-a@loja.test');
  await page.getByTestId('login-password').fill('SenhaDidatica123!');
  await page.locator('#login-form').getByRole('button',{name:'Entrar',exact:true}).click();
  await expect(page).toHaveURL(/#catalogo$/);
  const adicionar = page.locator('[data-testid="add-to-cart"][data-product-id="produto-teste"]');
  await adicionar.click();
  await adicionar.click();
  await page.getByTestId('nav-cart').click();
  await expect(page.getByTestId('cart-subtotal')).toContainText('300,00');
  for (const [campo,valor] of Object.entries({street:'Rua Teste',number:'10',district:'Centro',city:'Maricá',state:'RJ',zip:'24900000'})) {
    await page.getByTestId('addr-'+campo).fill(valor);
  }
}

test('sistema: jornada de compra e histórico após recarregar', async ({page}) => {
  await preparar(page);
  const resposta = page.waitForResponse(r => r.url().endsWith('/api/checkout') && r.request().method()==='POST');
  await page.getByTestId('checkout-button').click();
  const r = await resposta;
  expect(r.status()).toBe(201);
  const {order} = await r.json();
  await expect(page.getByTestId('receipt')).toContainText(order.id);
  await page.getByRole('link',{name:'Pedidos',exact:true}).click();
  await page.reload();
  await expect(page.locator('#view-orders')).toBeVisible();
  await expect(page.getByTestId('orders-list').getByRole('heading',{name:order.id,exact:true})).toBeVisible();
});