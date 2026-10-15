test('integração: última unidade zera o estoque', async () => {
  const token = await entrar('cliente-a@loja.test');
  const antes = await chamar('/api/products/produto-teste');
  assert.ok(antes.data.stock >= 1, 'Pré-condição: resetar a base (estoque zerado)');
  const compra = await chamar('/api/checkout', {method:'POST', token, body:{
    items:[{productId:'produto-teste', quantity: antes.data.stock}], address: endereco
  }});
  assert.equal(compra.status, 201);
  const depois = await chamar('/api/products/produto-teste');
  assert.equal(depois.data.stock, 0);
});