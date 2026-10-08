const test = require('node:test');
const assert = require('node:assert/strict');
const { automaticDiscount } = require('../src/domain/discount');
const { validateQuantity } = require('../src/domain/quantity');
const { quoteLines } = require('../src/domain/pricing');
const { percentOf } = require('../src/domain/money');
const { shippingCost } = require('../src/domain/shipping');
function cotar(preco, quantidade = 1) {
  return quoteLines({lines:[{productId:'produto-teste',name:'Produto Teste',unitPrice:preco,quantity:quantidade}]});
}


test('RN-01 unitário: 200,01 recebe 10% (20,00 após half-up)', () => {
  assert.equal(automaticDiscount(200.01), 20);
});
test('RN-01 unitário: 200,00 recebe desconto (limite inclusivo "a partir de")', () => {
  assert.ok(automaticDiscount(200) > 0);
});

test('RN-02 unitário: frete em 299,99 custa 18,50', () => {
  assert.equal(shippingCost(299.99), 18.5);
});
test('RN-02 unitário: frete em 300,00 é zero', () => {
  assert.equal(shippingCost(300), 0);
});
test('RN-02 funcional: subtotal 299,99 -> desconto 30,00, frete 18,50, total 288,49', () => {
  const r = cotar(299.99);
  assert.equal(r.subtotal, 299.99);
  assert.equal(r.discount, 30);
  assert.equal(r.shipping, 18.5);
  assert.equal(r.total, 288.49);
});
test('RN-02 funcional: frete é calculado ANTES do desconto (subtotal 300 -> frete 0)', () => {
  assert.equal(cotar(300).shipping, 0);
});

test('RN-03 unitário: quantidade zero é inválida', () => {
  assert.equal(validateQuantity(0).ok, false);
});
test('RN-03 unitário: quantidade fracionária (1.5) é inválida', () => {
  assert.equal(validateQuantity(1.5).ok, false);
});
test('RN-03 unitário: quantidade positiva inteira é válida', () => {
  assert.equal(validateQuantity(3).ok, true);
});
test('RN-03 funcional: cotação com quantidade negativa é rejeitada', () => {
  assert.equal(cotar(100, -2).ok, false);
});

test('RN-06 unitário: 10% de 0,05 = 0,005 -> 0,01', () => {
  assert.equal(percentOf(0.05, 10), 0.01);
});
test('RN-06 unitário: 10% de 200,04 = 20,004 -> 20,00 (não sobe)', () => {
  assert.equal(percentOf(200.04, 10), 20);
});
test('RN-06 unitário: percentual com centavos (7,5% de 200,00 = 15,00)', () => {
  assert.equal(percentOf(200, 7.5), 15);
});
test('RN-06 funcional: subtotal 200,05 -> desconto 20,01 e total 198,54', () => {
  const r = cotar(200.05);
  assert.equal(r.discount, 20.01);
  assert.equal(r.total, 198.54); 
});