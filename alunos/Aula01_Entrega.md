Testes unitários e funcionais na Loja Aurora

PETRICK

Arquivo tests/aula01.test.js, executado com:

node --test tests/aula01.test.js

São 6 testes: 4 unitários (desconto, quantidade, arredondamento) e 2 funcionais (cotação de uma compra completa).
Antes: 2 aprovados, 4 reprovados.
Depois: 6 aprovados, 0 reprovados.

TODOS OS DEFEITOS QUE EU ENCONTREI ESTÃO EM SRC/DOMAIN

ENTRADA,ESPERADO,OBTIDO, RESULTADO ANTES (RA) E RESULTADO DEPOIS (RD).

1. ENTRADA = desconto para R$ 199,99 / ESPERADO = 0 / OBTIDO = 0 / RA = Aprovado	
RD = Aprovado

2. ENTRADA = desconto para R$ 200,00 / ESPERADO = 20 / OBTIDO = 0 / RA = Reprovado
RD = Aprovado / PROBLEMA = discount.js 
PROBLEMA ANTES = if (!(Number(subtotal) > AUTO_DISCOUNT_MIN_SUBTOTAL)) {. 
RESOLUÇÃO = if (!(Number(subtotal) >= AUTO_DISCOUNT_MIN_SUBTOTAL)) {

3. ENTRADA = validar quantidade -1 / ESPERADO = inválida (false) / OBTIDO = TRUE / 
RA = Reprovado / RD = Aprovado / PROBLEMA = quantity.js 
PROBLEMA ANTES = if (value === 0) {
RESOLUÇÃO = if (value  <= 0) {

4. ENTRADA = 10% de R$ 200,05 / ESPERADO = 	20,01 / OBTIDO = 20 / RA = Reprovado / 
RD = Aprovado / PROBLEMA = money.js
PROBLEMA ANTES = const resultCents = Math.trunc((cents * Number(percent)) / 100);
RESOLUÇÃO = const resultCents = Math.round((cents * Number(percent)) / 100);

5. ENTRADA = compra de 2 × R$ 150 (subtotal 300) / ESPERADO = frete 0 / 
OBTIDO = frete 18,50 / / RA = Reprovado / RD = Aprovado / PROBLEMA = shipping.js
PROBLEMA ANTES = const considered = Math.trunc((cents * 9) / 10);
if (considered >= toCents(FREE_SHIPPING_MIN_SUBTOTAL)) {
RESOLUÇÃO = (cents >= toCents(FREE_SHIPPING_MIN_SUBTOTAL)) {

6. ENTRADA = compra de 1 × R$ 100 / ESPERADO = frete 18,50 / OBTIDO = frete 18,50 /
RA = Aprovado / RD = Aprovado

Além dos 6 testes do roteiro, criei o arquivo tests/aula01desafio.test.js, com 14 testes que exploram os limites das regras. Usei o mesmo molde dos primeiros (test + assert.equal ), mudando a função, a entrada e o esperado. Basicamente um copia e cola.

Para cada regra testei três pontos: logo abaixo do limite, exatamente no limite e logo acima, porque é nesses pontos que os defeitos costumam aparecer, lembro do senhor (professor) falar isso em Aula. 

