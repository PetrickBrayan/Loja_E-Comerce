# ATIVIDADE PRÁTICA – EQUIPE DE TESTES

## Cenário da loja

* Desconto de **10%** em compras com subtotal maior ou igual a **R$ 200,00**.
* Frete de **R$ 20,00**, sendo gratuito quando o subtotal for maior ou igual a **R$ 300,00**.
* O desconto é aplicado somente sobre os produtos, não sobre o frete.

1. Casos de teste

Caso de Teste 1 – Abaixo do limite do desconto

* **Entrada:** R$ 180,00
* **Desconto:** R$ 0,00
* **Frete:** R$ 20,00
* **Total esperado:** R$ 200,00
* **Resultado esperado:** Não aplicar desconto e cobrar o frete normalmente.

Caso de Teste 2 – No limite do desconto

* **Entrada:** R$ 200,00
* **Desconto:** R$ 20,00
* **Frete:** R$ 20,00
* **Total esperado:** R$ 200,00
* **Resultado esperado:** Aplicar os 10% de desconto e cobrar o frete.

Caso de Teste 3 – Acima do limite do desconto e abaixo do frete grátis

* **Entrada:** R$ 250,00
* **Desconto:** R$ 25,00
* **Frete:** R$ 20,00
* **Total esperado:** R$ 245,00
* **Resultado esperado:** Aplicar o desconto de 10%, mas ainda cobrar o frete.

Caso de Teste 4 – No limite do frete grátis

* **Entrada:** R$ 300,00
* **Desconto:** R$ 30,00
* **Frete:** R$ 0,00
* **Total esperado:** R$ 270,00
* **Resultado esperado:** Aplicar os 10% de desconto e deixar o frete grátis.

Caso de Teste 5 – Acima do limite do frete grátis

* **Entrada:** R$ 320,00
* **Desconto:** R$ 32,00
* **Frete:** R$ 0,00
* **Total esperado:** R$ 288,00
* **Resultado esperado:** Aplicar os 10% de desconto e deixar o frete grátis.

2. Nível de teste utilizado

Eu considero que o **teste de sistema** é o mais adequado, porque estamos verificando o checkout completo e se o desconto, o frete e o valor final estão sendo calculados corretamente.

3. Avaliação não funcional

Eu faria um **teste de desempenho**, verificando se o checkout continua funcionando de forma rápida quando vários usuários estiverem realizando compras ao mesmo tempo.

4. Caso escolhido para apresentar

Eu escolheria o **Caso de Teste 3 (R$ 250,00)**, porque ele verifica uma situação intermediária: o cliente já tem direito ao desconto, mas ainda não tem direito ao frete grátis. Assim, conseguimos verificar se as duas regras estão sendo aplicadas separadamente.

5. Evidências para liberar a funcionalidade

Para liberar a funcionalidade para produção, eu verificaria os **resultados dos testes, prints ou outras evidências dos testes realizados, possíveis erros encontrados e se esses erros foram corrigidos e testados novamente**.

No código, os cinco casos foram executados e os resultados esperados foram comparados com os resultados obtidos.

Assim, podemos ter mais segurança de que o checkout está funcionando de acordo com as regras definidas.
