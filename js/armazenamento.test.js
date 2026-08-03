import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarArmazenamento } from './armazenamento.js';

function criarStorageFalso() {
  const mapa = new Map();
  return {
    getItem: (chave) => (mapa.has(chave) ? mapa.get(chave) : null),
    setItem: (chave, valor) => { mapa.set(chave, String(valor)); },
    get length() { return mapa.size; },
    key: (indice) => Array.from(mapa.keys())[indice] ?? null
  };
}

test('salva e recupera uma resposta', () => {
  const armazenamento = criarArmazenamento(criarStorageFalso());
  armazenamento.salvarResposta('trilha-ia', 'aula-01', 'b1', 1);
  assert.equal(armazenamento.obterResposta('trilha-ia', 'aula-01', 'b1'), 1);
});

test('resposta inexistente retorna undefined', () => {
  const armazenamento = criarArmazenamento(criarStorageFalso());
  assert.equal(armazenamento.obterResposta('trilha-ia', 'aula-01', 'b9'), undefined);
});

test('obterRespostasDaAula retorna todos os blocos salvos', () => {
  const armazenamento = criarArmazenamento(criarStorageFalso());
  armazenamento.salvarResposta('trilha-ia', 'aula-01', 'b1', 1);
  armazenamento.salvarResposta('trilha-ia', 'aula-01', 'b3', ['a', 'b']);
  assert.deepEqual(armazenamento.obterRespostasDaAula('trilha-ia', 'aula-01'), { b1: 1, b3: ['a', 'b'] });
});

test('respostas de aulas diferentes nao se misturam', () => {
  const armazenamento = criarArmazenamento(criarStorageFalso());
  armazenamento.salvarResposta('trilha-ia', 'aula-01', 'b1', 1);
  armazenamento.salvarResposta('trilha-ia', 'aula-02', 'b1', 2);
  assert.equal(armazenamento.obterResposta('trilha-ia', 'aula-01', 'b1'), 1);
  assert.equal(armazenamento.obterResposta('trilha-ia', 'aula-02', 'b1'), 2);
});

test('exportarTudo e importarTudo fazem um ciclo completo', () => {
  const origem = criarArmazenamento(criarStorageFalso());
  origem.salvarResposta('trilha-ia', 'aula-01', 'b1', 1);
  origem.salvarResposta('trilha-ia', 'aula-01', 'b3', ['x']);
  const exportado = origem.exportarTudo();

  const destino = criarArmazenamento(criarStorageFalso());
  destino.importarTudo(exportado);
  assert.deepEqual(destino.obterRespostasDaAula('trilha-ia', 'aula-01'), { b1: 1, b3: ['x'] });
});

test('exportarTudo ignora chaves que nao pertencem ao aplicativo', () => {
  const storage = criarStorageFalso();
  storage.setItem('outra-coisa', 'valor de outro site');
  const armazenamento = criarArmazenamento(storage);
  armazenamento.salvarResposta('trilha-ia', 'aula-01', 'b1', 1);
  const exportado = armazenamento.exportarTudo();
  assert.deepEqual(Object.keys(exportado), ['atividades:trilha-ia:aula-01']);
});
