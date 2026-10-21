const test = require('node:test');
const assert = require('node:assert/strict');
const { evaluateCoupon } = require('../src/domain/coupon');
const { quoteLines } = require('../src/domain/pricing');
const { setClock, resetClock, REFERENCE_INSTANT } = require('../src/domain/clock');

const cupom = (extra = {}) => ({code:'TESTE', type:'percent', value:10, expiresAt:'2026-10-07', active:true, ...extra});
function comRelogio(instante, fn) {
  setClock(instante);
  try { return fn(); } finally { resetClock(); }      // desfaz o relógio mesmo se a asserção falhar
}
const cotar = (coupon) => quoteLines({lines:[{productId:'produto-teste', name:'Produto Teste', unitPrice:150, quantity:2}], coupon});

test('desafio: cupom com validade HOJE ainda vale à tarde (fim do dia)', () => {
  comRelogio('2026-10-07T20:00:00Z', () => assert.equal(evaluateCoupon(cupom()).ok, true));
});
test('desafio: cupom vale no último segundo do dia informado (23:59:59 em Brasília)', () => {
  comRelogio('2026-10-08T02:59:59Z', () => assert.equal(evaluateCoupon(cupom()).ok, true));
});
test('desafio: cupom vence no primeiro instante do dia seguinte (00:00 em Brasília)', () => {
  comRelogio('2026-10-08T03:00:00Z', () => assert.equal(evaluateCoupon(cupom()).ok, false));
});
test('desafio funcional: cotação com cupom vencido é recusada', () => {
  comRelogio(REFERENCE_INSTANT, () => {
    const r = cotar(cupom({expiresAt:'2026-10-06T23:59:59Z'}));
    assert.equal(r.ok, false);
  });
});
test('desafio: cupom de valor fixo maior que o subtotal é limitado ao subtotal (RN-05)', () => {
  const r = comRelogio(REFERENCE_INSTANT, () => cotar(cupom({type:'fixed', value:500, expiresAt:'2099-12-31'})));
  assert.equal(r.ok, true);
  assert.equal(r.subtotal, 300);
  assert.equal(r.couponDiscount, 300);     // 500 limitado ao subtotal
  assert.equal(r.discount, 300);           // maior que os 30 do desconto automático
  assert.equal(r.benefit, 'cupom');
  assert.equal(r.total, 0);                // 300 - 300 + frete 0 (subtotal 300)
});