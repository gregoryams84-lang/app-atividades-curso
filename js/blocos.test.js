import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizarListaAberta,
  resolverOpcoesSelecao,
  avaliarRespostaCorreta,
  todosCamposPreenchidos,
  interpolarTexto,
  montarResumo
} from './blocos.js';

test('normalizarListaAberta preenche ate a quantidade de campos e apara espacos', () => {
  assert.deepEqual(normalizarListaAberta([' a ', 'b'], 3), ['a', 'b', '']);
});

test('resolverOpcoesSelecao usa opcoes estaticas quando nao ha opcoes_de_bloco', () => {
  const campo = { tipo: 'selecao', opcoes: ['Sim', 'Nao'] };
  assert.deepEqual(resolverOpcoesSelecao(campo, undefined), ['Sim', 'Nao']);
});

test('resolverOpcoesSelecao usa respostas do bloco referenciado e ignora vazios', () => {
  const campo = { tipo: 'selecao', opcoes_de_bloco: 'b3' };
  assert.deepEqual(resolverOpcoesSelecao(campo, ['tarefa 1', '', ' tarefa 2 ']), ['tarefa 1', 'tarefa 2']);
});

test('avaliarRespostaCorreta compara com o indice correto do bloco', () => {
  assert.equal(avaliarRespostaCorreta({ correta: 1 }, 1), true);
  assert.equal(avaliarRespostaCorreta({ correta: 1 }, 0), false);
});

test('todosCamposPreenchidos exige valor em todos os campos', () => {
  const campos = [{ id: 'a' }, { id: 'b' }];
  assert.equal(todosCamposPreenchidos(campos, { a: 'x', b: '3' }), true);
  assert.equal(todosCamposPreenchidos(campos, { a: 'x', b: '' }), false);
  assert.equal(todosCamposPreenchidos(campos, { a: 'x' }), false);
});

test('interpolarTexto substitui marcadores e formata numero com virgula', () => {
  assert.equal(interpolarTexto('Total: {total} minutos', { total: 105 }), 'Total: 105 minutos');
  assert.equal(interpolarTexto('Media: {media}', { media: 7.6 }), 'Media: 7,6');
});

test('montarResumo junta listas e textos de calculo, ignorando blocos vazios', () => {
  const blocos = [
    { id: 'b1', tipo: 'multipla_escolha' },
    { id: 'b3', tipo: 'lista_aberta', enunciado: 'Liste tarefas', quantidade_campos: 3 },
    { id: 'b4', tipo: 'calculo', enunciado: 'Calcule' }
  ];
  const respostas = {
    b1: 1,
    b3: ['tarefa 1', '', 'tarefa 2'],
    b4: { total: 105, resultadoTexto: 'Voce gasta 105 minutos por semana.' }
  };
  assert.deepEqual(montarResumo(blocos, respostas), [
    { tipo: 'lista', enunciado: 'Liste tarefas', valores: ['tarefa 1', 'tarefa 2'] },
    { tipo: 'texto', enunciado: 'Calcule', texto: 'Voce gasta 105 minutos por semana.' }
  ]);
});

test('montarResumo ignora bloco lista_aberta sem nenhuma resposta preenchida', () => {
  const blocos = [{ id: 'b3', tipo: 'lista_aberta', enunciado: 'Liste', quantidade_campos: 2 }];
  assert.deepEqual(montarResumo(blocos, { b3: ['', ''] }), []);
});
