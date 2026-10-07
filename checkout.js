function calcularCompra(subtotal) {
    let desconto = 0;
    let frete = 20;

    if (subtotal >= 200) {
        desconto = subtotal * 0.10;
    }

    if (subtotal >= 300) {
        frete = 0;
    }

    let total = subtotal - desconto + frete;

    return {
        subtotal: subtotal,
        desconto: desconto,
        frete: frete,
        total: total
    };
}

let casos = [
    { entrada: 180, esperado: 200 },
    { entrada: 200, esperado: 200 },
    { entrada: 250, esperado: 245 },
    { entrada: 300, esperado: 270 },
    { entrada: 320, esperado: 288 }
];

casos.forEach((caso, index) => {
    let resultado = calcularCompra(caso.entrada);

    console.log(`\nCaso de Teste ${index + 1}`);
    console.log(`Subtotal: R$ ${resultado.subtotal.toFixed(2)}`);
    console.log(`Desconto: R$ ${resultado.desconto.toFixed(2)}`);
    console.log(`Frete: R$ ${resultado.frete.toFixed(2)}`);
    console.log(`Total esperado: R$ ${caso.esperado.toFixed(2)}`);
    console.log(`Total obtido: R$ ${resultado.total.toFixed(2)}`);

    if (resultado.total === caso.esperado) {
        console.log("Resultado: PASSOU");
    } else {
        console.log("Resultado: FALHOU");
    }
});