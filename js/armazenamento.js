const PREFIXO = 'toca:v1:';
const CHAVE_INDICE = `${PREFIXO}indice`;
const ATRASO_PADRAO_MS = 500;

function chaveDaAula(trilha, aula) {
  return `${PREFIXO}${trilha}:${aula}`;
}

export function criarArmazenamento(storage, atrasoMs = ATRASO_PADRAO_MS) {
  const pendencias = new Map();
  let indisponivel = false;

  function lerAulaSync(trilha, aula) {
    const chave = chaveDaAula(trilha, aula);
    const pendente = pendencias.get(chave);
    if (pendente) return pendente.ultimoValor;
    try {
      const bruto = storage.getItem(chave);
      return bruto ? JSON.parse(bruto) : {};
    } catch {
      return {};
    }
  }

  function lerIndiceSync() {
    try {
      const bruto = storage.getItem(CHAVE_INDICE);
      return bruto ? JSON.parse(bruto) : [];
    } catch {
      return [];
    }
  }

  function gravarAgora(trilha, aula, respostas) {
    try {
      storage.setItem(chaveDaAula(trilha, aula), JSON.stringify(respostas));
      const indice = lerIndiceSync();
      if (!indice.some((item) => item.trilha === trilha && item.aula === aula)) {
        indice.push({ trilha, aula });
        storage.setItem(CHAVE_INDICE, JSON.stringify(indice));
      }
      indisponivel = false;
      return true;
    } catch {
      indisponivel = true;
      return false;
    }
  }

  function agendarGravacao(trilha, aula, chave) {
    return setTimeout(() => {
      const entrada = pendencias.get(chave);
      pendencias.delete(chave);
      const sucesso = gravarAgora(trilha, aula, entrada.ultimoValor);
      entrada.resolvers.forEach((resolve) => resolve(sucesso));
    }, atrasoMs);
  }

  function salvarRespostasDaAula(trilha, aula, respostas) {
    const chave = chaveDaAula(trilha, aula);
    return new Promise((resolve) => {
      const existente = pendencias.get(chave);
      if (existente) {
        clearTimeout(existente.timer);
        existente.ultimoValor = respostas;
        existente.resolvers.push(resolve);
        existente.timer = agendarGravacao(trilha, aula, chave);
        return;
      }
      const entrada = { trilha, aula, ultimoValor: respostas, resolvers: [resolve], timer: null };
      pendencias.set(chave, entrada);
      entrada.timer = agendarGravacao(trilha, aula, chave);
    });
  }

  async function descarregarPendencias() {
    const chaves = Array.from(pendencias.keys());
    await Promise.all(chaves.map((chave) => new Promise((resolve) => {
      const entrada = pendencias.get(chave);
      if (!entrada) { resolve(); return; }
      clearTimeout(entrada.timer);
      pendencias.delete(chave);
      const sucesso = gravarAgora(entrada.trilha, entrada.aula, entrada.ultimoValor);
      entrada.resolvers.forEach((resolverPendente) => resolverPendente(sucesso));
      resolve();
    })));
  }

  async function obterRespostasDaAula(trilha, aula) {
    return lerAulaSync(trilha, aula);
  }

  async function obterValorDeBloco(trilha, aula, blocoId) {
    const respostas = lerAulaSync(trilha, aula);
    return Object.prototype.hasOwnProperty.call(respostas, blocoId) ? respostas[blocoId] : undefined;
  }

  async function listarAulasConcluidas(trilha) {
    return lerIndiceSync().filter((item) => item.trilha === trilha).map((item) => item.aula);
  }

  async function exportarTudo() {
    const tudo = {};
    for (let i = 0; i < storage.length; i++) {
      const chave = storage.key(i);
      if (chave && chave.startsWith(PREFIXO)) {
        try {
          tudo[chave] = JSON.parse(storage.getItem(chave));
        } catch {
          console.warn(`Valor invalido em ${chave}, ignorado na exportacao.`);
        }
      }
    }
    return tudo;
  }

  function validarParaImportar(dados) {
    if (!dados || typeof dados !== 'object') {
      return { valido: false, motivo: 'Este arquivo não é válido.' };
    }
    const chaves = Object.keys(dados).filter((c) => c.startsWith(PREFIXO));
    if (chaves.length === 0) {
      return { valido: false, motivo: 'Este arquivo não contém respostas deste aplicativo.' };
    }
    const jaExistentes = chaves.filter((c) => c !== CHAVE_INDICE && storage.getItem(c) !== null);
    return { valido: true, chaves, jaExistentes };
  }

  async function importarTudo(dados, confirmado = false) {
    const validacao = validarParaImportar(dados);
    if (!validacao.valido || !confirmado) return validacao;
    for (const chave of validacao.chaves) {
      if (chave === CHAVE_INDICE) continue;
      storage.setItem(chave, JSON.stringify(dados[chave]));
    }
    if (validacao.chaves.includes(CHAVE_INDICE)) {
      const indiceAtual = lerIndiceSync();
      const indiceImportado = Array.isArray(dados[CHAVE_INDICE]) ? dados[CHAVE_INDICE] : [];
      const indiceUnido = [...indiceAtual];
      for (const item of indiceImportado) {
        if (!indiceUnido.some((existente) => existente.trilha === item.trilha && existente.aula === item.aula)) {
          indiceUnido.push(item);
        }
      }
      storage.setItem(CHAVE_INDICE, JSON.stringify(indiceUnido));
    }
    return { ...validacao, importado: true };
  }

  function estaIndisponivel() {
    return indisponivel;
  }

  return {
    salvarRespostasDaAula,
    obterRespostasDaAula,
    obterValorDeBloco,
    listarAulasConcluidas,
    exportarTudo,
    importarTudo,
    estaIndisponivel,
    descarregarPendencias
  };
}
