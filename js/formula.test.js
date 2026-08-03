import { test } from 'node:test';
import assert from 'node:assert/strict';
import { avaliarExpressao, avaliarCalculos } from './formula.js';

test('soma dois números', () => {
  assert.equal(avaliarExpressao('2 + 3', {}), 5);
});

test('respeita precedência de multiplicação sobre soma', () => {
  assert.equal(avaliarExpressao('2 + 3 * 4', {}), 14);
});

test('respeita parênteses', () => {
  assert.equal(avaliarExpressao('(2 + 3) * 4', {}), 20);
});

test('substitui identificadores pelo contexto', () => {
  assert.equal(avaliarExpressao('vezes_semana * minutos_vez', { vezes_semana: 3, minutos_vez: 10 }), 30);
});

test('identificador ausente vira zero', () => {
  assert.equal(avaliarExpressao('a + b', { a: 5 }), 5);
});

test('divisão por zero retorna zero em vez de Infinity', () => {
  assert.equal(avaliarExpressao('10 / x', { x: 0 }), 0);
});

test('suporta menos unário', () => {
  assert.equal(avaliarExpressao('-5 + 10', {}), 5);
});

test('rejeita caractere inválido', () => {
  assert.throws(() => avaliarExpressao('2 + $', {}));
});

test('avaliarCalculos resolve na ordem e reaproveita resultado anterior', () => {
  const resultado = avaliarCalculos(
    { total: 'vezes_semana * minutos_vez', horas: 'total * 4.345 / 60' },
    { vezes_semana: 7, minutos_vez: 15 }
  );
  assert.equal(resultado.total, 105);
  assert.ok(Math.abs(resultado.horas - 7.60375) < 0.0001);
});
