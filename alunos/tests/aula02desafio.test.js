// Aula 2 — Desafios de integração (RN-03, RN-07, RN-08)
// Antes de rodar: npm run reset  (estoque do produto-teste = 5) e servidor ligado.
// A ordem dos testes importa: "última unidade" zera o estoque e por isso é o último.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:3000';

async function chamar(rota, {method='GET', body, token} = {}) {
  const r = await fetch(BASE + rota, {
    method, headers:{'Content-Type':'application/json', ...(token ? {Authorization:`Bearer ${token}`} : {})},
    ...(body === undefined ? {} : {body:JSON.stringify(body)})
  });
  return {status:r.status, data:await r.json()};
}
async function entrar(email) {
  const r = await chamar('/api/auth/login', {method:'POST', body:{email, password:'SenhaDidatica123!'}});
  assert.equal(r.status, 200, 'Pré-condição: login deve funcionar');
  assert.ok(r.data.token);
  return r.data.token;
}
const endereco = {street:'Rua Teste',number:'10',district:'Centro',city:'Maricá',state:'RJ',zip:'24900000'};
const comprar = (token, quantity) => chamar('/api/checkout', {method:'POST', token, body:{
  items:[{productId:'produto-teste', quantity}], address:endereco
}});

test('CT03 integração: compra acima do estoque é recusada e o estoque não muda', async () => {
  const token = await entrar('cliente-a@loja.test');
  const antes = await chamar('/api/products/produto-teste');
  assert.ok(antes.data.stock >= 1, 'Pré-condição: resetar a base');
  const compra = await comprar(token, antes.data.stock + 1);          // sempre 1 acima do estoque real
  assert.notEqual(compra.status, 201, 'RN-03: não pode criar pedido acima do estoque');
  assert.ok(compra.data.error && String(compra.data.error).length > 0, 'o usuário deve receber uma mensagem de erro');
  const depois = await chamar('/api/products/produto-teste');
  assert.equal(depois.data.stock, antes.data.stock, 'o estoque não pode mudar numa compra recusada');
});

test('CT07 integração: pedido preserva o preço da compra após mudança no catálogo (RN-07)', async () => {
  const cliente = await entrar('cliente-a@loja.test');
  const admin = await entrar('admin@loja.test');
  const antes = await chamar('/api/products/produto-teste');
  assert.ok(antes.data.stock >= 1, 'Pré-condição: resetar a base');
  const precoOriginal = antes.data.price;
  const compra = await comprar(cliente, 1);
  assert.equal(compra.status, 201);
  const id = compra.data.order.id;
  const mudanca = await chamar('/api/admin/products/produto-teste', {method:'PUT', token:admin, body:{price: precoOriginal + 50}});
  assert.equal(mudanca.status, 200, 'Pré-condição: admin deve conseguir alterar o preço');
  const consulta = await chamar('/api/orders/' + id, {token:cliente});
  assert.equal(consulta.status, 200);
  assert.equal(consulta.data.items[0].unitPrice, precoOriginal, 'o pedido deve manter o preço da compra');
});

// Compra 2 (e não 1) de propósito: o checkout ignora uma compra idêntica repetida em até 5 s (RN-09),
// e o CT07 acima já comprou 1 com o mesmo cliente e endereço. Quantidade diferente = compra nova.
test('CT08 integração: pedido fica gravado na base em disco (RN-08)', async () => {
  const token = await entrar('cliente-a@loja.test');
  const antes = await chamar('/api/products/produto-teste');
  assert.ok(antes.data.stock >= 2, 'Pré-condição: resetar a base');
  const compra = await comprar(token, 2);
  assert.equal(compra.status, 201);
  const id = compra.data.order.id;
  const db = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'db.json'), 'utf8'));
  assert.ok(db.orders.some(o => o.id === id), 'o pedido deve existir em data/db.json (persistência)');
});

// Este teste deve ser o ÚLTIMO do arquivo: ele consome todo o estoque restante.
// Usa o cliente-b: com o cliente-a e a mesma quantidade do CT08, a proteção da RN-09
// (compra idêntica em até 5 s) devolveria o pedido anterior e o estoque não baixaria.
test('CT04 integração: última unidade zera o estoque', async () => {
  const token = await entrar('cliente-b@loja.test');
  const antes = await chamar('/api/products/produto-teste');
  assert.ok(antes.data.stock >= 1, 'Pré-condição: resetar a base (estoque zerado)');
  const compra = await comprar(token, antes.data.stock);
  assert.equal(compra.status, 201);
  const depois = await chamar('/api/products/produto-teste');
  assert.equal(depois.data.stock, 0);
});