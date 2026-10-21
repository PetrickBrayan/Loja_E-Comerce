const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:3000';
const ARQUIVO = path.join(os.tmpdir(), 'aurora-id-pedido.txt');
const endereco = {street:'Rua Teste',number:'10',district:'Centro',city:'Maricá',state:'RJ',zip:'24900000'};
async function chamar(rota, {method='GET', body, token} = {}) {
  const r = await fetch(BASE + rota, {method,
    headers:{'Content-Type':'application/json', ...(token ? {Authorization:`Bearer ${token}`} : {})},
    ...(body === undefined ? {} : {body:JSON.stringify(body)})});
  return {status:r.status, data:await r.json()};
}
async function entrar() {
  const r = await chamar('/api/auth/login', {method:'POST', body:{email:'cliente-a@loja.test', password:'SenhaDidatica123!'}});
  return r.data.token;
}
(async () => {
  const fase = process.argv[2];
  const token = await entrar();
  if (fase === 'antes') {
    const e0 = (await chamar('/api/products/produto-teste')).data.stock;
    const c = await chamar('/api/checkout', {method:'POST', token, body:{items:[{productId:'produto-teste', quantity:2}], address:endereco}});
    const e1 = (await chamar('/api/products/produto-teste')).data.stock;
    fs.writeFileSync(ARQUIVO, c.data.order.id);
    console.log(`1) compra: ${c.status} id = ${c.data.order.id} | estoque ${e0} -> ${e1}`);
  } else if (fase === 'depois') {
    const id = fs.readFileSync(ARQUIVO, 'utf8');
    const g = await chamar('/api/orders/' + id, {token});
    const e = (await chamar('/api/products/produto-teste')).data.stock;
    console.log(`3) servidor reiniciado, nova autenticação, GET /api/orders/${id} -> ${g.status} | estoque agora: ${e}`);
  } else {
    console.log('Uso: node tests\\reinicio.manual.js antes|depois');
  }
})();
