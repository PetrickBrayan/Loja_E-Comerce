Aula 3 — Confirmação e regressão na Loja Aurora
PETRICK

1. O que eu fiz

Dois conceitos desta aula:
-Confirmação: repetir o mesmo caso que reprovou, depois da correção, para confirmar que o defeito sumiu.
- Regressão:reexecutar casos que já passavam, para ver se a correção não quebrou nada.

Arquivos de teste:

[Arquivo / O que testa / Precisa de servidor? / Como executei ]

tests/aula03.test.js / confirmação e regressão do roteiro (4 testes) / não / node --test tests\aula03.test.js 

tests/aula03desafio.test.js / fim do dia, cotação com cupom vencido, cupom fixo maior que o subtotal (5 testes) / não / `node --test tests\aula03desafio.test.js` 

tests/aula03api.test.js / cupom inexistente e cupom vencido pela API (2 testes) / sim / npm run reset && npm start` e depois node --test tests\aula03api.test.js 

2. Tabela de casos

RA = resultado antes da correção. RD = resultado depois.
Confirmação (reprovaram antes)

Caso / Requisito / ENTRADA / ESPERADO / OBTIDO (antes) / RA / RD 

CT01 / RN-04 / evaluateCoupon com cupom de validade 06/10/2026 e relógio em 07/10/2026 | recusado (ok: false) / ok: true / Reprovado / Aprovado 

CT02 / RN-04 / cotação (quoteLines) com o cupom vencido / cotação recusada (ok: false) / ok: true, cupom aplicado / Reprovado / Aprovado 

CT03 / RN-04 / cupom válido até 07/10, relógio em 08/10 às 00:00 (Brasília) / recusado / ok: true /Reprovado / Aprovado 

CT04 / RN-04 / API: cupom ANTIGO (venceu em 06/10/2026) em /api/cart/quote / status 400 / status 200 / Reprovado / Aprovado 

Regressão (já passavam antes, comprovado em `aula03-antes.txt`)

Caso / Requisito / ENTRADA / ESPERADO / OBTIDO / RA / RD 

CT05 / RN-05 / cupom válido de 20% em 2 × R$ 150 / desconto 60 / 60 / Aprovado / Aprovado 
CT06 / RN-05 / cupom de 5% em 2 × R$ 150 / desconto 30 (o automático é maior) / 30 / Aprovado / Aprovado 
CT07 / RN-04 / cupom com `active: false` / recusado / recusado / Aprovado / Aprovado 

Desafios que passaram antes e depois

Caso / Requisito / ENTRADA / ESPERADO / OBTIDO / RA / RD 
CT08 / RN-04 / cupom com validade hoje, relógio às 17:00 (Brasília) / vale / vale / Aprovado  / Aprovado 
CT09 / RN-04 / mesmo cupom às 23:59:59 (Brasília) / vale / vale / Aprovado  / Aprovado 
CT10 / RN-05 / cupom fixo de R$ 500 em subtotal de R$ 300 / desconto limitado a 300 e total 0 / 300 e total 0  Aprovado / Aprovado /
CT11 / RN-04 / API: cupom NAOEXISTE / status 400 / status 400 / Aprovado / Aprovado 

Aprovaram por coincidência: o código antigo aceitava qualquer cupom, então "o cupom vale" dava certo sem checar validade. Esses dois só passaram a provar algo junto com o CT03 (que mostra que o cupom deixa de valer na hora certa).

Resumo: antes 7 aprovados e 4 reprovados (11 testes). Depois 11 aprovados e 0 reprovados.

Regressão ampliada, com o código corrigido

O que reexecutei / Resultado /

Comando do roteiro: node --test tests\aula01.test.js tests\aula03.test.js / 10 de 10 aprovados /
Todas as regras puras (Aula 1, exemplos, dataset, Aula 3) / 42 de 42 aprovados 
Aula 2, integração (aula02.test.js), com reset / 2 de 2 aprovados 
Aula 2, desafios (aula02desafio.test.js), com reset / 4 de 4 aprovados 
Aula 2, sistema (Playwright), com reset  2 de 2 aprovados 

3. Defeito encontrado

D1 — O cupom vencido é aceito (src/domain/coupon.js, função evaluateCoupon)
- Versão:única, estado do projeto após a Aula 2.
- Pré-condições:relógio fixado em 07/10/2026 (setClock(REFERENCE_INSTANT)). Para a API, o relógio do computador depois de 07/10/2026 e a base resetada.
- Passos: chamar evaluateCoupon com um cupom ativo e expiresAt: "2026-10-06T23:59:59Z"`; ou pedir a cotação com o cupom ANTIGO na API.
- ESPERADO= cupom recusado (RN-04: "cupom vencido deve ser rejeitado").
- OBTIDO = cupom aceito e desconto aplicado (ok: true; na API, status 200).
- PROBLEMA*= a função só olhava active e nunca lia expiresAt. Também não importava o clock.js, então fixar o relógio no teste não mudava nada: a função não consultava a hora.

- PROBLEMA ANTES =
  ```javascript
  function evaluateCoupon(coupon) {
    if (!coupon || coupon.active === false) {
      return { ok: false, message: "Cupom inválido." };
    }
    return { ok: true };
  }
  ```
- RESOLUÇÃO =
  ```javascript
  const { now } = require("./clock");
  const EXPIRY_OFFSET = "-03:00";            

  function endOfValidityDay(expiresAt) {
    const day = String(expiresAt).slice(0, 10);              
    return new Date(`${day}T23:59:59.999${EXPIRY_OFFSET}`);  
  }

  if (coupon.expiresAt) {
    const end = endOfValidityDay(coupon.expiresAt);
    if (Number.isNaN(end.getTime())) return { ok: false, message: "Cupom inválido." };
    if (now() > end) return { ok: false, message: "Cupom vencido." };
  }
  ```
- IMPACTO = qualquer cliente usa um cupom que já venceu e ganha um desconto que a loja não queria dar (os cupons ANTIGO, DIDATICO002 e DIDATICO003 da base vencem em 06/10/2026). Prejuízo direto de receita.
