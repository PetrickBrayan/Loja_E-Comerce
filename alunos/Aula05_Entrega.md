# Aula 5 — Carga e estresse na Loja Aurora
(Aula 12 do calendário, 04/11/2026 — confirmar com o professor qual numeração usar)

PETRICK

> **Como usar este arquivo:** tudo que está em **[PREENCHER]** depende de você rodar o k6 e as medições na sua máquina. Os números da interface (contagem de chamadas) já estão preenchidos porque não dependem do computador, mas **confirme** ao rodar. Apague esta nota antes de entregar.

---

## 1. Identificação do ambiente e da funcionalidade testada

| Item | Valor |
|---|---|
| Máquina / CPU / RAM / SO | [PREENCHER] |
| Node.js | [PREENCHER: node -v] |
| k6 | [PREENCHER: k6 version] |
| Projeto | Loja Aurora (projeto da minha dupla), commit [PREENCHER hash] |
| Volume de dados 1 | seed padrão: 1.200 produtos (1.159 ativos), 1.200 pedidos |
| Volume de dados 2 | `npm run generate -- --products 4000 --orders 2000`: 5.200 produtos (5.159 ativos), 3.200 pedidos; o `cliente-a` fica com 1.003 pedidos |
| Funcionalidade 1 (API) | consulta do catálogo: `GET /api/products` (devolve um array com todos os produtos ativos, sem busca no servidor) |
| Funcionalidade 2 (API) | histórico: `GET /api/orders` do `cliente-a` |
| Funcionalidade 3 (interface) | busca, filtro, botão "Atualizar lista" e histórico de pedidos no navegador (RNF-06 a RNF-09) |

Execução só no meu projeto local, sem pagamentos reais nem serviços externos.

---

## 2. Objetivo e critérios definidos antes da execução

**Objetivo:** (a) verificar se o catálogo atende a carga esperada; (b) ampliar a demanda por etapas e achar quando os critérios deixam de ser atendidos; (c) reduzir a demanda e observar a recuperação; (d) verificar o comportamento da interface (RNF-06 a RNF-09).

| Critério | Carga | Estresse |
|---|---|---|
| Falhas HTTP (`http_req_failed`) | < 1% | < 5% |
| p95 do tempo de resposta | < 500 ms | < 1.000 ms |
| Verificações (`checks`) | > 99% | > 95% |
| Conteúdo | resposta 200 com array não vazio | resposta 200 |
| Consistência | `data/db.json` idêntico antes e depois (o catálogo só lê) | idem |

**Limite de segurança (quando interrompo):** Ctrl+C se a máquina ficar indisponível, se as falhas passarem de 20% ou se o p95 passar de 5 s.

**Critérios da interface (vêm do `REQUISITOS.md`):**
- RNF-06: a busca não percorre nem reconstrói o catálogo inteiro a cada tecla.
- RNF-07: atualizar a tela não acumula tratadores do mesmo clique.
- RNF-08: o histórico continua utilizável com muitos pedidos.
- RNF-09: a interface não repete chamadas idênticas e desnecessárias à API.

Os valores 500/1.000 ms e 1%/5% são metas didáticas do roteiro, não requisitos reais do negócio.

---

## 3. Roteiro e scripts utilizados

| Arquivo | O que faz | Como executei (cmd) |
|---|---|---|
| `tests\carga\carga.js` | carga: 5 VUs por 30 s | `k6 run --summary-export=evidencias\resultado-carga.json tests\carga\carga.js` |
| `tests\carga\estresse.js` | estresse: 5→15→30→5→0 VUs | `k6 run --summary-export=evidencias\resultado-estresse.json tests\carga\estresse.js` |
| `tests\carga\patamar.js` | um patamar por execução, para registrar métricas por nível | `k6 run -e VUS=10 --summary-export=evidencias\patamar-10.json tests\carga\patamar.js` (repeti com 20, 40, 60...) |
| `tests\interface\aula05-desempenho.spec.cjs` | Playwright: conta chamadas e cartões criados na interface | `set FASE=antes&& npx playwright test aula05-desempenho.spec.cjs` |

