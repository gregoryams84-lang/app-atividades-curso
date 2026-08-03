export function normalizarListaAberta(valores, quantidadeCampos) {
  const normalizados = [];
  for (let i = 0; i < quantidadeCampos; i++) {
    const valor = valores[i];
    normalizados.push(typeof valor === 'string' ? valor.trim() : '');
  }
  return normalizados;
}

export function minimoPreenchidoAtingido(valores, minimo) {
  const preenchidos = valores.filter((v) => typeof v === 'string' && v.trim().length > 0).length;
  return preenchidos >= minimo;
}

export function resolverOpcoesSelecao(valoresResolvidos) {
  return (Array.isArray(valoresResolvidos) ? valoresResolvidos : [])
    .map((v) => (typeof v === 'string' ? v.trim() : String(v)))
    .filter((v) => v.length > 0);
}

export function avaliarRespostaCorreta(bloco, indiceEscolhido) {
  return indiceEscolhido === bloco.correta;
}

export function determinarNivelFeedback(numeroDaTentativaErrada) {
  return numeroDaTentativaErrada <= 1 ? 'dica' : 'dica_e_explicacao';
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
    if (!(nome in valores)) return correspondencia;
    const valor = valores[nome];
    return valor === undefined ? 'indisponível' : formatarNumero(valor);
  });
}

export function montarArtefatoDaAula(blocosDaAula, respostasDaAula) {
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

export function blocoEstaCompleto(bloco, resposta) {
  if (bloco.tipo === 'cenario') {
    return !!resposta && resposta.indiceEscolhido === bloco.correta;
  }
  if (bloco.tipo === 'lista_aberta') {
    return Array.isArray(resposta) && minimoPreenchidoAtingido(resposta, bloco.minimo_preenchido ?? 1);
  }
  if (bloco.tipo === 'calculo') {
    return !!resposta && typeof resposta.resultadoTexto === 'string';
  }
  if (bloco.tipo === 'escolha_simples') {
    return resposta !== undefined;
  }
  return false;
}

export function calcularProgresso(blocos, respostas) {
  for (let i = 0; i < blocos.length; i++) {
    if (!blocoEstaCompleto(blocos[i], respostas[blocos[i].id])) return i;
  }
  return blocos.length;
}
