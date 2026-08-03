function chaveDaAula(trilha, aula) {
  return `atividades:${trilha}:${aula}`;
}

export function criarArmazenamento(storage) {
  function lerAula(trilha, aula) {
    const bruto = storage.getItem(chaveDaAula(trilha, aula));
    if (!bruto) return {};
    try {
      return JSON.parse(bruto);
    } catch {
      return {};
    }
  }

  function salvarResposta(trilha, aula, blocoId, resposta) {
    const dados = lerAula(trilha, aula);
    dados[blocoId] = resposta;
    storage.setItem(chaveDaAula(trilha, aula), JSON.stringify(dados));
  }

  function obterResposta(trilha, aula, blocoId) {
    const dados = lerAula(trilha, aula);
    return Object.prototype.hasOwnProperty.call(dados, blocoId) ? dados[blocoId] : undefined;
  }

  function obterRespostasDaAula(trilha, aula) {
    return lerAula(trilha, aula);
  }

  function exportarTudo() {
    const tudo = {};
    for (let i = 0; i < storage.length; i++) {
      const chave = storage.key(i);
      if (chave && chave.startsWith('atividades:')) {
        tudo[chave] = JSON.parse(storage.getItem(chave));
      }
    }
    return tudo;
  }

  function importarTudo(dados) {
    for (const chave of Object.keys(dados)) {
      if (chave.startsWith('atividades:')) {
        storage.setItem(chave, JSON.stringify(dados[chave]));
      }
    }
  }

  return { salvarResposta, obterResposta, obterRespostasDaAula, exportarTudo, importarTudo };
}
