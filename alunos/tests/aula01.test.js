const test = require('node:test');
const assert = require('node:assert/strict');
const { automaticDiscount } = require('../src/domain/discount');
const { validateQuantity } = require('../src/domain/quantity');
const { quoteLines } = require('../src/domain/pricing');
const { percentOf } = require('../src/domain/money');
function cotar(preco, quantidade = 1) {
  return quoteLines({lines:[{productId:'produto-teste',name:'Produto Teste',unitPrice:preco,quantity:quantidade}]});
}
test('unitário: abaixo de 200 não há desconto', () => {
  assert.equal(automaticDiscount(199.99), 0);
});
test('unitário: exatamente 200 recebe 10%', () => {
  assert.equal(automaticDiscount(200), 20);
});
test('unitário: quantidade negativa é inválida', () => {
  assert.equal(validateQuantity(-1).ok, false);
});
test('unitário: meio centavo arredonda para cima', () => {
  assert.equal(percentOf(200.05,10), 20.01);
});
test('funcional: compra de 300 tem desconto e frete grátis', () => {
  const r = cotar(150,2);
  assert.equal(r.ok,true);
  assert.equal(r.subtotal,300);
  assert.equal(r.discount,30);
  assert.equal(r.shipping,0);
  assert.equal(r.total,270);
});
test('funcional: abaixo de 300 frete custa 18,50', () => {
  const r = cotar(100);
  assert.equal(r.ok,true);
  assert.equal(r.shipping,18.5);
  assert.equal(r.total,118.5);
});