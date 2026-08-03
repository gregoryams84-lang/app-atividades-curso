export function normalizarListaAberta(valores, quantidadeCampos) {
  const normalizados = [];
  for (let i = 0; i < quantidadeCampos; i++) {
    const valor = valores[i];
    normalizados.push(typeof valor === 'string' ? valor.trim() : '');
  }
  return normalizados;
}

export function resolverOpcoesSelecao(campo, respostasDoBlocoReferenciado) {
  if (campo.opcoes_de_bloco) {
    const valores = Array.isArray(respostasDoBlocoReferenciado) ? respostasDoBlocoReferenciado : [];
    return valores
      .map((v) => (typeof v === 'string' ? v.trim() : ''))
      .filter((v) => v.length > 0);
  }
  return Array.isArray(campo.opcoes) ? campo.opcoes : [];
}

export function avaliarRespostaCorreta(bloco, indiceEscolhido) {
  return indiceEscolhido === bloco.correta;
}

export function todosCamposPreenchidos(campos, valores) {
  return campos.every((campo) => {
    const valor = valores[campo.id];
    if (valor === undefined || valor === null) return false;
    if (typeof valor === 'string') return valor.trim().length > 0;
    if (typeof valor === 'number') return !Number.isNaN(valor);
    return false;
  });
}

function formatarNumero(valor) {
  if (typeof valor !== 'number') return String(valor);
  return Number.isInteger(valor) ? String(valor) : valor.toFixed(1).replace('.', ',');
}

export function interpolarTexto(modelo, valores) {
  return modelo.replace(/\{(\w+)\}/g, (correspondencia, nome) => {
    const valor = valores[nome];
    return valor === undefined ? correspondencia : formatarNumero(valor);
  });
}

export function montarResumo(blocosDaAula, respostasDaAula) {
  const itens = [];
  for (const bloco of blocosDaAula) {
    if (bloco.tipo === 'lista_aberta') {
      const valores = normalizarListaAberta(respostasDaAula[bloco.id] || [], bloco.quantidade_campos)
        .filter((v) => v.length > 0);
      if (valores.length > 0) {
        itens.push({ tipo: 'lista', enunciado: bloco.enunciado, valores });
      }
    }
    if (bloco.tipo === 'calculo') {
      const resposta = respostasDaAula[bloco.id];
      if (resposta && typeof resposta.resultadoTexto === 'string') {
        itens.push({ tipo: 'texto', enunciado: bloco.enunciado, texto: resposta.resultadoTexto });
      }
    }
  }
  return itens;
}
