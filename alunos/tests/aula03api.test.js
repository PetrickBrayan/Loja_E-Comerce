const test = require('node:test');
const assert = require('node:assert/strict');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:3000';
async function cotar(couponCode) {
  const r = await fetch(BASE + '/api/cart/quote', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({items:[{productId:'produto-teste', quantity:1}], couponCode})
  });
  return {status:r.status, data:await r.json()};
}
test('desafio API: cupom inexistente é recusado', async () => {
  const r = await cotar('NAOEXISTE');
  assert.equal(r.status, 400);
  assert.ok(r.data.error, 'deve trazer mensagem de erro');
});
test('desafio API: cupom vencido da base (ANTIGO, validade 06/10/2026) é recusado', async () => {
  assert.ok(Date.now() > Date.parse('2026-10-08T03:00:00Z'), 'Pré-condição: o relógio do computador deve estar depois de 07/10/2026');
  const r = await cotar('ANTIGO');
  assert.equal(r.status, 400, 'o cupom ANTIGO venceu em 06/10/2026');
});