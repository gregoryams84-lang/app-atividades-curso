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

test('salva e le respostas de uma aula', async () => {
  const armazenamento = criarArmazenamento(criarStorageFalso(), 5);
  await armazenamento.salvarRespostasDaAula('trilha-ia', 'aula-01', { b1: 1 });
  const respostas = await armazenamento.obterRespostasDaAula('trilha-ia', 'aula-01');
  assert.deepEqual(respostas, { b1: 1 });
});

test('chamadas rapidas dentro da janela de debounce salvam so o ultimo valor', async () => {
  const armazenamento = criarArmazenamento(criarStorageFalso(), 20);
  const p1 = armazenamento.salvarRespostasDaAula('trilha-ia', 'aula-01', { b1: 1 });
  const p2 = armazenamento.salvarRespostasDaAula('trilha-ia', 'aula-01', { b1: 1, b2: 2 });
  await Promise.all([p1, p2]);
  const respostas = await armazenamento.obterRespostasDaAula('trilha-ia', 'aula-01');
  assert.deepEqual(respostas, { b1: 1, b2: 2 });
});

test('respostas de aulas diferentes nao se misturam', async () => {
  const armazenamento = criarArmazenamento(criarStorageFalso(), 5);
  await armazenamento.salvarRespostasDaAula('trilha-ia', 'aula-01', { b1: 1 });
  await armazenamento.salvarRespostasDaAula('trilha-ia', 'aula-02', { b1: 2 });
  assert.deepEqual(await armazenamento.obterRespostasDaAula('trilha-ia', 'aula-01'), { b1: 1 });
  assert.deepEqual(await armazenamento.obterRespostasDaAula('trilha-ia', 'aula-02'), { b1: 2 });
});

test('obterValorDeBloco retorna undefined quando o bloco nao tem resposta', async () => {
  const armazenamento = criarArmazenamento(criarStorageFalso(), 5);
  const valor = await armazenamento.obterValorDeBloco('trilha-ia', 'aula-01', 'b9');
  assert.equal(valor, undefined);
});

test('obterValorDeBloco le um bloco especifico de uma aula ja salva', async () => {
  const armazenamento = criarArmazenamento(criarStorageFalso(), 5);
  await armazenamento.salvarRespostasDaAula('trilha-ia', 'aula-01', { b1: 1, b3: ['x'] });
  assert.deepEqual(await armazenamento.obterValorDeBloco('trilha-ia', 'aula-01', 'b3'), ['x']);
});

test('listarAulasConcluidas retorna as aulas com resposta salva de uma trilha', async () => {
  const armazenamento = criarArmazenamento(criarStorageFalso(), 5);
  await armazenamento.salvarRespostasDaAula('trilha-ia', 'aula-01', { b1: 1 });
  await armazenamento.salvarRespostasDaAula('trilha-ia', 'aula-02', { b1: 1 });
  await armazenamento.salvarRespostasDaAula('outra-trilha', 'aula-01', { b1: 1 });
  const aulas = await armazenamento.listarAulasConcluidas('trilha-ia');
  assert.deepEqual(aulas.sort(), ['aula-01', 'aula-02']);
});

test('exportarTudo inclui apenas chaves deste aplicativo', async () => {
  const storage = criarStorageFalso();
  storage.setItem('outra-coisa', 'valor de outro site');
  const armazenamento = criarArmazenamento(storage, 5);
  await armazenamento.salvarRespostasDaAula('trilha-ia', 'aula-01', { b1: 1 });
  const exportado = await armazenamento.exportarTudo();
  const chavesDeConteudo = Object.keys(exportado).filter((c) => !c.endsWith(':indice'));
  assert.deepEqual(chavesDeConteudo, ['toca:v1:trilha-ia:aula-01']);
});

test('importarTudo sem confirmar apenas valida e nao grava', async () => {
  const origem = criarArmazenamento(criarStorageFalso(), 5);
  await origem.salvarRespostasDaAula('trilha-ia', 'aula-01', { b1: 1 });
  const exportado = await origem.exportarTudo();

  const destinoStorage = criarStorageFalso();
  const destino = criarArmazenamento(destinoStorage, 5);
  const validacao = await destino.importarTudo(exportado);
  assert.equal(validacao.valido, true);
  assert.equal(destinoStorage.getItem('toca:v1:trilha-ia:aula-01'), null);
});

test('importarTudo confirmado grava os dados', async () => {
  const origem = criarArmazenamento(criarStorageFalso(), 5);
  await origem.salvarRespostasDaAula('trilha-ia', 'aula-01', { b1: 1 });
  const exportado = await origem.exportarTudo();

  const destino = criarArmazenamento(criarStorageFalso(), 5);
  await destino.importarTudo(exportado, true);
  assert.deepEqual(await destino.obterRespostasDaAula('trilha-ia', 'aula-01'), { b1: 1 });
});

test('importarTudo rejeita arquivo sem nenhuma chave reconhecida', async () => {
  const armazenamento = criarArmazenamento(criarStorageFalso(), 5);
  const validacao = await armazenamento.importarTudo({ qualquerCoisa: 1 });
  assert.equal(validacao.valido, false);
});

