import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarResolvedorDependencias } from './dependencias.js';

function criarArmazenamentoFalso(dados) {
  return {
    async obterRespostasDaAula(trilha, aula) {
      return dados[`${trilha}:${aula}`] || {};
    }
  };
}

function criarBuscarAulaFalso(aulas) {
  return async (trilha, aula) => {
    const encontrada = aulas[`${trilha}:${aula}`];
    if (!encontrada) throw new Error('aula nao encontrada nos fixtures de teste');
    return encontrada;
  };
}

test('resolve com sucesso quando o bloco existe no JSON atual e tem resposta salva', async () => {
  const aulas = { 'trilha-ia:aula-01': { titulo: 'Aula de teste', blocos: [{ id: 'b3', tipo: 'lista_aberta' }] } };
  const dados = { 'trilha-ia:aula-01': { b3: ['tarefa 1', 'tarefa 2'] } };
  const resolvedor = criarResolvedorDependencias({
    armazenamento: criarArmazenamentoFalso(dados),
    buscarAula: criarBuscarAulaFalso(aulas)
  });
  const resultado = await resolvedor.resolverDependencia({ trilha: 'trilha-ia', aula: 'aula-01', bloco: 'b3' });
  assert.deepEqual(resultado, { status: 'ok', valores: ['tarefa 1', 'tarefa 2'], tituloAula: 'Aula de teste' });
});

test('envolve um valor unico (nao array) numa lista de um item', async () => {
  const aulas = { 'trilha-ia:aula-01': { titulo: 'Aula de teste', blocos: [{ id: 'b5', tipo: 'escolha_simples' }] } };
  const dados = { 'trilha-ia:aula-01': { b5: 1 } };
  const resolvedor = criarResolvedorDependencias({
    armazenamento: criarArmazenamentoFalso(dados),
    buscarAula: criarBuscarAulaFalso(aulas)
  });
  const resultado = await resolvedor.resolverDependencia({ trilha: 'trilha-ia', aula: 'aula-01', bloco: 'b5' });
  assert.deepEqual(resultado, { status: 'ok', valores: [1], tituloAula: 'Aula de teste' });
});

test('aula ainda nao respondida: bloco existe no JSON mas nao ha resposta salva', async () => {
  const aulas = { 'trilha-ia:aula-01': { titulo: 'Aula de teste', blocos: [{ id: 'b3', tipo: 'lista_aberta' }] } };
  const resolvedor = criarResolvedorDependencias({
    armazenamento: criarArmazenamentoFalso({}),
    buscarAula: criarBuscarAulaFalso(aulas)
  });
  const resultado = await resolvedor.resolverDependencia({ trilha: 'trilha-ia', aula: 'aula-01', bloco: 'b3' });
  assert.deepEqual(resultado, { status: 'aula_nao_respondida', valores: [] });
});

test('bloco inexistente: o id nao esta mais no JSON atual da aula, mesmo com resposta salva antiga', async () => {
  const aulas = { 'trilha-ia:aula-01': { titulo: 'Aula de teste', blocos: [{ id: 'b9', tipo: 'lista_aberta' }] } };
  const dados = { 'trilha-ia:aula-01': { b3: ['resposta de uma versao anterior do conteudo'] } };
  const resolvedor = criarResolvedorDependencias({
    armazenamento: criarArmazenamentoFalso(dados),
    buscarAula: criarBuscarAulaFalso(aulas)
  });
  const resultado = await resolvedor.resolverDependencia({ trilha: 'trilha-ia', aula: 'aula-01', bloco: 'b3' });
  assert.deepEqual(resultado, { status: 'bloco_inexistente', valores: [] });
});

test('dependencia circular direta (A depende de B que depende de A) e detectada', async () => {
  const aulas = {
    'trilha-ia:aula-01': {
      titulo: 'Aula de teste',
      blocos: [
        { id: 'bA', tipo: 'calculo', campos: [{ id: 'x', depende_de: { trilha: 'trilha-ia', aula: 'aula-01', bloco: 'bB' } }] },
        { id: 'bB', tipo: 'calculo', campos: [{ id: 'y', depende_de: { trilha: 'trilha-ia', aula: 'aula-01', bloco: 'bA' } }] }
      ]
    }
  };
  const resolvedor = criarResolvedorDependencias({
    armazenamento: criarArmazenamentoFalso({}),
    buscarAula: criarBuscarAulaFalso(aulas)
  });
  const resultado = await resolvedor.resolverDependencia({ trilha: 'trilha-ia', aula: 'aula-01', bloco: 'bA' });
  assert.equal(resultado.status, 'circular');
});

test('um bloco calculo sem nenhum campo dependente nao entra na checagem de ciclo', async () => {
  const aulas = { 'trilha-ia:aula-01': { titulo: 'Aula de teste', blocos: [{ id: 'b4', tipo: 'calculo', campos: [{ id: 'x' }] }] } };
  const dados = { 'trilha-ia:aula-01': { b4: { x: 5, resultadoTexto: 'ok' } } };
  const resolvedor = criarResolvedorDependencias({
    armazenamento: criarArmazenamentoFalso(dados),
    buscarAula: criarBuscarAulaFalso(aulas)
  });
  const resultado = await resolvedor.resolverDependencia({ trilha: 'trilha-ia', aula: 'aula-01', bloco: 'b4' });
  assert.equal(resultado.status, 'ok');
});