Ordem de execução: validar com uma requisição (`curl http://127.0.0.1:3000/api/products`: status 200, array, quantidade de itens) → carga → estresse → carga de novo (recuperação) → patamares → volume maior → interface. Antes de cada bloco: `npm run reset && npm start`. Para o volume maior, com o servidor parado: `npm run generate -- --products 4000 --orders 2000`.

---

## 4. Resultados

### 4.1 Tabela por etapa (API, k6)

Modelo da aula. **Vazão** = requisições por segundo (`http_reqs`).

| Teste | Etapa | Carga | Duração | p95 | Vazão | Falhas | Obs. |
|---|---|---|---|---|---|---|---|
| Carga | 1 | 5 VUs | 30 s | [PREENCHER] | [PREENCHER] | [PREENCHER] | |
| Estresse | 1 | 5 VUs | 20 s | [PREENCHER] | [PREENCHER] | [PREENCHER] | |
| Estresse | 2 | 15 VUs | 20 s | [PREENCHER] | [PREENCHER] | [PREENCHER] | |
| Estresse | 3 | 30 VUs | 20 s | [PREENCHER] | [PREENCHER] | [PREENCHER] | |
| Estresse | 4 | 5 VUs (descida) | 20 s | [PREENCHER] | [PREENCHER] | [PREENCHER] | recuperação |
| Patamar | | 10 VUs | 1 min | [PREENCHER] | [PREENCHER] | [PREENCHER] | |
| Patamar | | 20 VUs | 1 min | [PREENCHER] | [PREENCHER] | [PREENCHER] | |
| Patamar | | 40 VUs | 1 min | [PREENCHER] | [PREENCHER] | [PREENCHER] | |
| Patamar | | 60 VUs | 1 min | [PREENCHER] | [PREENCHER] | [PREENCHER] | |
| Patamar | | [PREENCHER] | | | | | até os critérios falharem |
| Carga após estresse | | 5 VUs | 30 s | [PREENCHER] | [PREENCHER] | [PREENCHER] | comparar com a 1ª carga |
| Carga, volume maior | | 5 VUs | 30 s | [PREENCHER] | [PREENCHER] | [PREENCHER] | 5.200 produtos |

Observação: o k6 resume a execução inteira. Para ver cada patamar usei uma execução por nível (`patamar.js`). Registre também CPU e memória do servidor (Gerenciador de Tarefas, processo `node`) e a máquina em uso.

Evidências: `evidencias\resultado-carga.json`, `resultado-estresse.json`, `patamar-*.json` e capturas de tela do terminal: [PREENCHER nomes].

### 4.2 Interface (Playwright), antes e depois da correção

Janela e ações iguais nas duas medições. As contagens não dependem do computador.

| Medição | Requisito | Esperado | Antes | Depois |
|---|---|---|---|---|
| Chamadas `GET /api/products` com a tela parada por 10 s | RNF-09 | 0 | **5** | **0** |
| Chamadas `GET /api/products` ao digitar 4 letras na busca | RNF-06 / 09 | 0 | **4** | **0** |
| Cartões criados no DOM ao digitar 4 letras (seed) | RNF-06 | 0 | **4.636** (4 × 1.159) | **0** |
| Chamadas por **um** clique em "Atualizar lista", depois de 3 trocas de filtro | RNF-07 | 1 | **5** | **1** |
| Chamadas `GET /api/orders` ao abrir o histórico | RNF-09 | 1 | **8** | **1** |
| Tempo até o 1º pedido aparecer, 3 pedidos (ms) | RNF-08 | só registrar | [PREENCHER] | [PREENCHER] |
| Tempo até o 1º pedido aparecer, 1.003 pedidos (ms) | RNF-08 | só registrar | [PREENCHER] | [PREENCHER] |

Evidências: `evidencias\aula05-interface-antes.json` e `aula05-interface-depois.json` (gravados pelo teste), mais capturas do relatório do Playwright.

**Custo de filtrar (medido no DevTools, aba Console, com 5.159 produtos):**
```javascript
document.getElementById('search').value = 'item 0';
const s = performance.now(); Aurora.renderCatalog(); performance.now() - s
```
Antes: [PREENCHER] ms. Depois: [PREENCHER] ms. (No ambiente de referência do assistente: ~257 ms antes e ~0,8 ms depois. Seu computador dará outros valores.)

