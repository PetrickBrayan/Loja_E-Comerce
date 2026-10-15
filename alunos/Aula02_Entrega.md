Aula 2 — Integração e sistema na Loja Aurora
PETRICK

Integração verifica se os módulos (checkout, estoque, pedidos, base de dados) trocam dados corretamente. Sistema percorre a jornada pelo navegador como o usuário faria. Na aula, o requisito principal foi a RN-08: criar um pedido deve reduzir o estoque e persistir.

Arquivo / Abordagem / Como executei 

tests/aula02.test.js / Integração (API com fetch) / node --test --test-concurrency=1 tests\aula02.test.js
tests/aula02desafio.test.js / Integração (desafios) / node --test --test-concurrency=1 tests\aula02desafio.test.js 
tests/interface/aula02.spec.cjs / Sistema (Playwright, navegador) / npx playwright test aula02.spec.cjs


Antes de cada execução eu resetei a base npm run reset && npm start, para o produto-teste voltar a ter estoque 5. Os testes consomem estoque, então rodar duas vezes sem resetar dá resultado errado por causa do ambiente, não do sistema.

Tabela de casos
RA = resultado antes da correção. RD = resultado depois. Causa = software / teste / ambiente.

Caso / Abordagem / Requisito / ENTRADA / ESPERADO / OBTIDO (antes) / RA / RD / Causa 

CT01 Integração / RN-08 / comprar 2 de produto-teste  / estoque cai de 5 para 3  estoque continuou 5 (5 !== 3) / Reprovado / Aprovado 

CT02 Integração / RN-08 /consultar o pedido pelo ID devolvido na compra / status 200 e o mesmo ID / status 404 (404 !== 200) / Reprovado / Aprovado 

CT03 / Integração / RN-03 / comprar 1 unidade a mais do que o estoque (6) / compra recusada não é 201, mensagem de erro e estoque inalterado / compra aceita com 201 e pedido criado / Reprovado / Aprovado 

CT04 /  Integração / RN-03 / RN-08 / comprar a última unidade (todo o estoque) / compra aceita (201) e estoque vai a 0 / estoque continuou 5 (5 !== 0) / Reprovado / Aprovado 

CT05 / Sistema / RF-09 / RF-10 / jornada: login, carrinho, endereço, finalizar, Pedidos, recarregar / o pedido aparece no histórico / o pedido não aparece no histórico / Reprovado / Aprovado 

CT06 / Sistema / RN-03 / pela tela, mudar a quantidade para 6 e finalizar / o usuário vê uma mensagem e nenhum recibo aparece / nenhuma mensagem, a compra foi aceita / Reprovado | Aprovado 

CT07 / Integração / RN-07 / comprar, o admin muda o preço do produto, consultar o pedido / o pedido mantém o preço original / 404 na consulta (veja a nota abaixo) / Reprovado / Aprovado 

CT08 / Integração / RN-08 / comprar 2 e procurar o pedido em data/db.json | o pedido existe no arquivo / o pedido não estava no arquivo / Reprovado / Aprovado 

CT09 / Script manual / RN-08 / comprar, reiniciar o servidor sem reset, consultar o ID | status 200 | status 404, e o estoque continuou 5 / Reprovado / Aprovado 

Testes automatizados (CT01 a CT08): antes 0 aprovados e 8 reprovados. Depois 8 aprovados e 0 reprovados.
Regressão: os 33 testes das aulas e exemplos anteriores (que não precisam de servidor) seguem 33 de 33 aprovados com o código corrigido.

Sobre o CT07. Antes da correção ele falhou por causa do defeito D2 (o pedido não era encontrado), e não por causa da RN-07. Ou seja, naquela rodada ele não provou nada sobre o preço histórico: o defeito de persistência escondeu o teste, só depois de corrigir o D2 o CT07 passou a verificar de verdade a RN-07, e aí passou.

Defeitos encontrados
Os defeitos da Aula 2 não estão em src/domain , como na Aula 1, estão no fluxo de fechar a compra: src/services/checkout.js e src/persistence/database.js.

D1 — O estoque não diminui depois da compra (checkout.js, função placeOrder)
- ENTRADA = POST /api/checkout com 2 unidades de produto-teste
- ESPERADO = estoque 3 / OBTIDO = estoque 5 (e a compra respondeu 201)
- PROBLEMA = o placeOrder não tinha nenhuma chamada que alterasse o estoque. O findstr stock checkout.js não encontrou nada.

- RESOLUÇÃO = depois de validar tudo e antes de gravar o pedido, o checkout reduz o estoque de cada produto:
  ```javascript
  for (const [productId, quantity] of requested) {
    const product = db.findProduct(productId);
    db.updateProduct(productId, { stock: product.stock - quantity });
  }
  ```
- IMPACTO = a loja venderia sem parar: estoque 5 e infinitos pedidos de 5 unidades. Prejuízo e pedidos que não podem ser entregues.

D2 — O pedido criado não era gravado (404 e some ao reiniciar) (database.js, funções addOrder e persist)
- ENTRADA = compra de 1 unidade e GET /api/orders/{id} (e depois reiniciar o servidor)
- ESPERADO = 200 / OBTIDO = 404 (a compra respondeu 201)
- PROBLEMA ANTES = o addOrder só colocava o pedido na memória (state.orders.push(order), sem persist()). E o persist() gravava no arquivo orders: onDisk.orders, ou seja, os pedidos que já estavam no disco, nunca os da memória. A consulta (listOrders) lê do arquivo, por isso dava 404.
- RESOLUÇÃO =
  ```javascript
  orders: state.orders,       
  state.orders.push(order);
  persist();                   
  ```
- IMPACTO = o cliente recebe a confirmação, mas o pedido não existe no histórico. Qualquer reinício do servidor apaga todos os pedidos feitos. Viola a RN-08.

D3 — A compra acima do estoque era aceita (checkout.js)
- ENTRADA = comprar 6 unidades com estoque 5
- ESPERADO = compra recusada, com mensagem / OBTIDO = 201, pedido criado
- PROBLEMA = a regra RN-03 existia (hasAvailableStock em stock.js), mas só era usada no catálogo para mostrar "em estoque" (api.js, linha 75). O checkout nunca a chamava.
- RESOLUÇÃO = antes de alterar qualquer coisa, o checkout soma a quantidade por produto e valida:
  ```javascript
  if (!hasAvailableStock(quantity, product.stock)) {
    return { ok: false, status: 400, error: `Estoque insuficiente para "${product.name}". Disponível: ${product.stock}.` };
  }
  ```
- IMPACTO = o estoque ficaria negativo e a loja prometeria produtos que não tem.

Decisões que tomei:
- Valido tudo primeiro e só altero o estado no final. Assim um carrinho com um item sem estoque não deixa o outro item já reduzido.
- Somo as quantidades por produto, porque o mesmo produto pode aparecer em duas linhas do carrinho.
- Usei o código HTTP 400 na recusa, igual ao resto do arquivo. O requisito não define o código, então os testes só exigem que não seja 201.


Outros problemas que vi (fora do escopo desta aula, não corrigi)
Ao ler o checkout.js e testar, confirmei estes três
Requisito, O que observei 

RN-12 / O servidor aceita o preço que o navegador envia: com unitPrice: 1 o pedido foi gravado a R$ 1,00 (catálogo: R$ 150). 
RN-01 / RN-05 / O total gravado no pedido ignora o desconto: 2 × R$ 150 gravou total 300 (esperado 270). A causa está em orderTotals.js. 
RN-13 / Um pedido com endereço vazio (address: {}) foi aceito com 201. 