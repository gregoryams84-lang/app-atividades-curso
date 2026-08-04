import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extrairParametrosDeSessao, notificarConclusao } from './progresso-remoto.js';

test('extrai matricula, aula e token quando os tres parametros estao presentes', () => {
  const sessao = extrairParametrosDeSessao('?matricula_id=m1&aula_id=a1', '#tok=abc123');
  assert.deepEqual(sessao, { matriculaId: 'm1', aulaId: 'a1', token: 'abc123' });
});

test('decodifica o token quando ele vem url-encoded', () => {
  const sessao = extrairParametrosDeSessao('?matricula_id=m1&aula_id=a1', `#tok=${encodeURIComponent('a.b/c')}`);
  assert.equal(sessao.token, 'a.b/c');
});

test('retorna null quando falta o token no hash', () => {
  const sessao = extrairParametrosDeSessao('?matricula_id=m1&aula_id=a1', '');
  assert.equal(sessao, null);
});

test('retorna null quando falta matricula_id', () => {
  const sessao = extrairParametrosDeSessao('?aula_id=a1', '#tok=abc123');
  assert.equal(sessao, null);
});

test('retorna null quando falta aula_id', () => {
  const sessao = extrairParametrosDeSessao('?matricula_id=m1', '#tok=abc123');
  assert.equal(sessao, null);
});

test('notificarConclusao nao chama fetch quando sessao e null', async () => {
  let chamou = false;
  const resultado = await notificarConclusao(null, async () => { chamou = true; });
  assert.equal(resultado, false);
  assert.equal(chamou, false);
});

test('notificarConclusao envia bearer token e ids corretos, retorna true em sucesso', async () => {
  let urlChamada;
  let opcoesChamadas;
  const fetchFalso = async (url, opcoes) => {
    urlChamada = url;
    opcoesChamadas = opcoes;
    return { ok: true };
  };
  const resultado = await notificarConclusao({ matriculaId: 'm1', aulaId: 'a1', token: 'tok123' }, fetchFalso);
  assert.equal(resultado, true);
  assert.match(urlChamada, /\/rest\/v1\/progresso\?on_conflict=matricula_id,aula_id$/);
  assert.equal(opcoesChamadas.headers.Authorization, 'Bearer tok123');
  const corpo = JSON.parse(opcoesChamadas.body);
  assert.equal(corpo.matricula_id, 'm1');
  assert.equal(corpo.aula_id, 'a1');
  assert.equal(corpo.concluida, true);
});

test('notificarConclusao retorna false quando a resposta nao e ok, sem lancar erro', async () => {
  const fetchFalso = async () => ({ ok: false, status: 401 });
  const resultado = await notificarConclusao({ matriculaId: 'm1', aulaId: 'a1', token: 'tok123' }, fetchFalso);
  assert.equal(resultado, false);
});

test('notificarConclusao retorna false quando o fetch rejeita, sem lancar erro', async () => {
  const fetchFalso = async () => { throw new Error('sem rede'); };
  const resultado = await notificarConclusao({ matriculaId: 'm1', aulaId: 'a1', token: 'tok123' }, fetchFalso);
  assert.equal(resultado, false);
});