### 4.3 Casos de teste

| Caso | Requisito | Entrada/ação | Esperado | Obtido | Situação | Evidência |
|---|---|---|---|---|---|---|
| CT01 | critérios de carga | k6 `carga.js`: 5 VUs, 30 s, `GET /api/products` | p95 < 500 ms, falhas < 1%, checks > 99% | [PREENCHER] | [PREENCHER] | resultado-carga.json |
| CT02 | critérios de estresse | k6 `estresse.js` e patamares até degradar | critérios mantidos; registrar onde deixam de valer | [PREENCHER] | [PREENCHER] | resultado-estresse.json |
| CT03 | recuperação | carga de novo depois do pico | p95 e falhas voltam ao nível da 1ª carga; `db.json` idêntico | [PREENCHER] | [PREENCHER] | [PREENCHER] |
| CT04 | RNF-09 | tela do catálogo parada por 10 s | 0 chamadas a `/api/products` | 5 chamadas | Reprovado → Aprovado | aula05-interface-antes/depois.json |
| CT05 | RNF-06 | digitar 4 letras na busca | 0 chamadas e 0 cartões recriados | 4 chamadas e 4.636 cartões | Reprovado → Aprovado | idem |
| CT06 | RNF-07 | 3 trocas de filtro e 1 clique em "Atualizar lista" | 1 chamada | 5 chamadas | Reprovado → Aprovado | idem |
| CT07 | RNF-09 / RNF-08 | abrir o histórico do `cliente-a` | 1 chamada a `/api/orders` e a lista aparece | 8 chamadas | Reprovado → Aprovado | idem |

Situação: Aprovado / Reprovado / Bloqueado. Se o k6 não instalar, os CT01 a CT03 ficam **Bloqueado** (ambiente) e o motivo precisa ser registrado.

---

## 5. Análise de degradação e recuperação

Responda com **os seus** números (as perguntas são as da aula):

1. **O tempo de resposta aumentou antes dos erros?** [PREENCHER: em que patamar o p95 começou a subir e em qual apareceram as primeiras falhas.]
2. **A vazão estabilizou com mais demanda (saturação)?** [PREENCHER: a partir de quantos VUs a vazão parou de crescer proporcionalmente.]
3. **Houve timeouts?** [PREENCHER]
4. **O sistema se recuperou depois da redução?** [PREENCHER: p95 e falhas da carga depois do pico, comparados com a primeira carga.]
5. **Pedidos e estoque permaneceram consistentes?** O catálogo só lê dados. Conferi que `data\db.json` ficou idêntico: [PREENCHER: comando e resultado, por exemplo `certutil -hashfile data\db.json MD5` antes e depois].

**Se 30 VUs não degradarem nada**, não afirmo que esse é o limite: subi gradualmente (patamares) até os critérios falharem ou até a máquina chegar ao limite seguro.

**Gerador ou aplicação?** Antes de culpar o servidor, comparei o uso de CPU do processo do servidor com o da máquina: se a máquina estiver cheia e o servidor não, o gargalo pode ser o próprio gerador de carga (o k6 e o servidor dividem o mesmo computador). [PREENCHER sua observação.]

**Para comparação (ambiente de referência do assistente, gerador em Node, 1 núcleo compartilhado; não é k6):** a vazão estabilizou em ~185 req/s a partir de 100 VUs enquanto o p95 subia de 91 ms para 445 e 645 ms (150 e 200 VUs), sem falhas; o servidor usava só ~49% da CPU porque o gerador ocupava o resto. Depois do pico, o p95 voltou a 7,6 ms (a base era 10 ms). Com 5.200 produtos, a resposta passou de 299 KB para 1 MB e a vazão saturou em ~63 req/s. Seu computador dará outros números.

---

## 6. Defeitos encontrados na interface e no histórico

Versão: Loja Aurora 1.0.0, estado após as aulas 1 e 2. Pré-condição: `npm run reset`, servidor ligado.

