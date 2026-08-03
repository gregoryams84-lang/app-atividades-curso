import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizarListaAberta,
  minimoPreenchidoAtingido,
  resolverOpcoesSelecao,
  avaliarRespostaCorreta,
  determinarNivelFeedback,
  todosCamposPreenchidos,
  interpolarTexto,
  montarArtefatoDaAula,
  blocoEstaCompleto,
  calcularProgresso
} from './blocos.js';

test('normalizarListaAberta preenche ate a quantidade de campos e apara espacos', () => {
  assert.deepEqual(normalizarListaAberta([' a ', 'b'], 3), ['a', 'b', '']);
});

test('minimoPreenchidoAtingido conta apenas campos com texto de verdade', () => {
  assert.equal(minimoPreenchidoAtingido(['a', '', '  '], 1), true);
  assert.equal(minimoPreenchidoAtingido(['', '', ''], 1), false);
  assert.equal(minimoPreenchidoAtingido(['a', 'b'], 2), true);
  assert.equal(minimoPreenchidoAtingido(['a', ''], 2), false);
});

test('resolverOpcoesSelecao apara espacos e remove vazios de uma lista ja resolvida', () => {
  assert.deepEqual(resolverOpcoesSelecao(['tarefa 1', '', ' tarefa 2 ']), ['tarefa 1', 'tarefa 2']);
  assert.deepEqual(resolverOpcoesSelecao(undefined), []);
});

test('avaliarRespostaCorreta compara com o indice correto do bloco', () => {
  assert.equal(avaliarRespostaCorreta({ correta: 1 }, 1), true);
  assert.equal(avaliarRespostaCorreta({ correta: 1 }, 0), false);
});

test('determinarNivelFeedback mostra so a dica na primeira tentativa errada e dica mais explicacao depois', () => {
  assert.equal(determinarNivelFeedback(1), 'dica');
  assert.equal(determinarNivelFeedback(2), 'dica_e_explicacao');
  assert.equal(determinarNivelFeedback(5), 'dica_e_explicacao');
});

test('todosCamposPreenchidos exige valor em todos os campos', () => {
  const campos = [{ id: 'a' }, { id: 'b' }];
  assert.equal(todosCamposPreenchidos(campos, { a: 'x', b: '3' }), true);
  assert.equal(todosCamposPreenchidos(campos, { a: 'x', b: '' }), false);
  assert.equal(todosCamposPreenchidos(campos, { a: 'x' }), false);
});

test('interpolarTexto formata numero com virgula e mostra indisponivel quando o valor e undefined', () => {
  assert.equal(interpolarTexto('Total: {total} minutos', { total: 105 }), 'Total: 105 minutos');
  assert.equal(interpolarTexto('Media: {media}', { media: 7.6 }), 'Media: 7,6');
  assert.equal(interpolarTexto('Total: {total}', { total: undefined }), 'Total: indisponível');
});

test('montarArtefatoDaAula junta listas e textos de calculo, ignorando blocos vazios', () => {
  const blocos = [
    { id: 'b1', tipo: 'cenario' },
    { id: 'b3', tipo: 'lista_aberta', enunciado: 'Liste tarefas', quantidade_campos: 3 },
    { id: 'b4', tipo: 'calculo', enunciado: 'Calcule' }
  ];
  const respostas = {
    b1: { indiceEscolhido: 1, tentativas: 0 },
    b3: ['tarefa 1', '', 'tarefa 2'],
    b4: { total: 105, resultadoTexto: 'Voce gasta 105 minutos por semana.' }
  };
  assert.deepEqual(montarArtefatoDaAula(blocos, respostas), [
    { tipo: 'lista', enunciado: 'Liste tarefas', valores: ['tarefa 1', 'tarefa 2'] },
    { tipo: 'texto', enunciado: 'Calcule', texto: 'Voce gasta 105 minutos por semana.' }
  ]);
});

test('montarArtefatoDaAula ignora bloco lista_aberta sem nenhuma resposta preenchida', () => {
  const blocos = [{ id: 'b3', tipo: 'lista_aberta', enunciado: 'Liste', quantidade_campos: 2 }];
  assert.deepEqual(montarArtefatoDaAula(blocos, { b3: ['', ''] }), []);
});

test('blocoEstaCompleto reconhece cada tipo de bloco pela sua propria regra', () => {
  assert.equal(blocoEstaCompleto({ tipo: 'cenario', correta: 1 }, { indiceEscolhido: 1, tentativas: 0 }), true);
  assert.equal(blocoEstaCompleto({ tipo: 'cenario', correta: 1 }, { indiceEscolhido: 0, tentativas: 1 }), false);
  assert.equal(blocoEstaCompleto({ tipo: 'cenario', correta: 1 }, undefined), false);
  assert.equal(blocoEstaCompleto({ tipo: 'lista_aberta', minimo_preenchido: 1 }, ['a', '', '']), true);
  assert.equal(blocoEstaCompleto({ tipo: 'lista_aberta', minimo_preenchido: 1 }, ['', '', '']), false);
  assert.equal(blocoEstaCompleto({ tipo: 'calculo' }, { resultadoTexto: 'texto' }), true);
  assert.equal(blocoEstaCompleto({ tipo: 'calculo' }, { total: 5 }), false);
  assert.equal(blocoEstaCompleto({ tipo: 'escolha_simples' }, 0), true);
  assert.equal(blocoEstaCompleto({ tipo: 'escolha_simples' }, undefined), false);
});

test('calcularProgresso retorna o indice do primeiro bloco incompleto', () => {
  const blocos = [
    { id: 'b1', tipo: 'cenario', correta: 1 },
    { id: 'b2', tipo: 'cenario', correta: 0 },
    { id: 'b3', tipo: 'escolha_simples' }
  ];
  assert.equal(calcularProgresso(blocos, {}), 0);
  assert.equal(calcularProgresso(blocos, { b1: { indiceEscolhido: 1, tentativas: 0 } }), 1);
  assert.equal(calcularProgresso(blocos, {
    b1: { indiceEscolhido: 1, tentativas: 0 },
    b2: { indiceEscolhido: 0, tentativas: 2 }
  }), 2);
});

test('calcularProgresso retorna o total de blocos quando todos estao completos', () => {
  const blocos = [{ id: 'b1', tipo: 'escolha_simples' }];
  assert.equal(calcularProgresso(blocos, { b1: 0 }), 1);
});