test('importarTudo informa quais chaves ja existem no destino, para pedir confirmacao', async () => {
  const destinoStorage = criarStorageFalso();
  const destino = criarArmazenamento(destinoStorage, 5);
  await destino.salvarRespostasDaAula('trilha-ia', 'aula-01', { b1: 'valor antigo' });

  const dadosParaImportar = { 'toca:v1:trilha-ia:aula-01': { b1: 'valor novo' } };
  const validacao = await destino.importarTudo(dadosParaImportar);
  assert.deepEqual(validacao.jaExistentes, ['toca:v1:trilha-ia:aula-01']);
});

test('jaExistentes nao conta a chave de indice como uma aula substituida', async () => {
  const origem = criarArmazenamento(criarStorageFalso(), 5);
  await origem.salvarRespostasDaAula('trilha-ia', 'aula-01', { b1: 1 });
  const exportado = await origem.exportarTudo();

  const destino = criarArmazenamento(criarStorageFalso(), 5);
  await destino.salvarRespostasDaAula('trilha-ia', 'aula-01', { b1: 'valor antigo' });
  const validacao = await destino.importarTudo(exportado);
  assert.deepEqual(validacao.jaExistentes, ['toca:v1:trilha-ia:aula-01']);
});

test('estaIndisponivel comeca falso e vira verdadeiro quando a gravacao falha', async () => {
  const storageQueFalha = {
    getItem: () => null,
    setItem: () => { throw new Error('armazenamento cheio'); },
    length: 0,
    key: () => null
  };
  const armazenamento = criarArmazenamento(storageQueFalha, 5);
  assert.equal(armazenamento.estaIndisponivel(), false);
  await armazenamento.salvarRespostasDaAula('trilha-ia', 'aula-01', { b1: 1 });
  assert.equal(armazenamento.estaIndisponivel(), true);
});

test('obterRespostasDaAula reflete o valor mais recente mesmo antes do debounce terminar', async () => {
  const armazenamento = criarArmazenamento(criarStorageFalso(), 50);
  const promessaGravar = armazenamento.salvarRespostasDaAula('trilha-ia', 'aula-01', { b3: ['tarefa nova'] });
  const respostasAntesDeSalvarTerminar = await armazenamento.obterRespostasDaAula('trilha-ia', 'aula-01');
  assert.deepEqual(respostasAntesDeSalvarTerminar, { b3: ['tarefa nova'] });
  await promessaGravar;
});

test('descarregarPendencias grava imediatamente uma escrita pendente, sem esperar o debounce', async () => {
  const storage = criarStorageFalso();
  const armazenamento = criarArmazenamento(storage, 5000);
  const promessaGravar = armazenamento.salvarRespostasDaAula('trilha-ia', 'aula-01', { b1: 1 });
  await armazenamento.descarregarPendencias();
  assert.equal(storage.getItem('toca:v1:trilha-ia:aula-01'), JSON.stringify({ b1: 1 }));
  const sucesso = await promessaGravar;
  assert.equal(sucesso, true);
});

test('descarregarPendencias sem nenhuma escrita pendente nao lanca erro', async () => {
  const armazenamento = criarArmazenamento(criarStorageFalso(), 5000);
  await assert.doesNotReject(() => armazenamento.descarregarPendencias());
});

test('exportarTudo ignora uma chave com JSON invalido e mantem as demais chaves validas', async () => {
  const storage = criarStorageFalso();
  storage.setItem('toca:v1:trilha-ia:aula-corrompida', 'isto nao e json valido {');
  const armazenamento = criarArmazenamento(storage, 5);
  await armazenamento.salvarRespostasDaAula('trilha-ia', 'aula-01', { b1: 1 });
  const exportado = await armazenamento.exportarTudo();
  assert.equal('toca:v1:trilha-ia:aula-corrompida' in exportado, false);
  assert.deepEqual(exportado['toca:v1:trilha-ia:aula-01'], { b1: 1 });
});

test('importarTudo confirmado mescla o indice do destino com o indice importado, em vez de sobrescrever', async () => {
  const destinoStorage = criarStorageFalso();
  const destino = criarArmazenamento(destinoStorage, 5);
  await destino.salvarRespostasDaAula('trilha-ia', 'aula-01', { b1: 1 });

  const origem = criarArmazenamento(criarStorageFalso(), 5);
  await origem.salvarRespostasDaAula('trilha-ia', 'aula-02', { b1: 2 });
  const exportadoOrigem = await origem.exportarTudo();

  await destino.importarTudo(exportadoOrigem, true);
  const indiceFinal = JSON.parse(destinoStorage.getItem('toca:v1:indice'));
  const ordenado = [...indiceFinal].sort((a, b) => a.aula.localeCompare(b.aula));
  assert.deepEqual(ordenado, [
    { trilha: 'trilha-ia', aula: 'aula-01' },
    { trilha: 'trilha-ia', aula: 'aula-02' }
  ]);
});