**D1 — A tela repete chamadas à API a cada 2 s** (`public/js/main.js`) — RNF-09
- ENTRADA = abrir o catálogo e deixar parado por 10 s
- ESPERADO = 0 chamadas / OBTIDO = 5 chamadas a `GET /api/products`
- PROBLEMA ANTES = `setInterval(() => { fetch("/api/products").catch(() => {}); }, 2000);` — a resposta é descartada.
- RESOLUÇÃO = apaguei o `setInterval`.
- IMPACTO = cada aba aberta gera 0,5 req/s inútil, cada uma com todo o catálogo (299 KB no seed, 1 MB com volume). Com muitos alunos conectados isso consome capacidade que o catálogo precisa.

**D2 — Cada tecla da busca refaz a chamada e recria todos os cartões** (`public/js/catalog.js`) — RNF-06 e RNF-09
- ENTRADA = digitar "item" (4 letras) na busca
- ESPERADO = 0 chamadas e 0 cartões criados / OBTIDO = 4 chamadas e 4.636 cartões criados (4 × 1.159)
- PROBLEMA ANTES = o evento `input` chamava `Aurora.loadCatalog()` (nova chamada à API) e `renderCatalog` executava `buildCard` para **todos** os produtos, mesmo os escondidos.
- RESOLUÇÃO = os cartões são criados uma vez por carga do catálogo (`buildEntries`); filtrar só alterna `hidden`; a busca tem 150 ms de espera (debounce) e chama só `renderCatalog`.
- IMPACTO = com 5.159 produtos cada tecla recriava 5.159 cartões (~257 ms no ambiente de referência).

**D3 — O botão "Atualizar lista" acumula tratadores de clique** (`public/js/catalog.js`) — RNF-07
- ENTRADA = trocar o filtro 3 vezes e clicar uma vez em "Atualizar lista"
- ESPERADO = 1 chamada / OBTIDO = 5 chamadas
- PROBLEMA ANTES = `renderCatalog` fazia `addEventListener("click", ...)` no botão **a cada renderização**.
- RESOLUÇÃO = o tratador passou para `initCatalog`, que roda uma única vez.
- IMPACTO = o número de chamadas por clique cresce a cada uso da tela.

**D4 — O histórico chama a API 8 vezes e mede o layout de cada pedido** (`public/js/orders.js`) — RNF-09 e RNF-08
- ENTRADA = abrir `/#pedidos` com o `cliente-a`
- ESPERADO = 1 chamada / OBTIDO = 8 chamadas a `GET /api/orders`
- PROBLEMA ANTES = um `for` de 8 voltas chamava a API e guardava só a última resposta; depois, para cada pedido, `card.dataset.height = String(card.offsetHeight)` forçava o navegador a recalcular o layout.
- RESOLUÇÃO = uma única chamada e `list.innerHTML = orders.map(renderOrder).join("")`.
- IMPACTO = com 1.003 pedidos eram 8 respostas de 617 KB e 1.003 recálculos de layout por visita (o 1º pedido aparecia após [PREENCHER] ms; no ambiente de referência, 2,9 s antes e 1,0 s depois).

**D5 — O servidor calcula o histórico com laço dentro de laço** (`src/services/orderHistory.js`) — RNF-08
- ENTRADA = `GET /api/orders` do `cliente-a` com 1.003 pedidos
- ESPERADO = resposta rápida / OBTIDO = ~100 ms por chamada (p95 147 ms no ambiente de referência)
- PROBLEMA ANTES = para cada item de cada pedido o código percorria de novo todos os itens de todos os pedidos (O(n²)) para somar `quantitySoldToCustomer`.
- RESOLUÇÃO = soma uma única vez por produto em um `Map` e consulta o total depois.
- Provei que o resultado é idêntico ao antigo (`assert.deepEqual`) para 4 clientes, incluindo um inexistente; o tempo caiu de 132 para 58 ms.
- IMPACTO = o custo cresce com o quadrado do número de pedidos do cliente.

**Evidência antes e depois:** `evidencias\aula05-interface-*.json`, `correcao-aula05.diff`, commit do antes [PREENCHER] e do depois [PREENCHER].

