export function criarResolvedorDependencias({ armazenamento, buscarAula }) {
  async function resolverDependencia(dependeDe, cadeiaVisitada = []) {
    const chave = `${dependeDe.trilha}:${dependeDe.aula}:${dependeDe.bloco}`;
    if (cadeiaVisitada.includes(chave)) {
      return { status: 'circular', valores: [] };
    }

    const dadosAula = await buscarAula(dependeDe.trilha, dependeDe.aula);
    const blocoFonte = dadosAula.blocos.find((b) => b.id === dependeDe.bloco);
    if (!blocoFonte) {
      return { status: 'bloco_inexistente', valores: [] };
    }

    if (blocoFonte.tipo === 'calculo') {
      for (const campo of blocoFonte.campos || []) {
        if (campo.depende_de) {
          const resultadoCadeia = await resolverDependencia(campo.depende_de, [...cadeiaVisitada, chave]);
          if (resultadoCadeia.status === 'circular') return resultadoCadeia;
        }
      }
    }

    const respostas = await armazenamento.obterRespostasDaAula(dependeDe.trilha, dependeDe.aula);
    const valor = respostas ? respostas[dependeDe.bloco] : undefined;
    if (valor === undefined) {
      return { status: 'aula_nao_respondida', valores: [] };
    }

    return {
      status: 'ok',
      valores: Array.isArray(valor) ? valor : [valor],
      tituloAula: dadosAula.titulo
    };
  }

  return { resolverDependencia };
}
