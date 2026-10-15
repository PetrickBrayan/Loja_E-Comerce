const BASE = 'http://127.0.0.1:3000';
async function chamar(rota, {method='GET', body, token} = {}) {
  const r = await fetch(BASE + rota, {method,
    headers: {'Content-Type':'application/json', ...(token ? {Authorization:'Bearer '+token} : {})},
    ...(body ? {body: JSON.stringify(body)} : {})});
  return {status: r.status, data: await r.json()};
}
(async () => {
  const login = await chamar('/api/auth/login', {method:'POST', body:{email:'cliente-a@loja.test', password:'SenhaDidatica123!'}});
  const token = login.data.token;
  const endereco = {street:'Rua Teste',number:'10',district:'Centro',city:'Maricá',state:'RJ',zip:'24900000'};
  const compra = await chamar('/api/checkout', {method:'POST', token, body:{items:[{productId:'produto-teste',quantity:1}], address: endereco}});
  const id = compra.data.order.id;
  console.log('compra:', compra.status, 'id:', id);
  console.log('consulta por id:', (await chamar('/api/orders/' + id, {token})).status);
  const lista = await chamar('/api/orders', {token});
  console.log('aparece na lista:', lista.data.some(o => o.id === id));
  console.log('estoque agora:', (await chamar('/api/products/produto-teste')).data.stock);
})();