**Regressão feita depois das correções:** 33 de 33 testes de regras puras (aulas 1 e exemplos), Aula 2 com integração 2/2, desafios 4/4 e Playwright 2/2: [PREENCHER suas saídas].

---

## 7. Proposta de melhoria fundamentada nos resultados

Em ordem do que os dados justificam investigar primeiro:

1. **Paginar ou limitar `GET /api/products` e `GET /api/orders`.** A resposta devolve tudo: 299 KB no seed, 1 MB com volume, 617 KB para um cliente com 1.003 pedidos. A vazão máxima caiu cerca de 3 vezes ao quadruplicar o catálogo (de ~185 para ~63 req/s no ambiente de referência), o que aponta o tamanho da resposta e a serialização como gargalo. Muda o contrato da API: combinar com o professor.
2. **Parar de reler o `db.json` inteiro a cada chamada.** `listOrders()` lê e interpreta o arquivo todo (~30 ms de piso mesmo para um cliente com 2 pedidos). Como o estado em memória já é mantido em dia desde a correção da Aula 2, daria para ler dele. Mexe na persistência, então exige repetir os testes da Aula 2.
3. **Cache ou ETag no catálogo**, para o navegador não baixar de novo uma lista que não mudou.
4. **Histórico com rolagem virtual ou carregamento por partes**, porque mesmo com uma só chamada a tela monta 1.003 cartões.

**Limites da minha correção do RNF-06.** O requisito diz que a busca "não percorre nem reconstrói" o catálogo a cada tecla. Eliminei a reconstrução e a chamada à API, mas a busca **ainda percorre** a lista para alternar `hidden`. O custo ficou desprezível (menos de 1 ms para 5.159 itens no ambiente de referência), mas literalmente ainda é uma passada pela lista. Um índice de busca eliminaria isso. Registro como limitação e dúvida para o professor.

**Como repetir o teste:** os scripts, o teste da interface e os comandos estão na seção 3; basta `npm run reset` e rodar na mesma ordem.

---

## 8. Dificuldades que tive

- [PREENCHER: instalação do k6, uso do Playwright, ler os resultados do k6, etc.]
- Entendi que VUs (usuários virtuais) não são requisições por segundo: com `sleep(1)`, 5 VUs geram cerca de 5 req/s, e com `sleep(0.5)` cerca de 10 req/s.
- Entendi que um resultado sem degradação também precisa ser registrado e interpretado, sem afirmar que é o limite do sistema.

---

## 9. Conclusão e discussão final

**O que os testes demonstram:** [PREENCHER com seus números] que o catálogo atende o critério de carga no volume padrão, onde (ou se) os critérios deixam de ser atendidos ao ampliar a demanda, e se o sistema se recupera. Na interface, que havia 5 defeitos de desempenho (D1 a D5) que as ferramentas de API (k6) **não** enxergam: o k6 só mede a API, e as chamadas repetidas e o excesso de trabalho no navegador só aparecem observando a tela.

**Limitações:**
- Só testei consultas de catálogo e histórico. Isso não mostra capacidade de finalizar compras nem a concorrência de estoque.
- O gerador de carga e o servidor rodam no mesmo computador e disputam a CPU, o que pode antecipar a saturação.
- Os critérios de 500/1.000 ms e 1%/5% são didáticos; sem estimativa de uso real, as cargas representam exploração, não comprovação de capacidade.
- Resultados de uma máquina, em um dia, com uma base específica.

**Perguntas da discussão:**
- *Diferença entre atender à carga esperada e suportar demanda além do planejado:* [PREENCHER]
- *Por que a média pode ser insuficiente:* a média esconde as respostas mais lentas; o p95 mostra a experiência da maioria dos usuários. [Complete com um exemplo dos seus números.]
- *Como saber se a falha está na aplicação ou no gerador:* comparar a CPU do servidor com a da máquina e repetir com menos usuários ou com o gerador em outra máquina. [PREENCHER]
- *O sistema voltou ao normal depois da redução?* [PREENCHER]
- *Qual melhoria os dados justificam investigar primeiro?* Reduzir o tamanho das respostas (paginação) e as chamadas repetidas da interface (seção 7).
