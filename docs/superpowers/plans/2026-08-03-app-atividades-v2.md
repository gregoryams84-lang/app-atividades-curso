# App de Atividades Interativas v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the interactive-lesson engine as a step-per-screen wizard (URL hash reflects the current block, browser back/forward works natively), add a cross-lesson diagnostic page, versioned lesson JSON with validation, and a hardened async persistence layer — reusing the existing safe arithmetic evaluator and this lesson's pedagogical content, while replacing the v1 continuous-page navigation model entirely.

**Architecture:** Five ES modules under `js/`: `formula.js` (safe arithmetic, reused with one behavior change), `blocos.js` (pure per-block-type logic, including the new progress-derivation functions), `armazenamento.js` (the only module touching `localStorage`; async API, debounced writes, quota handling), `dependencias.js` (resolves cross-block/cross-lesson dependencies, with three explicit edge cases), and `app.js` (fetch, hash-based routing, per-type rendering, orchestration across `index.html`/`atividade.html`/`diagnostico.html`). Every block mounts fresh when its screen becomes active and unmounts when the student navigates away — there is no cross-screen live DOM dependency; a block that depends on an earlier one re-reads that block's *persisted* answer every time it mounts.

**Tech Stack:** Plain HTML/CSS/JS (ES modules via `<script type="module">`), one external dependency (Google Fonts — Inter), no bundler. Node.js is used only as a dev-time test runner (`node --test js/*.test.js` — a bare `node --test js/` directory argument fails on this Windows/Node setup) for the four pure/injectable modules — never required to run or serve the app itself.

## Global Constraints

- No framework, no build step — plain HTML/CSS/JS only.
- Exactly one external dependency allowed: a single Google Fonts stylesheet link loading two families — **Fraunces** (variable) and **Inter**. No other CDN dependency of any kind.
- Visual identity matches the company's existing institutional site, not a fresh choice for this app. **Fraunces only in headings** (`h1`, `h2`) — never in text the student must read carefully (block prompts, fields, feedback, labels). **Inter everywhere else.**
- Color palette, declared as CSS custom properties on `:root` and always referenced by variable, never hardcoded: `--verde: #14513C` (buttons, headings, progress bar), `--tinta: #16191C` (body text), `--papel: #F5F6F3` (background), `--neutro: #5B6560` (secondary text and error feedback), `--ambar: #8A5A12` (system warnings only — rare use). **Error feedback never uses red** — it uses `--neutro` at a heavier font weight (600) instead, since red signals failure/rejection and this product never fails a student.
- Must work when served by GitHub Pages. Opening the raw file from disk (`file://`) is not supported: `fetch` is blocked for local files by modern browsers — accepted trade-off, not a defect. Local testing requires a static server that preserves query strings and hash (`python3 -m http.server`; `npx serve` is unsuitable — it 301-redirects and drops query strings).
- Mobile-first; no horizontal scroll at 360px viewport width.
- No emoji, no mascot, no celebratory animation, no score/percentage/pass-fail message, anywhere.
- Body text minimum 17px, nothing below 13px anywhere (including fine print); buttons/inputs minimum 44px touch target.
- WCAG AA contrast; every field has an associated `<label for>`; full keyboard navigation; focus moves to the new block's content on every step change; `prefers-reduced-motion` disables the progress-bar width transition.
- All lesson content lives in versioned JSON under `dados/`; adding a lesson must never require writing JavaScript. No function in `js/` may contain logic specific to one lesson's content (a check like "if this is aula-01" is an architecture defect).
- No interface text shown to the student may use a technical term (`localStorage`, `JSON`, `sessão`, `cache`, etc.).
- `localStorage` is touched only inside `js/armazenamento.js`. Persistence key format: `toca:v1:{trilha}:{aula}` per lesson, plus `toca:v1:indice` (list of `{trilha, aula}` with saved answers). Writes are debounced ~500ms. A write failure (quota exceeded, private-browsing storage blocked) must not crash the app — it surfaces a plain-language, non-blocking warning and the activity stays usable for the rest of the session.
- No `eval`/`Function` string evaluation anywhere — arithmetic goes through the dedicated parser in `js/formula.js`.
- No block type may know about any other specific block type or lesson; a fifth block type must be addable by registering one new function in `js/app.js`'s dispatcher map, touching nothing else.
- Every unhandled state (invalid JSON, unknown block id, unmet dependency, storage unavailable) must render a plain-language message — never a blank screen.
- Reserved id prefix: none of `js/`'s reserved/internal concepts (there is no `_progresso`-style key in v2 — progress is always derived from saved answers, never stored as a separate counter) may collide with an authored block id.

---

### Task 1: `js/dependencias.js` — dependency resolution with edge cases

**Files:**
- Create: `js/dependencias.js`
- Test: `js/dependencias.test.js`

**Interfaces:**
- Consumes: an injected `armazenamento` object exposing `async obterRespostasDaAula(trilha, aula)`, and an injected `async buscarAula(trilha, aula)` function returning a parsed lesson JSON (`{ titulo, blocos: [...] }`).
- Produces: `criarResolvedorDependencias({ armazenamento, buscarAula })` returning `{ resolverDependencia(dependeDe, cadeiaVisitada = []) }`, where `dependeDe = { trilha, aula, bloco }`. Resolves to one of four shapes: `{ status: 'ok', valores: string[], tituloAula: string }`, `{ status: 'aula_nao_respondida', valores: [] }`, `{ status: 'bloco_inexistente', valores: [] }`, `{ status: 'circular', valores: [] }`. Consumed by `js/app.js`'s `calculo` renderer (Task 11).

- [ ] **Step 1: Write the failing tests**

Create `js/dependencias.test.js`:

```js
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test js/dependencias.test.js`
Expected: FAIL — `Cannot find module './dependencias.js'`.

- [ ] **Step 3: Write the implementation**

Create `js/dependencias.js`:

```js
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test js/dependencias.test.js`
Expected: PASS, all 6 tests green.

- [ ] **Step 5: Commit**

```bash
git add js/dependencias.js js/dependencias.test.js
git commit -m "Adiciona resolucao de dependencias entre blocos com os tres casos de borda"
```

---

### Task 2: `js/formula.js` — replace zero-fabrication with an "indisponível" signal

**Files:**
- Modify: `js/formula.js`
- Modify: `js/formula.test.js`

**Interfaces:**
- Produces (signature unchanged from before, behavior changed): `avaliarExpressao(expressao: string, contexto: Record<string, number>): number` — may now return `NaN`/`Infinity`/`-Infinity` instead of silently defaulting to `0`. `avaliarCalculos(calculos: Record<string, string>, valoresIniciais: Record<string, number>): Record<string, number | undefined>` — a non-finite result is now represented as `undefined` in the returned object, and that `undefined` propagates through any later formula in the same map that references it. Consumed by `js/app.js`'s `calculo` renderer (Task 11) and by `js/blocos.js`'s `interpolarTexto` (Task 3), which must render `undefined` as the word "indisponível".

- [ ] **Step 1: Update the test file (this changes existing behavior — write the new expectations first)**

Replace the contents of `js/formula.test.js`:

```js
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

test('identificador ausente produz um valor nao finito, nunca um numero inventado', () => {
  const resultado = avaliarExpressao('a + b', { a: 5 });
  assert.equal(Number.isNaN(resultado), true);
});

test('divisao por zero produz um valor nao finito, nunca um numero inventado', () => {
  const resultado = avaliarExpressao('10 / x', { x: 0 });
  assert.equal(Number.isFinite(resultado), false);
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

test('avaliarCalculos marca como indisponivel (undefined) quando o resultado nao e finito', () => {
  const resultado = avaliarCalculos({ total: '10 / x' }, { x: 0 });
  assert.equal(resultado.total, undefined);
});

test('avaliarCalculos propaga indisponibilidade para calculos seguintes que dependem do anterior', () => {
  const resultado = avaliarCalculos({ total: '10 / x', horas: 'total / 2' }, { x: 0 });
  assert.equal(resultado.total, undefined);
  assert.equal(resultado.horas, undefined);
});
```

- [ ] **Step 2: Run tests to verify the two new/changed tests fail against the current implementation**

Run: `node --test js/formula.test.js`
Expected: FAIL on `divisao por zero produz um valor nao finito...` (current code returns `0`, which IS finite), `identificador ausente produz um valor nao finito...` (current code returns `0`, not `NaN`), and the two `avaliarCalculos ... indisponivel` tests (current code never produces `undefined`).

- [ ] **Step 3: Update the implementation**

In `js/formula.js`, make these two changes:

1. In `fator()`, the `identificador` branch — replace:
```js
      const valor = contexto[token.nome];
      return typeof valor === 'number' && !Number.isNaN(valor) ? valor : 0;
```
with:
```js
      const valor = contexto[token.nome];
      return typeof valor === 'number' ? valor : NaN;
```

2. In `termo()`, the division branch — replace:
```js
      valor = operador === '*' ? valor * proximo : (proximo === 0 ? 0 : valor / proximo);
```
with:
```js
      valor = operador === '*' ? valor * proximo : valor / proximo;
```

3. Replace `avaliarCalculos` entirely:
```js
export function avaliarCalculos(calculos, valoresIniciais) {
  const contexto = { ...valoresIniciais };
  for (const nome of Object.keys(calculos)) {
    const valor = avaliarExpressao(calculos[nome], contexto);
    contexto[nome] = Number.isFinite(valor) ? valor : undefined;
  }
  return contexto;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test js/formula.test.js`
Expected: PASS, all 11 tests green.

- [ ] **Step 5: Commit**

```bash
git add js/formula.js js/formula.test.js
git commit -m "Substitui fabricacao de zero por sinalizador de indisponivel em calculos invalidos"
```

---

### Task 3: `js/blocos.js` — rewrite for v2 (progress derivation, minimum-filled gating, hint levels)

**Files:**
- Modify: `js/blocos.js` (full rewrite)
- Modify: `js/blocos.test.js` (full rewrite)

**Interfaces:**
- Consumes: none (pure).
- Produces: `normalizarListaAberta(valores, quantidadeCampos)`, `minimoPreenchidoAtingido(valores, minimo)`, `resolverOpcoesSelecao(valoresResolvidos)`, `avaliarRespostaCorreta(bloco, indiceEscolhido)`, `determinarNivelFeedback(numeroDaTentativaErrada)` → `'dica' | 'dica_e_explicacao'`, `todosCamposPreenchidos(campos, valores)`, `interpolarTexto(modelo, valores)`, `montarArtefatoDaAula(blocosDaAula, respostasDaAula)`, `blocoEstaCompleto(bloco, resposta)`, `calcularProgresso(blocos, respostas)`. All consumed by `js/app.js` in Tasks 7–14.
- **Answer shapes these functions assume** (also binding on `js/app.js`'s renderers): `cenario` → `{ indiceEscolhido: number, tentativas: number }`; `lista_aberta` → `string[]`; `calculo` → `{ ...valoresDosCampos, resultadoTexto: string }`; `escolha_simples` → `number` (the chosen option's index).

- [ ] **Step 1: Write the failing tests**

Replace the contents of `js/blocos.test.js`:

```js
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test js/blocos.test.js`
Expected: FAIL — several exports (`minimoPreenchidoAtingido`, `determinarNivelFeedback`, `montarArtefatoDaAula`, `blocoEstaCompleto`, `calcularProgresso`) don't exist yet, and `resolverOpcoesSelecao`'s signature changed.

- [ ] **Step 3: Write the implementation**

Replace the contents of `js/blocos.js`:

```js
export function normalizarListaAberta(valores, quantidadeCampos) {
  const normalizados = [];
  for (let i = 0; i < quantidadeCampos; i++) {
    const valor = valores[i];
    normalizados.push(typeof valor === 'string' ? valor.trim() : '');
  }
  return normalizados;
}

export function minimoPreenchidoAtingido(valores, minimo) {
  const preenchidos = valores.filter((v) => typeof v === 'string' && v.trim().length > 0).length;
  return preenchidos >= minimo;
}

export function resolverOpcoesSelecao(valoresResolvidos) {
  return (Array.isArray(valoresResolvidos) ? valoresResolvidos : [])
    .map((v) => (typeof v === 'string' ? v.trim() : String(v)))
    .filter((v) => v.length > 0);
}

export function avaliarRespostaCorreta(bloco, indiceEscolhido) {
  return indiceEscolhido === bloco.correta;
}

export function determinarNivelFeedback(numeroDaTentativaErrada) {
  return numeroDaTentativaErrada <= 1 ? 'dica' : 'dica_e_explicacao';
}

export function todosCamposPreenchidos(campos, valores) {
  return campos.every((campo) => {
    const valor = valores[campo.id];
    if (valor === undefined || valor === null) return false;
    if (typeof valor === 'string') return valor.trim().length > 0;
    if (typeof valor === 'number') return !Number.isNaN(valor);
    return false;
  });
}

function formatarNumero(valor) {
  if (typeof valor !== 'number') return String(valor);
  return Number.isInteger(valor) ? String(valor) : valor.toFixed(1).replace('.', ',');
}

export function interpolarTexto(modelo, valores) {
  return modelo.replace(/\{(\w+)\}/g, (correspondencia, nome) => {
    if (!(nome in valores)) return correspondencia;
    const valor = valores[nome];
    return valor === undefined ? 'indisponível' : formatarNumero(valor);
  });
}

export function montarArtefatoDaAula(blocosDaAula, respostasDaAula) {
  const itens = [];
  for (const bloco of blocosDaAula) {
    if (bloco.tipo === 'lista_aberta') {
      const valores = normalizarListaAberta(respostasDaAula[bloco.id] || [], bloco.quantidade_campos)
        .filter((v) => v.length > 0);
      if (valores.length > 0) {
        itens.push({ tipo: 'lista', enunciado: bloco.enunciado, valores });
      }
    }
    if (bloco.tipo === 'calculo') {
      const resposta = respostasDaAula[bloco.id];
      if (resposta && typeof resposta.resultadoTexto === 'string') {
        itens.push({ tipo: 'texto', enunciado: bloco.enunciado, texto: resposta.resultadoTexto });
      }
    }
  }
  return itens;
}

export function blocoEstaCompleto(bloco, resposta) {
  if (bloco.tipo === 'cenario') {
    return !!resposta && resposta.indiceEscolhido === bloco.correta;
  }
  if (bloco.tipo === 'lista_aberta') {
    return Array.isArray(resposta) && minimoPreenchidoAtingido(resposta, bloco.minimo_preenchido ?? 1);
  }
  if (bloco.tipo === 'calculo') {
    return !!resposta && typeof resposta.resultadoTexto === 'string';
  }
  if (bloco.tipo === 'escolha_simples') {
    return resposta !== undefined;
  }
  return false;
}

export function calcularProgresso(blocos, respostas) {
  for (let i = 0; i < blocos.length; i++) {
    if (!blocoEstaCompleto(blocos[i], respostas[blocos[i].id])) return i;
  }
  return blocos.length;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test js/blocos.test.js`
Expected: PASS, all 12 tests green.

- [ ] **Step 5: Commit**

```bash
git add js/blocos.js js/blocos.test.js
git commit -m "Reescreve funcoes de bloco: derivacao de progresso, minimo preenchido, niveis de dica"
```

---

### Task 4: `js/armazenamento.js` — rewrite as async, debounced, quota-aware

**Files:**
- Modify: `js/armazenamento.js` (full rewrite)
- Modify: `js/armazenamento.test.js` (full rewrite)

**Interfaces:**
- Consumes: none directly (takes an injected `storage` backend, `localStorage`-shaped: `getItem`/`setItem`/`length`/`key`).
- Produces: `criarArmazenamento(storage, atrasoMs = 500)` returning `{ salvarRespostasDaAula(trilha, aula, respostas): Promise<boolean>, obterRespostasDaAula(trilha, aula): Promise<object>, obterValorDeBloco(trilha, aula, blocoId): Promise<any>, listarAulasConcluidas(trilha): Promise<string[]>, exportarTudo(): Promise<object>, importarTudo(dados, confirmado = false): Promise<{valido, motivo?, chaves?, jaExistentes?, importado?}>, estaIndisponivel(): boolean }`. Consumed by `js/app.js` in Tasks 7–14 and by `js/dependencias.js`'s injected `armazenamento` argument (constructed in `js/app.js`, Task 8).
- **Read-after-write freshness matters here:** `js/dependencias.js` (Task 1) and the artifact panel (Task 8) call `obterRespostasDaAula` to read what a student just typed on a *different* screen a moment ago. Because writes are debounced ~500ms, a naive read straight from `storage` could return stale data for up to that long after the student navigates away mid-debounce. `obterRespostasDaAula`/`obterValorDeBloco` must therefore check the in-flight pending write first and return that, falling back to `storage` only when nothing is pending — see the implementation below.

- [ ] **Step 1: Write the failing tests**

Replace the contents of `js/armazenamento.test.js`:

```js
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test js/armazenamento.test.js`
Expected: FAIL — the exported function names and signatures don't match the current (v1) implementation.

- [ ] **Step 3: Write the implementation**

Replace the contents of `js/armazenamento.js`:

```js
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
      const entrada = { ultimoValor: respostas, resolvers: [resolve], timer: null };
      pendencias.set(chave, entrada);
      entrada.timer = agendarGravacao(trilha, aula, chave);
    });
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
        tudo[chave] = JSON.parse(storage.getItem(chave));
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
    const jaExistentes = chaves.filter((c) => storage.getItem(c) !== null);
    return { valido: true, chaves, jaExistentes };
  }

  async function importarTudo(dados, confirmado = false) {
    const validacao = validarParaImportar(dados);
    if (!validacao.valido || !confirmado) return validacao;
    for (const chave of validacao.chaves) {
      storage.setItem(chave, JSON.stringify(dados[chave]));
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
    estaIndisponivel
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test js/armazenamento.test.js`
Expected: PASS, all 13 tests green.

- [ ] **Step 5: Commit**

```bash
git add js/armazenamento.js js/armazenamento.test.js
git commit -m "Reescreve armazenamento como assincrono, com debounce e deteccao de indisponibilidade"
```

---

### Task 5: Conteúdo — `indice.json`, `aula-01.json` (schema v2), `modelo-aula.json`

**Files:**
- Modify: `dados/indice.json`
- Modify: `dados/trilha-ia/aula-01.json`
- Modify: `dados/modelo-aula.json`

**Interfaces:**
- Produces: the exact JSON shapes `js/app.js` (Tasks 7–14) expects: `indice.trilhas[].aulas[].{id,titulo,ordem,arquivo}`, and a lesson's `.schema_version`/`.titulo`/`.habilidade`/`.blocos[]` with `tipo` one of `cenario`, `lista_aberta`, `calculo`, `escolha_simples`.

- [ ] **Step 1: Replace `dados/indice.json`**

```json
{
  "trilhas": [
    {
      "id": "trilha-ia",
      "titulo": "IA no Negócio",
      "aulas": [
        {
          "id": "aula-01",
          "titulo": "Você já usa IA. O problema é como.",
          "ordem": 1,
          "arquivo": "dados/trilha-ia/aula-01.json"
        }
      ]
    }
  ]
}
```

- [ ] **Step 2: Replace `dados/trilha-ia/aula-01.json`**

```json
{
  "schema_version": 1,
  "trilha": "trilha-ia",
  "aula": "aula-01",
  "titulo": "Você já usa IA. O problema é como.",
  "habilidade": "Reconhecer, pelas três perguntas, se uma tarefa do seu negócio vale a pena automatizar.",
  "blocos": [
    {
      "id": "b1",
      "tipo": "cenario",
      "enunciado": "Um dono de pizzaria gasta cerca de 15 minutos por dia respondendo a mesma pergunta, \"vocês entregam no meu bairro?\". Pelas três perguntas da aula, essa tarefa é:",
      "opcoes": [
        "Não é candidata, é tempo demais para automatizar",
        "Candidata forte, porque repete, custa tempo e a resposta segue um padrão",
        "Não é candidata, porque atendimento nunca deve ser automatizado",
        "Falta informação para decidir"
      ],
      "correta": 1,
      "dica_erro": "Reveja o trecho dos 3:30 do vídeo.",
      "explicacao_erro": "As três perguntas são: repete, custa tempo, a resposta segue padrão.",
      "feedback_acerto": "Exato. Repete, soma tempo, e a resposta depende só do endereço — é padrão."
    },
    {
      "id": "b2",
      "tipo": "cenario",
      "enunciado": "A mesma pizzaria recebe uma reclamação de um cliente que pediu para um aniversário e a pizza chegou fria. Pelas três perguntas, essa tarefa é:",
      "opcoes": [
        "Candidata forte, porque reclamação sempre tem resposta pronta",
        "Não é candidata, porque depende de julgamento e do histórico daquele cliente",
        "Candidata, desde que a resposta seja revisada depois",
        "Falta informação para decidir"
      ],
      "correta": 1,
      "dica_erro": "Reveja o trecho dos 3:30 do vídeo.",
      "explicacao_erro": "Uma reclamação de aniversário não se repete do mesmo jeito e exige julgamento — não é padrão.",
      "feedback_acerto": "Isso. É rara e depende do seu julgamento. Automatizar aqui custa cliente."
    },
    {
      "id": "b3",
      "tipo": "lista_aberta",
      "enunciado": "Liste 5 tarefas que você repete no seu negócio toda semana. Escreva do jeito que você falaria, não precisa ser formal.",
      "quantidade_campos": 5,
      "minimo_preenchido": 1,
      "placeholders": [
        "responder quanto custa no WhatsApp",
        "montar o post da promoção",
        "lembrar de cobrar quem ficou devendo"
      ]
    },
    {
      "id": "b4",
      "tipo": "calculo",
      "enunciado": "Agora escolha UMA dessas cinco tarefas e responda.",
      "campos": [
        { "id": "tarefa", "tipo": "selecao", "rotulo": "Qual das cinco?", "depende_de": { "trilha": "trilha-ia", "aula": "aula-01", "bloco": "b3" } },
        { "id": "vezes_semana", "tipo": "numero", "rotulo": "Quantas vezes por semana você faz", "unidade": "vezes", "minimo": 0, "maximo": 999 },
        { "id": "minutos_vez", "tipo": "numero", "rotulo": "Quanto tempo leva cada vez, em minutos", "unidade": "minutos", "minimo": 0, "maximo": 999 },
        { "id": "resposta_padrao", "tipo": "selecao", "rotulo": "A resposta certa é quase sempre a mesma?", "opcoes": ["Sim", "Não", "Às vezes"] }
      ],
      "calculos": {
        "total": "vezes_semana * minutos_vez",
        "horas": "total * 4.345 / 60"
      },
      "resultado_texto": "Você gasta cerca de {total} minutos por semana, o que dá {horas} horas por mês."
    },
    {
      "id": "b5",
      "tipo": "escolha_simples",
      "enunciado": "Olhando o número que apareceu acima, essa tarefa vale ser atacada primeiro?",
      "opcoes": [
        "Sim, é a que mais me consome",
        "Não, tem outra da lista que é pior",
        "Ainda não sei"
      ]
    }
  ]
}
```

- [ ] **Step 3: Replace `dados/modelo-aula.json`**

```json
{
  "_leiame": [
    "Este arquivo é um modelo. Copie-o, renomeie e preencha para criar uma aula nova.",
    "Os campos que começam com _ (como este) são apenas explicação e são ignorados pelo aplicativo.",
    "schema_version é obrigatório: identifica a versão do formato deste arquivo. Deixe 1.",
    "Cada bloco tem um 'id' único e estável dentro da aula (b1, b2, b3...) — nunca renomeie ou reordene um id depois de publicado, as respostas dos alunos ficam guardadas por ele.",
    "Tipos disponíveis: cenario, lista_aberta, calculo, escolha_simples.",
    "Veja dados/trilha-ia/aula-01.json para um exemplo real e completo."
  ],
  "schema_version": 1,
  "trilha": "id-da-trilha",
  "aula": "id-da-aula",
  "titulo": "Título que aparece para o aluno",
  "habilidade": "Uma frase: o que o aluno passa a saber fazer depois desta aula.",
  "blocos": [
    {
      "_leiame": "Bloco de cenário: uma situação com uma resposta certa. Dica curta no primeiro erro; explicação completa a partir do segundo erro.",
      "id": "b1",
      "tipo": "cenario",
      "enunciado": "Descreva aqui a situação.",
      "opcoes": ["Primeira opção", "Segunda opção", "Terceira opção"],
      "correta": 0,
      "dica_erro": "Uma pista curta, com a referência de tempo do vídeo se fizer sentido.",
      "explicacao_erro": "A explicação completa, mostrada junto da dica a partir da segunda tentativa errada.",
      "feedback_acerto": "Texto mostrado quando o aluno acerta."
    },
    {
      "_leiame": "Bloco de lista aberta: respostas livres, um texto por campo.",
      "id": "b2",
      "tipo": "lista_aberta",
      "enunciado": "Escreva aqui a instrução.",
      "quantidade_campos": 3,
      "minimo_preenchido": 1,
      "placeholders": ["exemplo do primeiro campo", "exemplo do segundo campo"]
    },
    {
      "_leiame": "Bloco de cálculo: o aluno preenche números (ou escolhe opções) e vê um resultado calculado na hora.",
      "id": "b3",
      "tipo": "calculo",
      "enunciado": "Escreva aqui a instrução.",
      "campos": [
        {
          "_leiame": "Seleção alimentada pela resposta de um bloco lista_aberta anterior — pode ser desta mesma aula ou de uma aula anterior.",
          "id": "escolha",
          "tipo": "selecao",
          "rotulo": "Texto da pergunta deste campo",
          "depende_de": { "trilha": "id-da-trilha", "aula": "id-da-aula", "bloco": "b2" }
        },
        {
          "_leiame": "Seleção com opções fixas, escritas à mão.",
          "id": "frequencia",
          "tipo": "selecao",
          "rotulo": "Texto da pergunta deste campo",
          "opcoes": ["Sim", "Não", "Às vezes"]
        },
        {
          "_leiame": "Campo numérico. minimo/maximo são opcionais.",
          "id": "quantidade",
          "tipo": "numero",
          "rotulo": "Texto da pergunta deste campo",
          "unidade": "vezes",
          "minimo": 0,
          "maximo": 999
        }
      ],
      "_leiame_calculos": "Cada linha calcula um número novo a partir dos campos numéricos acima (tipo 'numero') ou de cálculos anteriores. Campos de seleção não entram na fórmula. Use apenas + - * / e parênteses. Se a conta não puder ser feita (por exemplo, dividir por zero), o resultado aparece como indisponível para o aluno, nunca um número inventado.",
      "calculos": {
        "total": "quantidade * 1"
      },
      "resultado_texto": "Frase final mostrada ao aluno. Use {total} para encaixar o número calculado."
    },
    {
      "_leiame": "Bloco de escolha simples: uma pergunta de autoavaliação, sem certo ou errado.",
      "id": "b4",
      "tipo": "escolha_simples",
      "enunciado": "Escreva aqui a pergunta.",
      "opcoes": ["Primeira opção", "Segunda opção", "Terceira opção"]
    }
  ]
}
```

- [ ] **Step 4: Verify the JSON is syntactically valid**

Run: `node -e "['dados/indice.json','dados/trilha-ia/aula-01.json','dados/modelo-aula.json'].forEach(f => JSON.parse(require('fs').readFileSync(f))); console.log('ok')"`
Expected: prints `ok` with no error.

- [ ] **Step 5: Commit**

```bash
git add dados/indice.json dados/trilha-ia/aula-01.json dados/modelo-aula.json
git commit -m "Reestrutura conteudo da Aula 1 e o modelo de aula para o schema v2"
```

---

### Task 6: Visual design — `css/estilo.css`, `css/impressao.css`, Google Fonts (Fraunces + Inter)

**Files:**
- Modify: `css/estilo.css` (full rewrite)
- Modify: `css/impressao.css` (full rewrite)

**Interfaces:**
- Produces: the class names Tasks 7–14 rely on: `.pagina`, `.cabecalho`, `.logo`, `.lista-trilhas`, `.trilha`, `.lista-aulas`, `.aula`, `.aula-estado`, `.aula-concluida`, `.aula-titulo`, `.botao-grande`, `.botao-secundario`, `.acoes-globais`, `.confirmacao-importar`, `.layout-atividade`, `.pagina-atividade`, `.habilidade`, `.aviso-armazenamento`, `.barra-progresso`, `.barra-progresso-preenchida`, `.barra-progresso-texto`, `.link-voltar`, `.bloco`, `.enunciado`, `.texto-apoio`, `.opcoes`, `.opcao`, `.opcao-selecionada`, `.feedback`, `.feedback-acerto`, `.feedback-erro`, `.rotulo-campo`, `.campo-texto`, `.campo-numero`, `.campo-selecao`, `.resultado-calculo`, `.painel-artefato`, `.botao-alternar-artefato`, `.conteudo-artefato`, `.artefato-item`, `.artefato-enunciado`, `.resultado-item`, `.resultado-enunciado`, `.mensagem-erro`, `.mensagem-carregando`, `.nao-imprimir`. Note: `barra-progresso`, `barra-progresso-preenchida`, `barra-progresso-texto`, `botao-alternar-artefato`, and `conteudo-artefato` are elements Task 8's HTML gives BOTH a matching `id` (for `js/app.js`'s `getElementById` calls) and this matching `class` (for these CSS rules) — the class selectors here are correct as written; don't "fix" them to `#id` selectors.
- **Identity note:** this palette and type system are not a new choice — they match the company's existing institutional site. Fraunces goes on `h1`/`h2` only; every other selector inherits the Inter body font. Error feedback (`.feedback-erro`) never uses red — it uses `--neutro` at font-weight 600.

- [ ] **Step 1: Replace `css/estilo.css`**

```css
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Inter:wght@400;600&display=swap');

:root {
  --verde: #14513C;
  --verde-escuro: #0F3A2B;
  --verde-claro: #E4EDE8;
  --tinta: #16191C;
  --papel: #F5F6F3;
  --neutro: #5B6560;
  --neutro-claro: #E9EBE8;
  --ambar: #8A5A12;
  --ambar-claro: #F3E7D6;
  --borda: #D9DCD8;
  --espaco-toque-minimo: 44px;
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  background: var(--papel);
  color: var(--tinta);
  font-family: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: 17px;
  line-height: 1.6;
  overflow-x: hidden;
}

.pagina { max-width: 640px; margin: 0 auto; padding: 24px 16px 64px; }

.cabecalho { margin-bottom: 24px; }
.logo { display: block; height: auto; }

h1, h2 { font-family: "Fraunces", serif; font-weight: 600; }
h1 { font-size: 26px; margin: 0 0 8px; }
h2 { font-size: 21px; margin: 0 0 12px; }

.texto-apoio { color: var(--neutro); margin: 0 0 16px; }
.mensagem-erro { background: var(--neutro-claro); color: var(--tinta); border-radius: 8px; padding: 16px; font-size: 18px; }
.mensagem-carregando { color: var(--neutro); padding: 16px 0; }

.lista-trilhas { display: flex; flex-direction: column; gap: 32px; }
.trilha { display: flex; flex-direction: column; gap: 12px; }
.lista-aulas { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
.aula { display: flex; flex-direction: column; gap: 4px; padding: 12px; border: 1px solid var(--borda); border-radius: 8px; }
.aula-estado { font-size: 14px; font-weight: 600; color: var(--neutro); }
.aula-concluida .aula-estado { color: var(--verde); }
.aula-titulo { color: var(--verde); font-size: 17px; font-weight: 600; text-decoration: none; }
.aula-titulo:hover { text-decoration: underline; }

.botao-grande {
  display: block;
  width: 100%;
  min-height: var(--espaco-toque-minimo);
  padding: 14px 16px;
  font-size: 18px;
  font-weight: 600;
  text-align: center;
  text-decoration: none;
  color: var(--papel);
  background: var(--verde);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-family: inherit;
}
.botao-grande:hover { background: var(--verde-escuro); }
.botao-grande:focus-visible { outline: 3px solid var(--tinta); outline-offset: 2px; }
.botao-grande[hidden] { display: none; }

.botao-secundario { display: inline-block; color: var(--verde); font-weight: 600; text-decoration: none; margin-top: 4px; }
.botao-secundario:hover { text-decoration: underline; }

.acoes-globais { margin-top: 40px; padding-top: 24px; border-top: 1px solid var(--borda); display: flex; flex-direction: column; gap: 12px; }
.confirmacao-importar { padding: 16px; border: 1px solid var(--borda); border-radius: 8px; margin-top: 8px; display: flex; flex-direction: column; gap: 12px; }
.confirmacao-importar[hidden] { display: none; }

.layout-atividade { display: flex; flex-direction: column; }
.pagina-atividade { flex: 1; }

.habilidade { font-size: 15px; color: var(--neutro); margin: 0 auto 16px; padding: 0 16px; max-width: 640px; }

.aviso-armazenamento { background: var(--ambar-claro); color: var(--ambar); border-radius: 8px; padding: 12px 16px; font-size: 15px; max-width: 640px; margin: 0 auto 16px; }

.barra-progresso { max-width: 640px; margin: 0 auto; background: var(--neutro-claro); border-radius: 999px; height: 10px; overflow: hidden; }
.barra-progresso-preenchida { background: var(--verde); height: 100%; transition: width 0.3s ease; }
.barra-progresso-texto { max-width: 640px; margin: 6px auto 24px; padding: 0 16px; font-size: 14px; color: var(--neutro); }

.link-voltar { display: inline-block; color: var(--verde); font-weight: 600; text-decoration: none; margin-bottom: 16px; }
.link-voltar:hover { text-decoration: underline; }

.bloco { padding: 0 0 20px; }
.enunciado { font-size: 20px; font-weight: 600; margin: 0 0 16px; font-family: inherit; }

.opcoes { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
.opcao {
  min-height: var(--espaco-toque-minimo); padding: 12px 16px; font-size: 17px; text-align: left;
  background: var(--papel); color: var(--tinta); border: 2px solid var(--borda); border-radius: 8px; cursor: pointer;
  font-family: inherit;
}
.opcao:focus-visible { outline: 3px solid var(--tinta); outline-offset: 2px; }
.opcao-selecionada { border-color: var(--verde); background: var(--verde-claro); }

.feedback { padding: 14px 16px; border-radius: 8px; font-size: 17px; margin-bottom: 16px; }
.feedback[hidden] { display: none; }
.feedback-acerto { background: var(--verde-claro); color: var(--verde); }
.feedback-erro { background: var(--neutro-claro); color: var(--neutro); font-weight: 600; }

.rotulo-campo { display: block; font-size: 16px; font-weight: 600; margin: 12px 0 6px; }
.campo-texto, .campo-numero, .campo-selecao {
  display: block; width: 100%; min-height: var(--espaco-toque-minimo); padding: 10px 12px; font-size: 17px;
  border: 2px solid var(--borda); border-radius: 8px; margin-bottom: 8px; font-family: inherit; color: var(--tinta); background: var(--papel);
}
.campo-texto:focus-visible, .campo-numero:focus-visible, .campo-selecao:focus-visible { outline: 3px solid var(--verde); outline-offset: 1px; }

.resultado-calculo { font-size: 18px; font-weight: 600; background: var(--verde-claro); color: var(--verde); border-radius: 8px; padding: 14px 16px; margin: 12px 0 16px; }
.resultado-calculo[hidden] { display: none; }

.painel-artefato { max-width: 640px; margin: 24px auto 0; padding: 0 16px; }
.painel-artefato[hidden] { display: none; }
.botao-alternar-artefato {
  width: 100%; min-height: var(--espaco-toque-minimo); padding: 12px 16px; font-size: 16px; font-weight: 600;
  background: var(--neutro-claro); color: var(--tinta); border: 1px solid var(--borda); border-radius: 8px; cursor: pointer; text-align: left;
  font-family: inherit;
}
.conteudo-artefato { padding: 16px; border: 1px solid var(--borda); border-top: none; border-radius: 0 0 8px 8px; }
.conteudo-artefato[hidden] { display: none; }
.artefato-item { margin-bottom: 16px; }
.artefato-item:last-child { margin-bottom: 0; }
.artefato-enunciado { font-weight: 600; margin-bottom: 6px; font-size: 15px; }

.resultado-item { margin-bottom: 28px; padding-bottom: 20px; border-bottom: 1px solid var(--borda); }
.resultado-item:last-child { border-bottom: none; }
.resultado-enunciado { font-weight: 600; margin-bottom: 8px; }

@media (min-width: 800px) {
  .layout-atividade { flex-direction: row; align-items: flex-start; gap: 32px; max-width: 900px; margin: 0 auto; padding: 24px 16px; }
  .pagina-atividade { max-width: 640px; padding: 0; }
  .painel-artefato { position: sticky; top: 24px; width: 280px; margin: 0; padding: 0; flex-shrink: 0; }
  .botao-alternar-artefato { display: none; }
  .conteudo-artefato[hidden] { display: block; }
}

@media (min-width: 480px) {
  .enunciado { font-size: 22px; }
}

@media (prefers-reduced-motion: reduce) {
  .barra-progresso-preenchida { transition: none; }
}
```

- [ ] **Step 2: Replace `css/impressao.css`**

```css
@media print {
  .barra-progresso,
  .barra-progresso-texto,
  .habilidade,
  .painel-artefato,
  .link-voltar,
  .bloco,
  .aviso-armazenamento,
  .nao-imprimir,
  #botao-imprimir {
    display: none !important;
  }

  body { color: var(--tinta); background: #FFFFFF; }

  .resultado-item { border-top: none; padding-top: 0; }
}
```

- [ ] **Step 3: Manual check at 360px**

Serve the project (`python3 -m http.server 8000`), open `index.html` in a browser with devtools set to 360×640. Expected: no horizontal scrollbar, both fonts load (confirm in devtools Network tab — a request to `fonts.googleapis.com`/`fonts.gstatic.com` succeeds; the page's own `h1` renders visibly serif/Fraunces-styled, distinct from the sans-serif Inter body text), generous margins, no visual regressions from the (still content-empty) page.

- [ ] **Step 4: Commit**

```bash
git add css/estilo.css css/impressao.css
git commit -m "Reescreve estilo para layout de tela-por-bloco: identidade Fraunces+Inter e paleta verde/tinta/papel/neutro/ambar"
```

---

### Task 7: `index.html` + painel da trilha

**Files:**
- Modify: `index.html`
- Modify: `js/app.js` (rewrite `iniciarPaginaInicial`; this task starts the v2 `app.js` from scratch, replacing the entire v1 file)

**Interfaces:**
- Consumes: `criarArmazenamento` (Task 4), `calcularProgresso` (Task 3).
- Produces: `buscarJson(caminho)`, `iniciarPaginaInicial()`, and the shared module-level `const armazenamento = criarArmazenamento(window.localStorage);` that Tasks 8–14 all reuse from the top of `js/app.js`.

- [ ] **Step 1: Replace `index.html`**

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Atividades do curso</title>
  <link rel="icon" href="img/favicon-32.png" sizes="32x32">
  <link rel="apple-touch-icon" href="img/icone-180.png">
  <link rel="stylesheet" href="css/estilo.css">
</head>
<body>
  <main class="pagina">
    <header class="cabecalho">
      <img src="img/logo-completo-verde.svg" alt="Toca o Negócio" width="150" height="62" class="logo">
    </header>
    <h1>Atividades do curso</h1>
    <div id="lista-trilhas" class="lista-trilhas" aria-live="polite"></div>
    <div class="acoes-globais">
      <button type="button" id="botao-exportar" class="botao-grande">Salvar uma cópia das minhas respostas</button>
      <button type="button" id="botao-importar" class="botao-grande">Recuperar minhas respostas de outro celular</button>
      <input type="file" id="entrada-importar" accept="application/json" hidden>
      <div id="confirmacao-importar" class="confirmacao-importar" hidden></div>
    </div>
  </main>
  <script type="module" src="js/app.js"></script>
</body>
</html>
```

(The export/import buttons are wired in Task 14 — they are inert markup until then.)

- [ ] **Step 2: Write the start of `js/app.js`**

Create `js/app.js` (this replaces the entire v1 file) with:

```js
import { criarArmazenamento } from './armazenamento.js';
import { calcularProgresso } from './blocos.js';

const armazenamento = criarArmazenamento(window.localStorage);

async function buscarJson(caminho) {
  const resposta = await fetch(caminho);
  if (!resposta.ok) throw new Error(`Falha ao buscar ${caminho}`);
  return resposta.json();
}

function criarBotaoGrande(texto, aoClicar) {
  const botao = document.createElement('button');
  botao.type = 'button';
  botao.className = 'botao-grande';
  botao.textContent = texto;
  botao.addEventListener('click', aoClicar);
  return botao;
}

async function iniciarPaginaInicial() {
  const listaTrilhas = document.getElementById('lista-trilhas');
  if (!listaTrilhas) return;
  try {
    const indice = await buscarJson('dados/indice.json');
    listaTrilhas.innerHTML = '';
    for (const trilha of indice.trilhas) {
      const secao = document.createElement('section');
      secao.className = 'trilha';

      const titulo = document.createElement('h2');
      titulo.textContent = trilha.titulo;
      secao.appendChild(titulo);

      const aulasOrdenadas = [...trilha.aulas].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
      const lista = document.createElement('ul');
      lista.className = 'lista-aulas';
      let proximaPendente = null;

      for (const aula of aulasOrdenadas) {
        const dadosAula = await buscarJson(aula.arquivo);
        const respostas = await armazenamento.obterRespostasDaAula(trilha.id, aula.id);
        const progresso = calcularProgresso(dadosAula.blocos, respostas);
        const estado = progresso === 0 ? 'nao-iniciada' : progresso >= dadosAula.blocos.length ? 'concluida' : 'em-andamento';
        if (estado !== 'concluida' && !proximaPendente) proximaPendente = aula;

        const item = document.createElement('li');
        item.className = `aula aula-${estado}`;
        const rotuloEstado = document.createElement('span');
        rotuloEstado.className = 'aula-estado';
        rotuloEstado.textContent = estado === 'nao-iniciada' ? 'Não iniciada' : estado === 'em-andamento' ? 'Em andamento' : 'Concluída';
        const link = document.createElement('a');
        link.className = 'aula-titulo';
        link.href = `atividade.html?trilha=${trilha.id}&aula=${aula.id}`;
        link.textContent = aula.titulo;
        item.appendChild(rotuloEstado);
        item.appendChild(link);
        lista.appendChild(item);
      }
      secao.appendChild(lista);

      if (proximaPendente) {
        const botao = document.createElement('a');
        botao.className = 'botao-grande';
        botao.href = `atividade.html?trilha=${trilha.id}&aula=${proximaPendente.id}`;
        botao.textContent = `Continuar: ${proximaPendente.titulo}`;
        secao.insertBefore(botao, lista);
      }

      const linkDiagnostico = document.createElement('a');
      linkDiagnostico.className = 'botao-secundario';
      linkDiagnostico.href = `diagnostico.html?trilha=${trilha.id}`;
      linkDiagnostico.textContent = 'Ver o que você já construiu';
      secao.appendChild(linkDiagnostico);

      listaTrilhas.appendChild(secao);
    }
  } catch {
    listaTrilhas.innerHTML = '<p class="mensagem-erro">Não foi possível carregar as aulas agora. Tente novamente em instantes.</p>';
  }
}

iniciarPaginaInicial();
```

- [ ] **Step 3: Manual test**

Serve the project (`python3 -m http.server 8000`), open `index.html` with cleared `localStorage`. Expected: the "Toca o Negócio" logo (`img/logo-completo-verde.svg`) renders above the heading, the browser tab shows the favicon (`img/favicon-32.png`), heading "IA no Negócio", one row "Não iniciada — Você já usa IA. O problema é como.", and a button "Continuar: Você já usa IA. O problema é como." pointing at `atividade.html?trilha=trilha-ia&aula=aula-01`, plus a "Ver o que você já construiu" link to `diagnostico.html?trilha=trilha-ia`.

- [ ] **Step 4: Commit**

```bash
git add index.html js/app.js
git commit -m "Reescreve pagina inicial: painel da trilha com estado por aula e botao de retomada"
```

---

### Task 8: `atividade.html` bootstrap — hash routing, schema validation, states, artifact panel

**Files:**
- Modify: `atividade.html`
- Modify: `js/app.js`

**Interfaces:**
- Consumes: `criarResolvedorDependencias` (Task 1), `montarArtefatoDaAula`, `calcularProgresso` (Task 3), `criarArmazenamento`/module-level `armazenamento` (Task 4/7).
- Produces: `iniciarAtividade()`; the `ctx` object shape passed to every block renderer — `{ trilha, aula, respostaSalva, salvarResposta(blocoId, valor): Promise<void>, resolvedorDependencias: {resolverDependencia}, ehUltimoBloco: boolean, aoAvancar: () => void }` — Tasks 9–12 consume this exactly. `renderizarBloco(bloco, ctx): Promise<HTMLElement>` dispatcher (only throws for now — Tasks 9–12 register the four branches).

- [ ] **Step 1: Replace `atividade.html`**

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Atividade</title>
  <link rel="icon" href="img/favicon-32.png" sizes="32x32">
  <link rel="apple-touch-icon" href="img/icone-180.png">
  <link rel="stylesheet" href="css/estilo.css">
  <link rel="stylesheet" href="css/impressao.css" media="print">
</head>
<body>
  <div class="layout-atividade">
    <main class="pagina pagina-atividade">
      <p id="habilidade" class="habilidade"></p>
      <div id="barra-progresso" class="barra-progresso" hidden>
        <div id="barra-progresso-preenchida" class="barra-progresso-preenchida"></div>
      </div>
      <p id="barra-progresso-texto" class="barra-progresso-texto"></p>
      <div id="conteudo-bloco" aria-live="polite" tabindex="-1"></div>
    </main>
    <aside id="painel-artefato" class="painel-artefato" hidden>
      <button type="button" id="botao-alternar-artefato" class="botao-alternar-artefato" aria-expanded="false">
        Ver o que você já escreveu
      </button>
      <div id="conteudo-artefato" class="conteudo-artefato" hidden></div>
    </aside>
  </div>
  <script type="module" src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Add imports and shared helpers to `js/app.js`**

At the top, alongside the existing imports:

```js
import { criarResolvedorDependencias } from './dependencias.js';
import { montarArtefatoDaAula } from './blocos.js';
```

(`calcularProgresso` and `criarArmazenamento` are already imported from Task 7 — extend that import line rather than duplicating it: `import { calcularProgresso, montarArtefatoDaAula } from './blocos.js';`.)

Add these helpers below `criarBotaoGrande`:

```js
const VERSOES_SUPORTADAS = [1];

function mostrarErroAtividade(mensagem) {
  const conteudo = document.getElementById('conteudo-bloco');
  const barra = document.getElementById('barra-progresso');
  if (barra) barra.hidden = true;
  conteudo.innerHTML = `<p class="mensagem-erro">${mensagem}</p>`;
}

function mostrarCarregando() {
  const conteudo = document.getElementById('conteudo-bloco');
  conteudo.innerHTML = '<p class="mensagem-carregando">Carregando...</p>';
}

function mostrarAvisoArmazenamentoIndisponivel() {
  const pagina = document.querySelector('.pagina-atividade');
  if (!pagina || pagina.querySelector('.aviso-armazenamento')) return;
  const aviso = document.createElement('p');
  aviso.className = 'aviso-armazenamento';
  aviso.textContent = 'Não estamos conseguindo salvar suas respostas agora — você ainda pode continuar, mas anote suas respostas por garantia.';
  pagina.prepend(aviso);
}

function pegarParametrosDaUrl() {
  const parametros = new URLSearchParams(window.location.search);
  return { trilha: parametros.get('trilha'), aula: parametros.get('aula') };
}

function pegarIndiceDoHash(totalDeBlocos) {
  const combinacao = /^#bloco-(\d+)$/.exec(window.location.hash);
  if (!combinacao) return 0;
  const indice = parseInt(combinacao[1], 10) - 1;
  if (Number.isNaN(indice) || indice < 0 || indice >= totalDeBlocos) return 0;
  return indice;
}

function renderizarBloco(bloco, ctx) {
  throw new Error(`Tipo de bloco desconhecido: ${bloco.tipo}`);
}
```

- [ ] **Step 3: Add `iniciarAtividade`**

```js
async function iniciarAtividade() {
  const conteudo = document.getElementById('conteudo-bloco');
  if (!conteudo) return;

  const { trilha, aula } = pegarParametrosDaUrl();
  if (!trilha || !aula) {
    mostrarErroAtividade('Não encontramos esta atividade. Volte para a área de membros e clique no link novamente.');
    return;
  }

  mostrarCarregando();

  let indice;
  try {
    indice = await buscarJson('dados/indice.json');
  } catch {
    mostrarErroAtividade('Não foi possível carregar as atividades agora. Tente novamente em instantes.');
    return;
  }

  const trilhaEncontrada = indice.trilhas.find((t) => t.id === trilha);
  const aulaEncontrada = trilhaEncontrada && trilhaEncontrada.aulas.find((a) => a.id === aula);
  if (!aulaEncontrada) {
    mostrarErroAtividade('Não encontramos esta atividade. Volte para a área de membros e clique no link novamente.');
    return;
  }

  let dadosAula;
  try {
    dadosAula = await buscarJson(aulaEncontrada.arquivo);
  } catch {
    mostrarErroAtividade('Não foi possível carregar esta atividade agora. Tente novamente em instantes.');
    return;
  }

  if (!VERSOES_SUPORTADAS.includes(dadosAula.schema_version)) {
    console.error(`Versão de conteúdo não reconhecida: ${dadosAula.schema_version} em ${aulaEncontrada.arquivo}`);
    mostrarErroAtividade('Esta atividade precisa de uma versão mais nova do aplicativo. Tente novamente mais tarde.');
    return;
  }

  if (armazenamento.estaIndisponivel()) {
    mostrarAvisoArmazenamentoIndisponivel();
  }

  const habilidade = document.getElementById('habilidade');
  habilidade.textContent = dadosAula.habilidade || '';

  const resolvedorDependencias = criarResolvedorDependencias({
    armazenamento,
    buscarAula: async (t, a) => {
      const trilhaAlvo = indice.trilhas.find((tr) => tr.id === t);
      const aulaAlvo = trilhaAlvo && trilhaAlvo.aulas.find((au) => au.id === a);
      if (!aulaAlvo) throw new Error(`Aula não encontrada no índice: ${t}/${a}`);
      return buscarJson(aulaAlvo.arquivo);
    }
  });

  const painelArtefato = document.getElementById('painel-artefato');
  const conteudoArtefato = document.getElementById('conteudo-artefato');
  const botaoAlternarArtefato = document.getElementById('botao-alternar-artefato');
  botaoAlternarArtefato.addEventListener('click', () => {
    const abrindo = conteudoArtefato.hidden;
    conteudoArtefato.hidden = !abrindo;
    botaoAlternarArtefato.setAttribute('aria-expanded', String(abrindo));
  });

  async function atualizarArtefato(indiceAtual) {
    const respostas = await armazenamento.obterRespostasDaAula(trilha, aula);
    const blocosAnteriores = dadosAula.blocos.slice(0, indiceAtual);
    const itens = montarArtefatoDaAula(blocosAnteriores, respostas);
    conteudoArtefato.innerHTML = '';
    if (itens.length === 0) {
      painelArtefato.hidden = true;
      return;
    }
    painelArtefato.hidden = false;
    for (const item of itens) {
      const bloco = document.createElement('div');
      bloco.className = 'artefato-item';
      const enunciado = document.createElement('p');
      enunciado.className = 'artefato-enunciado';
      enunciado.textContent = item.enunciado;
      bloco.appendChild(enunciado);
      if (item.tipo === 'lista') {
        const lista = document.createElement('ul');
        for (const valor of item.valores) {
          const li = document.createElement('li');
          li.textContent = valor;
          lista.appendChild(li);
        }
        bloco.appendChild(lista);
      } else {
        const texto = document.createElement('p');
        texto.textContent = item.texto;
        bloco.appendChild(texto);
      }
      conteudoArtefato.appendChild(bloco);
    }
  }

  function atualizarBarraProgresso(indiceAtual, total) {
    const barra = document.getElementById('barra-progresso');
    const preenchida = document.getElementById('barra-progresso-preenchida');
    const texto = document.getElementById('barra-progresso-texto');
    barra.hidden = false;
    const passo = Math.min(indiceAtual + 1, total);
    preenchida.style.width = `${Math.round((passo / total) * 100)}%`;
    texto.textContent = `Passo ${passo} de ${total}`;
  }

  async function salvarResposta(blocoId, valor) {
    const atuais = await armazenamento.obterRespostasDaAula(trilha, aula);
    const sucesso = await armazenamento.salvarRespostasDaAula(trilha, aula, { ...atuais, [blocoId]: valor });
    if (!sucesso) mostrarAvisoArmazenamentoIndisponivel();
  }

  function avancar(indiceAtual) {
    const proximo = indiceAtual + 1;
    if (proximo >= dadosAula.blocos.length) {
      window.location.href = 'index.html';
      return;
    }
    window.location.hash = `#bloco-${proximo + 1}`;
  }

  async function renderizarPasso() {
    const respostas = await armazenamento.obterRespostasDaAula(trilha, aula);
    const progresso = calcularProgresso(dadosAula.blocos, respostas);
    let indiceDesejado = pegarIndiceDoHash(dadosAula.blocos.length);
    if (indiceDesejado > progresso) {
      indiceDesejado = progresso < dadosAula.blocos.length ? progresso : dadosAula.blocos.length - 1;
      window.location.hash = `#bloco-${indiceDesejado + 1}`;
      return;
    }

    atualizarBarraProgresso(indiceDesejado, dadosAula.blocos.length);
    await atualizarArtefato(indiceDesejado);

    const bloco = dadosAula.blocos[indiceDesejado];
    const ctx = {
      trilha,
      aula,
      respostaSalva: respostas[bloco.id],
      salvarResposta,
      resolvedorDependencias,
      ehUltimoBloco: indiceDesejado === dadosAula.blocos.length - 1,
      aoAvancar: () => avancar(indiceDesejado)
    };

    conteudo.innerHTML = '';
    if (indiceDesejado > 0) {
      const voltar = document.createElement('a');
      voltar.className = 'link-voltar';
      voltar.href = `#bloco-${indiceDesejado}`;
      voltar.textContent = 'Voltar';
      conteudo.appendChild(voltar);
    }
    conteudo.appendChild(await renderizarBloco(bloco, ctx));
    conteudo.focus();
  }

  window.addEventListener('hashchange', renderizarPasso);
  await renderizarPasso();
}

iniciarAtividade();
```

- [ ] **Step 4: Manual test — loading and error states**

Serve the project, open `atividade.html?trilha=trilha-ia&aula=aula-01`. Expected: briefly "Carregando...", then a console error `Tipo de bloco desconhecido: cenario` (expected — no renderer registered yet), with the habilidade sentence and progress bar ("Passo 1 de 5") already visible above the error. Open `atividade.html?trilha=nope&aula=nope`: expected the plain-language "Não encontramos esta atividade..." message, no stack trace shown to the user. Open `atividade.html` with no query string at all: same message.

- [ ] **Step 5: Manual test — schema version rejection**

Temporarily edit `dados/trilha-ia/aula-01.json`'s `schema_version` to `99`, reload the activity page. Expected: "Esta atividade precisa de uma versão mais nova do aplicativo..." message and a console error naming the file. Revert the edit afterward (`git checkout -- dados/trilha-ia/aula-01.json`).

- [ ] **Step 6: Commit**

```bash
git add atividade.html js/app.js
git commit -m "Adiciona bootstrap da atividade: roteamento por hash, validacao de schema, painel do artefato"
```

---

### Task 9: Bloco `cenario` — hint-then-explain feedback, attempt tracking

**Files:**
- Modify: `js/app.js`

**Interfaces:**
- Consumes: `avaliarRespostaCorreta`, `determinarNivelFeedback` (Task 3), the `ctx` contract (Task 8).
- Produces: `renderizarCenario(bloco, ctx)`, registered in the dispatcher. Saves `{ indiceEscolhido: number, tentativas: number }` via `ctx.salvarResposta`.

- [ ] **Step 1: Import the new helpers**

Extend the `js/blocos.js` import line in `js/app.js` to include `avaliarRespostaCorreta, determinarNivelFeedback`:

```js
import { calcularProgresso, montarArtefatoDaAula, avaliarRespostaCorreta, determinarNivelFeedback } from './blocos.js';
```

- [ ] **Step 2: Register the type and add the renderer**

Replace `renderizarBloco`'s body:

```js
function renderizarBloco(bloco, ctx) {
  if (bloco.tipo === 'cenario') return renderizarCenario(bloco, ctx);
  throw new Error(`Tipo de bloco desconhecido: ${bloco.tipo}`);
}
```

Add:

```js
async function renderizarCenario(bloco, ctx) {
  const container = document.createElement('div');
  container.className = 'bloco';

  const enunciado = document.createElement('p');
  enunciado.className = 'enunciado';
  enunciado.textContent = bloco.enunciado;
  container.appendChild(enunciado);

  const opcoesContainer = document.createElement('div');
  opcoesContainer.className = 'opcoes';

  const feedback = document.createElement('p');
  feedback.className = 'feedback';
  feedback.hidden = true;
  feedback.setAttribute('aria-live', 'polite');

  const botaoContinuar = criarBotaoGrande(ctx.ehUltimoBloco ? 'Concluir' : 'Continuar', ctx.aoAvancar);
  botaoContinuar.hidden = true;

  const respostaSalva = ctx.respostaSalva || { indiceEscolhido: undefined, tentativas: 0 };
  let tentativas = respostaSalva.tentativas || 0;

  function responder(indiceEscolhido) {
    Array.from(opcoesContainer.children).forEach((b) => {
      b.classList.remove('opcao-selecionada');
      b.setAttribute('aria-pressed', 'false');
    });
    opcoesContainer.children[indiceEscolhido].classList.add('opcao-selecionada');
    opcoesContainer.children[indiceEscolhido].setAttribute('aria-pressed', 'true');

    const correta = avaliarRespostaCorreta(bloco, indiceEscolhido);
    feedback.hidden = false;
    if (correta) {
      feedback.textContent = bloco.feedback_acerto;
      feedback.className = 'feedback feedback-acerto';
      botaoContinuar.hidden = false;
    } else {
      tentativas += 1;
      const nivel = determinarNivelFeedback(tentativas);
      feedback.textContent = nivel === 'dica' ? bloco.dica_erro : `${bloco.dica_erro} ${bloco.explicacao_erro}`;
      feedback.className = 'feedback feedback-erro';
      botaoContinuar.hidden = true;
    }

    ctx.salvarResposta(bloco.id, { indiceEscolhido, tentativas });
  }

  bloco.opcoes.forEach((opcao, indice) => {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'opcao';
    botao.setAttribute('aria-pressed', 'false');
    botao.textContent = opcao;
    botao.addEventListener('click', () => responder(indice));
    opcoesContainer.appendChild(botao);
  });

  container.appendChild(opcoesContainer);
  container.appendChild(feedback);
  container.appendChild(botaoContinuar);

  if (respostaSalva.indiceEscolhido !== undefined) {
    responder(respostaSalva.indiceEscolhido);
  }

  return container;
}
```

- [ ] **Step 3: Manual test**

Serve the project, open `atividade.html?trilha=trilha-ia&aula=aula-01` with cleared `localStorage`. Expected: block `b1` renders with 4 options and "Passo 1 de 5". Click a wrong option: feedback shows only `dica_erro` ("Reveja o trecho dos 3:30 do vídeo."), no "Continuar". Click the same (still) wrong option again, or another wrong one: feedback now shows `dica_erro` + `explicacao_erro` together. Click the correct option: feedback shows `feedback_acerto`, "Continuar" appears. Reload: `b1` reappears pre-filled with the correct answer and the acerto feedback. Confirm the URL hash reads `#bloco-1` (or is empty, normalizing to block 1) throughout.

- [ ] **Step 4: Manual test — back/forward and reload mid-step**

After answering `b1` correctly and clicking "Continuar" (hash becomes `#bloco-2`, and the console shows the expected `Tipo de bloco desconhecido: lista_aberta` since `b3` isn't `b2` — wait, `b2` is also `cenario`, so it should render normally; confirm `b2` renders and repeat the hint/explain/correct flow for it). Use the browser's back button: confirm it returns to `#bloco-1` and `b1` re-renders pre-filled. Reload the page while on `#bloco-2`: confirm it stays on `b2` (not reset to `b1`).

- [ ] **Step 5: Commit**

```bash
git add js/app.js
git commit -m "Adiciona renderizacao de cenario: dica antes da explicacao, tentativas registradas"
```

---

### Task 10: Bloco `lista_aberta` — minimum-filled gating

**Files:**
- Modify: `js/app.js`

**Interfaces:**
- Consumes: `normalizarListaAberta`, `minimoPreenchidoAtingido` (Task 3).
- Produces: `renderizarListaAberta(bloco, ctx)`, registered in the dispatcher.

- [ ] **Step 1: Import the new helpers**

Extend the `js/blocos.js` import line:

```js
import { calcularProgresso, montarArtefatoDaAula, avaliarRespostaCorreta, determinarNivelFeedback, normalizarListaAberta, minimoPreenchidoAtingido } from './blocos.js';
```

- [ ] **Step 2: Register the type and add the renderer**

```js
function renderizarBloco(bloco, ctx) {
  if (bloco.tipo === 'cenario') return renderizarCenario(bloco, ctx);
  if (bloco.tipo === 'lista_aberta') return renderizarListaAberta(bloco, ctx);
  throw new Error(`Tipo de bloco desconhecido: ${bloco.tipo}`);
}
```

```js
async function renderizarListaAberta(bloco, ctx) {
  const container = document.createElement('div');
  container.className = 'bloco';

  const enunciado = document.createElement('p');
  enunciado.className = 'enunciado';
  enunciado.textContent = bloco.enunciado;
  container.appendChild(enunciado);

  if (bloco.ajuda) {
    const ajuda = document.createElement('p');
    ajuda.className = 'texto-apoio';
    ajuda.textContent = bloco.ajuda;
    container.appendChild(ajuda);
  }

  const valoresSalvos = normalizarListaAberta(ctx.respostaSalva || [], bloco.quantidade_campos);
  const valoresAtuais = [...valoresSalvos];
  const minimo = bloco.minimo_preenchido ?? 1;

  const botaoContinuar = criarBotaoGrande(ctx.ehUltimoBloco ? 'Concluir' : 'Continuar', ctx.aoAvancar);

  function atualizarBotao() {
    botaoContinuar.hidden = !minimoPreenchidoAtingido(valoresAtuais, minimo);
  }

  for (let i = 0; i < bloco.quantidade_campos; i++) {
    const rotulo = document.createElement('label');
    rotulo.className = 'rotulo-campo';
    rotulo.setAttribute('for', `${bloco.id}-campo-${i}`);
    rotulo.textContent = `Item ${i + 1}`;

    const campo = document.createElement('input');
    campo.type = 'text';
    campo.id = `${bloco.id}-campo-${i}`;
    campo.className = 'campo-texto';
    campo.value = valoresSalvos[i] || '';
    campo.placeholder = (bloco.placeholders && bloco.placeholders[i]) || 'escreva aqui';

    campo.addEventListener('input', () => {
      valoresAtuais[i] = campo.value;
      ctx.salvarResposta(bloco.id, normalizarListaAberta(valoresAtuais, bloco.quantidade_campos));
      atualizarBotao();
    });

    container.appendChild(rotulo);
    container.appendChild(campo);
  }

  atualizarBotao();
  container.appendChild(botaoContinuar);
  return container;
}
```

- [ ] **Step 3: Manual test**

Continue from Task 9's state (or start fresh and answer `b1`/`b2`). Expected: `b3` renders with 5 labeled fields, first three with the real placeholders, last two with "escreva aqui". With all fields empty, "Continuar" stays hidden (since `minimo_preenchido: 1` still requires at least one). Type into exactly one field: "Continuar" appears. Reload: `b3` reappears pre-filled. Navigate back to `b1`/`b2` and forward again via the "Voltar"/hash links: confirm `b3`'s typed values persist.

- [ ] **Step 4: Commit**

```bash
git add js/app.js
git commit -m "Adiciona renderizacao de lista aberta com minimo de campos preenchidos"
```

---

### Task 11: Bloco `calculo` — dependency resolution, indisponível display, edge-case fallback

**Files:**
- Modify: `js/app.js`

**Interfaces:**
- Consumes: `todosCamposPreenchidos`, `resolverOpcoesSelecao`, `interpolarTexto` (Task 3), `avaliarCalculos` (Task 2), `ctx.resolvedorDependencias` (Task 1/8).
- Produces: `renderizarCalculo(bloco, ctx)`, registered in the dispatcher. Saves `{ ...valoresDosCampos, resultadoTexto: string }` via `ctx.salvarResposta` — read by `montarArtefatoDaAula` (Task 3) and by `diagnostico.html` (Task 13).

- [ ] **Step 1: Import remaining helpers**

Finalize the `js/blocos.js` import line:

```js
import {
  calcularProgresso,
  montarArtefatoDaAula,
  avaliarRespostaCorreta,
  determinarNivelFeedback,
  normalizarListaAberta,
  minimoPreenchidoAtingido,
  todosCamposPreenchidos,
  resolverOpcoesSelecao,
  interpolarTexto
} from './blocos.js';
import { avaliarCalculos } from './formula.js';
```

- [ ] **Step 2: Register the type and add the renderer**

```js
function renderizarBloco(bloco, ctx) {
  if (bloco.tipo === 'cenario') return renderizarCenario(bloco, ctx);
  if (bloco.tipo === 'lista_aberta') return renderizarListaAberta(bloco, ctx);
  if (bloco.tipo === 'calculo') return renderizarCalculo(bloco, ctx);
  throw new Error(`Tipo de bloco desconhecido: ${bloco.tipo}`);
}
```

```js
async function renderizarCalculo(bloco, ctx) {
  const container = document.createElement('div');
  container.className = 'bloco';

  const enunciado = document.createElement('p');
  enunciado.className = 'enunciado';
  enunciado.textContent = bloco.enunciado;
  container.appendChild(enunciado);

  const respostaSalva = ctx.respostaSalva || {};
  const valoresAtuais = {};

  const resultadoTexto = document.createElement('p');
  resultadoTexto.className = 'resultado-calculo';
  resultadoTexto.hidden = true;

  const botaoContinuar = criarBotaoGrande(ctx.ehUltimoBloco ? 'Concluir' : 'Continuar', ctx.aoAvancar);
  botaoContinuar.hidden = true;

  function recalcular() {
    if (!todosCamposPreenchidos(bloco.campos, valoresAtuais)) {
      resultadoTexto.hidden = true;
      botaoContinuar.hidden = true;
      return;
    }
    const valoresNumericos = {};
    for (const campo of bloco.campos) {
      if (campo.tipo === 'numero') valoresNumericos[campo.id] = parseFloat(valoresAtuais[campo.id]);
    }
    const calculado = avaliarCalculos(bloco.calculos || {}, valoresNumericos);
    const texto = interpolarTexto(bloco.resultado_texto, calculado);
    resultadoTexto.hidden = false;
    resultadoTexto.textContent = texto;
    botaoContinuar.hidden = false;
    ctx.salvarResposta(bloco.id, { ...valoresAtuais, resultadoTexto: texto });
  }

  for (const campo of bloco.campos) {
    const rotulo = document.createElement('label');
    rotulo.className = 'rotulo-campo';
    rotulo.setAttribute('for', `${bloco.id}-${campo.id}`);
    rotulo.textContent = campo.rotulo;
    container.appendChild(rotulo);

    if (campo.tipo === 'selecao' && campo.depende_de) {
      const resultado = await ctx.resolvedorDependencias.resolverDependencia(campo.depende_de);

      if (resultado.status !== 'ok') {
        console.warn(`Dependência não resolvida para ${bloco.id}.${campo.id}: ${resultado.status}`);
        if (resultado.status === 'aula_nao_respondida') {
          const nota = document.createElement('p');
          nota.className = 'texto-apoio';
          nota.textContent = 'Você ainda não respondeu isso — pode escrever aqui mesmo.';
          container.appendChild(nota);
        }
        const campoTexto = document.createElement('input');
        campoTexto.type = 'text';
        campoTexto.id = `${bloco.id}-${campo.id}`;
        campoTexto.className = 'campo-texto';
        campoTexto.value = respostaSalva[campo.id] || '';
        valoresAtuais[campo.id] = campoTexto.value;
        campoTexto.addEventListener('input', () => {
          valoresAtuais[campo.id] = campoTexto.value;
          recalcular();
        });
        container.appendChild(campoTexto);
        continue;
      }

      if (campo.depende_de.aula !== ctx.aula) {
        const origem = document.createElement('p');
        origem.className = 'texto-apoio';
        origem.textContent = `Baseado no que você respondeu na Aula ${resultado.tituloAula}.`;
        container.appendChild(origem);
      }

      const elemento = document.createElement('select');
      elemento.id = `${bloco.id}-${campo.id}`;
      elemento.className = 'campo-selecao';
      const opcaoVazia = document.createElement('option');
      opcaoVazia.value = '';
      opcaoVazia.textContent = 'Escolha uma opção';
      elemento.appendChild(opcaoVazia);
      const opcoes = resolverOpcoesSelecao(resultado.valores);
      for (const opcao of opcoes) {
        const item = document.createElement('option');
        item.value = opcao;
        item.textContent = opcao;
        elemento.appendChild(item);
      }
      elemento.value = opcoes.includes(respostaSalva[campo.id]) ? respostaSalva[campo.id] : '';
      valoresAtuais[campo.id] = elemento.value;
      elemento.addEventListener('change', () => {
        valoresAtuais[campo.id] = elemento.value;
        recalcular();
      });
      container.appendChild(elemento);
    } else if (campo.tipo === 'selecao') {
      const elemento = document.createElement('select');
      elemento.id = `${bloco.id}-${campo.id}`;
      elemento.className = 'campo-selecao';
      const opcaoVazia = document.createElement('option');
      opcaoVazia.value = '';
      opcaoVazia.textContent = 'Escolha uma opção';
      elemento.appendChild(opcaoVazia);
      for (const opcao of campo.opcoes) {
        const item = document.createElement('option');
        item.value = opcao;
        item.textContent = opcao;
        elemento.appendChild(item);
      }
      elemento.value = respostaSalva[campo.id] || '';
      valoresAtuais[campo.id] = elemento.value;
      elemento.addEventListener('change', () => {
        valoresAtuais[campo.id] = elemento.value;
        recalcular();
      });
      container.appendChild(elemento);
    } else {
      const elemento = document.createElement('input');
      elemento.type = 'number';
      elemento.inputMode = 'numeric';
      if (campo.minimo !== undefined) elemento.min = String(campo.minimo);
      if (campo.maximo !== undefined) elemento.max = String(campo.maximo);
      elemento.id = `${bloco.id}-${campo.id}`;
      elemento.className = 'campo-numero';
      elemento.value = respostaSalva[campo.id] ?? '';
      valoresAtuais[campo.id] = elemento.value;
      elemento.addEventListener('input', () => {
        valoresAtuais[campo.id] = elemento.value;
        recalcular();
      });
      container.appendChild(elemento);
    }
  }

  container.appendChild(resultadoTexto);
  container.appendChild(botaoContinuar);
  recalcular();
  return container;
}
```

- [ ] **Step 3: Manual test — dependency resolves from a persisted answer**

Continue from Task 10's state with `b3` filled with 5 distinct phrases and "Continuar" clicked (hash `#bloco-4`). Expected: `b4` appears; its "Qual das cinco?" `<select>` lists exactly the 5 phrases from `b3`. Pick a task, type `4` and `10` into the number fields, pick any option for the last select. Expected: result reads "Você gasta cerca de 40 minutos por semana, o que dá 2,9 horas por mês." and "Continuar" appears.

- [ ] **Step 4: Manual test — re-reading after editing an earlier answer**

With `b4` answered, click "Voltar" back to `b3`, change the text of the task that was selected in `b4` (e.g. append " (editado)"), click through forward to `#bloco-4` again. Expected: `b4`'s `<select>` now lists the edited phrase; since the exact previous string no longer matches, the selection resets to "Escolha uma opção" and the result becomes hidden until re-selected (matches the confirmed decision: re-resolved fresh every time the screen mounts).

- [ ] **Step 5: Manual test — unmet dependency fallback**

Manually clear this lesson's saved answers via devtools (`localStorage.removeItem('toca:v1:trilha-ia:aula-01')`) then navigate directly to `atividade.html?trilha=trilha-ia&aula=aula-01#bloco-4` (bypassing the normal gating by hand-editing the URL). Expected: since `calcularProgresso` will redirect back to the first incomplete block, this specifically demonstrates the *routing* guard works — to test the *dependency* fallback in isolation instead, temporarily edit `dados/trilha-ia/aula-01.json`'s `b4.campos[0].depende_de.bloco` to `"b9"` (nonexistent), reload on `#bloco-4` (after legitimately reaching it). Expected: a plain free-text field replaces the `<select>`, no crash, and a console warning naming `bloco_inexistente`. Revert the edit afterward.

- [ ] **Step 6: Commit**

```bash
git add js/app.js
git commit -m "Adiciona renderizacao de calculo com resolucao de dependencia e fallback nos tres casos de borda"
```

---

### Task 12: Bloco `escolha_simples`

**Files:**
- Modify: `js/app.js`

**Interfaces:**
- Produces: `renderizarEscolhaSimples(bloco, ctx)`, registered in the dispatcher — the last of the four types, completing the map.

- [ ] **Step 1: Register the type and add the renderer**

```js
function renderizarBloco(bloco, ctx) {
  if (bloco.tipo === 'cenario') return renderizarCenario(bloco, ctx);
  if (bloco.tipo === 'lista_aberta') return renderizarListaAberta(bloco, ctx);
  if (bloco.tipo === 'calculo') return renderizarCalculo(bloco, ctx);
  if (bloco.tipo === 'escolha_simples') return renderizarEscolhaSimples(bloco, ctx);
  throw new Error(`Tipo de bloco desconhecido: ${bloco.tipo}`);
}
```

```js
async function renderizarEscolhaSimples(bloco, ctx) {
  const container = document.createElement('div');
  container.className = 'bloco';

  const enunciado = document.createElement('p');
  enunciado.className = 'enunciado';
  enunciado.textContent = bloco.enunciado;
  container.appendChild(enunciado);

  const opcoesContainer = document.createElement('div');
  opcoesContainer.className = 'opcoes';

  const botaoContinuar = criarBotaoGrande(ctx.ehUltimoBloco ? 'Concluir' : 'Continuar', ctx.aoAvancar);
  botaoContinuar.hidden = ctx.respostaSalva === undefined;

  bloco.opcoes.forEach((opcao, indice) => {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'opcao';
    botao.setAttribute('aria-pressed', ctx.respostaSalva === indice ? 'true' : 'false');
    botao.textContent = opcao;
    if (ctx.respostaSalva === indice) botao.classList.add('opcao-selecionada');
    botao.addEventListener('click', () => {
      Array.from(opcoesContainer.children).forEach((b) => {
        b.classList.remove('opcao-selecionada');
        b.setAttribute('aria-pressed', 'false');
      });
      botao.classList.add('opcao-selecionada');
      botao.setAttribute('aria-pressed', 'true');
      ctx.salvarResposta(bloco.id, indice);
      botaoContinuar.hidden = false;
    });
    opcoesContainer.appendChild(botao);
  });

  container.appendChild(opcoesContainer);
  container.appendChild(botaoContinuar);
  return container;
}
```

- [ ] **Step 2: Manual test — full lesson completion**

Complete `b1` through `b4` as in Tasks 9–11, then answer `b5`. Expected: clicking any option immediately shows "Concluir" (this is the last block); clicking it navigates to `index.html`. Expected on `index.html`: the lesson now shows "Concluída" and there's no more "Continuar: ..." button for this trilha (since there's only one lesson so far). Click "Ver o que você já construiu": `diagnostico.html?trilha=trilha-ia` loads (will 404/error until Task 13 — expected at this stage).

- [ ] **Step 3: Manual test — reopening a fully completed lesson**

Navigate back to `atividade.html?trilha=trilha-ia&aula=aula-01`. Expected: lands on `#bloco-1` (or whatever hash), all blocks reachable via Voltar/hash editing, all pre-filled; navigating forward past `b5` and clicking "Concluir" again returns to `index.html` without error.

- [ ] **Step 4: Commit**

```bash
git add js/app.js
git commit -m "Adiciona renderizacao de escolha simples, completando os quatro tipos de bloco"
```

---

### Task 13: `diagnostico.html`

**Files:**
- Create: `diagnostico.html`
- Modify: `js/app.js`

**Interfaces:**
- Consumes: `montarArtefatoDaAula` (Task 3), `criarArmazenamento`/module-level `armazenamento`, `buscarJson`.
- Produces: `iniciarDiagnostico()`.

- [ ] **Step 1: Create `diagnostico.html`**

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>O que você construiu</title>
  <link rel="icon" href="img/favicon-32.png" sizes="32x32">
  <link rel="apple-touch-icon" href="img/icone-180.png">
  <link rel="stylesheet" href="css/estilo.css">
  <link rel="stylesheet" href="css/impressao.css" media="print">
</head>
<body>
  <main class="pagina">
    <h1>O que você construiu</h1>
    <div id="conteudo-diagnostico" aria-live="polite"></div>
    <button type="button" id="botao-imprimir" class="botao-grande nao-imprimir" hidden>Salvar em PDF</button>
  </main>
  <script type="module" src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Add `iniciarDiagnostico` to `js/app.js`**

Add near the other bootstrap functions:

```js
async function iniciarDiagnostico() {
  const conteudoDiagnostico = document.getElementById('conteudo-diagnostico');
  if (!conteudoDiagnostico) return;

  const parametros = new URLSearchParams(window.location.search);
  const trilhaId = parametros.get('trilha');
  if (!trilhaId) {
    conteudoDiagnostico.innerHTML = '<p class="mensagem-erro">Não encontramos essa trilha. Volte para a área de membros e clique no link novamente.</p>';
    return;
  }

  let indice;
  try {
    indice = await buscarJson('dados/indice.json');
  } catch {
    conteudoDiagnostico.innerHTML = '<p class="mensagem-erro">Não foi possível carregar agora. Tente novamente em instantes.</p>';
    return;
  }

  const trilha = indice.trilhas.find((t) => t.id === trilhaId);
  if (!trilha) {
    conteudoDiagnostico.innerHTML = '<p class="mensagem-erro">Não encontramos essa trilha. Volte para a área de membros e clique no link novamente.</p>';
    return;
  }

  const secoes = [];
  for (const aula of [...trilha.aulas].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))) {
    const respostas = await armazenamento.obterRespostasDaAula(trilha.id, aula.id);
    if (Object.keys(respostas).length === 0) continue;
    const dadosAula = await buscarJson(aula.arquivo);
    const itens = montarArtefatoDaAula(dadosAula.blocos, respostas);
    if (itens.length === 0) continue;
    secoes.push({ titulo: aula.titulo, itens });
  }

  conteudoDiagnostico.innerHTML = '';
  if (secoes.length === 0) {
    conteudoDiagnostico.innerHTML = '<p class="texto-apoio">Você ainda não construiu nada nesta trilha. Comece por uma aula na tela inicial.</p>';
    return;
  }

  for (const secao of secoes) {
    const bloco = document.createElement('section');
    bloco.className = 'resultado-item';
    const titulo = document.createElement('h2');
    titulo.textContent = secao.titulo;
    bloco.appendChild(titulo);
    for (const item of secao.itens) {
      const enunciado = document.createElement('p');
      enunciado.className = 'resultado-enunciado';
      enunciado.textContent = item.enunciado;
      bloco.appendChild(enunciado);
      if (item.tipo === 'lista') {
        const lista = document.createElement('ul');
        for (const valor of item.valores) {
          const li = document.createElement('li');
          li.textContent = valor;
          lista.appendChild(li);
        }
        bloco.appendChild(lista);
      } else {
        const texto = document.createElement('p');
        texto.textContent = item.texto;
        bloco.appendChild(texto);
      }
    }
    conteudoDiagnostico.appendChild(bloco);
  }

  const botaoImprimir = document.getElementById('botao-imprimir');
  botaoImprimir.hidden = false;
  botaoImprimir.addEventListener('click', () => window.print());
}
```

At the bottom of `js/app.js`, alongside the existing `iniciarPaginaInicial();` and `iniciarAtividade();` calls, add:

```js
iniciarDiagnostico();
```

- [ ] **Step 3: Manual test**

With the full lesson completed (from Task 12), open `diagnostico.html?trilha=trilha-ia`. Expected: a section titled "Você já usa IA. O problema é como." listing the tasks written in `b3` and the result sentence from `b4`, plus a visible "Salvar em PDF" button. Click it: print preview shows only the heading and this content — no progress bar, no buttons. Open `diagnostico.html?trilha=nope`: plain-language error, no crash. Open `diagnostico.html` with no query string: same. Clear `localStorage` and reopen `diagnostico.html?trilha=trilha-ia`: "Você ainda não construiu nada nesta trilha..." message, no print button.

- [ ] **Step 4: Commit**

```bash
git add diagnostico.html js/app.js
git commit -m "Adiciona tela de diagnostico reunindo o artefato de todas as aulas da trilha"
```

---

### Task 14: Exportar / Importar com confirmação

**Files:**
- Modify: `js/app.js`

**Interfaces:**
- Consumes: `armazenamento.exportarTudo()`, `armazenamento.importarTudo(dados, confirmado)` (Task 4). Activates the markup already present in `index.html` since Task 7.

- [ ] **Step 1: Add `configurarExportarImportar` to `js/app.js`**

```js
function configurarExportarImportar() {
  const botaoExportar = document.getElementById('botao-exportar');
  const botaoImportar = document.getElementById('botao-importar');
  const entradaImportar = document.getElementById('entrada-importar');
  const confirmacao = document.getElementById('confirmacao-importar');
  if (!botaoExportar) return;

  botaoExportar.addEventListener('click', async () => {
    const tudo = await armazenamento.exportarTudo();
    const blob = new Blob([JSON.stringify(tudo, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'minhas-respostas.json';
    link.click();
    URL.revokeObjectURL(url);
  });

  botaoImportar.addEventListener('click', () => entradaImportar.click());

  entradaImportar.addEventListener('change', async () => {
    const arquivo = entradaImportar.files[0];
    if (!arquivo) return;
    const texto = await arquivo.text();
    let dados;
    try {
      dados = JSON.parse(texto);
    } catch {
      confirmacao.hidden = false;
      confirmacao.innerHTML = '<p class="mensagem-erro">Este arquivo não é válido.</p>';
      return;
    }
    const validacao = await armazenamento.importarTudo(dados);
    if (!validacao.valido) {
      confirmacao.hidden = false;
      confirmacao.innerHTML = `<p class="mensagem-erro">${validacao.motivo}</p>`;
      return;
    }
    confirmacao.hidden = false;
    confirmacao.innerHTML = '';
    const aviso = document.createElement('p');
    aviso.textContent = validacao.jaExistentes.length > 0
      ? `Isso vai substituir ${validacao.jaExistentes.length} aula(s) que já têm respostas salvas neste celular. Quer continuar?`
      : 'Quer recuperar essas respostas agora?';
    confirmacao.appendChild(aviso);
    const botaoConfirmar = criarBotaoGrande('Sim, recuperar', async () => {
      await armazenamento.importarTudo(dados, true);
      window.location.reload();
    });
    confirmacao.appendChild(botaoConfirmar);
  });
}
```

At the bottom of `js/app.js`, add the call alongside the other bootstrap calls:

```js
configurarExportarImportar();
```

- [ ] **Step 2: Manual test — export/import round trip**

On `index.html` with the completed lesson, click "Salvar uma cópia das minhas respostas": expected `minhas-respostas.json` downloads. Clear `localStorage` via devtools, reload `index.html`: expected the lesson shows "Não iniciada" again. Click "Recuperar minhas respostas de outro celular", choose the downloaded file: expected a confirmation message ("Quer recuperar essas respostas agora?" — no existing data yet, so no "substituir" wording) with a "Sim, recuperar" button; click it: page reloads and the lesson shows "Concluída" again.

- [ ] **Step 3: Manual test — overwrite confirmation wording**

With the lesson still showing progress, import the same file again. Expected: the confirmation message now reads "Isso vai substituir 1 aula(s) que já têm respostas salvas neste celular. Quer continuar?" before anything is overwritten.

- [ ] **Step 4: Manual test — invalid file**

Create a text file containing `not valid json` and try importing it. Expected: "Este arquivo não é válido." with no crash. Create a valid JSON file with unrelated content (e.g. `{"foo": "bar"}`) and import it. Expected: "Este arquivo não contém respostas deste aplicativo."

- [ ] **Step 5: Commit**

```bash
git add js/app.js
git commit -m "Adiciona exportar e importar com confirmacao antes de sobrescrever"
```

---

### Task 15: `TESTES-MANUAIS.md` and final QA pass

**Files:**
- Create: `TESTES-MANUAIS.md`

**Files:** none further changed (verification only, using files from all previous tasks).

- [ ] **Step 1: Run the full automated test suite**

Run: `node --test js/*.test.js`
Expected: all tests from Tasks 1–4 pass (11 in `formula.test.js`, 12 in `blocos.test.js`, 14 in `armazenamento.test.js`, 6 in `dependencias.test.js` — 43 total).

- [ ] **Step 2: Write `TESTES-MANUAIS.md`**

```markdown
# Testes manuais

Casos para verificar à mão no navegador antes de publicar uma mudança. Sirva a pasta com `python3 -m http.server 8000` (nunca `npx serve` — ele descarta a querystring e o hash que este aplicativo usa).

## Conteúdo inválido

1. Edite temporariamente `dados/trilha-ia/aula-01.json` e quebre a sintaxe JSON (por exemplo, remova uma vírgula). Abra a atividade. Esperado: mensagem "Não foi possível carregar esta atividade agora..." — nunca tela branca. Reverta o arquivo.
2. Edite `schema_version` para `99`. Esperado: "Esta atividade precisa de uma versão mais nova do aplicativo..." e um erro no console apontando o arquivo. Reverta.

## Bloco com id desconhecido

Em `dados/trilha-ia/aula-01.json`, mude temporariamente o `id` do bloco `b3` para `b3x`. Recarregue uma atividade que já tinha resposta salva em `b3`. Esperado: nenhuma tela quebrada; a resposta antiga simplesmente não aparece mais pré-preenchida no bloco renomeado (ele é tratado como um bloco novo, vazio). Reverta.

## Dependência de aula ainda não respondida

Limpe o `localStorage` (`localStorage.clear()` no console) e navegue direto para `atividade.html?trilha=trilha-ia&aula=aula-01#bloco-4` — o roteamento deve redirecionar para o primeiro bloco pendente (`#bloco-1`), confirmando a proteção. Para testar o fallback da dependência isoladamente, aponte temporariamente `b4.campos[0].depende_de` para uma aula real mas sem nenhuma resposta salva (ex.: crie uma segunda aula fictícia no índice sem respondê-la) — o campo deve virar texto livre com a nota "Você ainda não respondeu isso...".

## Campo numérico com texto

No bloco de cálculo, tente colar texto num campo numérico (em navegadores que permitem colar texto em `<input type="number">`, ou usando o console: `document.querySelector('#b4-vezes_semana').value = 'abc'` seguido de disparar um evento `input`). Esperado: o resultado mostra "indisponível" em vez de travar ou mostrar `NaN`.

## Campo numérico com zero

Preencha `vezes_semana` ou `minutos_vez` com `0`. Esperado: resultado mostra "Você gasta cerca de 0 minutos por semana, o que dá 0 horas por mês." — não "indisponível" (multiplicar por zero é uma conta válida, diferente de dividir por zero).

## Armazenamento cheio

No console: `for (let i = 0; i < 10000; i++) { try { localStorage.setItem('lixo' + i, 'x'.repeat(1000000)); } catch (e) { break; } }` até `localStorage.setItem` começar a lançar erro. Recarregue a atividade e responda um bloco. Esperado: aviso "Não estamos conseguindo salvar suas respostas agora..." aparece, e a atividade continua respondível na sessão. Limpe o `localStorage` depois (`localStorage.clear()`).

## Importação de arquivo inválido

Ver Task 14, Step 4 do plano de implementação: arquivo com JSON quebrado, e arquivo JSON válido mas sem chaves reconhecidas — ambos devem mostrar mensagem clara, nunca sobrescrever nada.

## Recarregar no meio do preenchimento

Comece a preencher o bloco `b3` (lista aberta), preencha 2 de 5 campos, recarregue a página sem avançar. Esperado: os 2 campos preenchidos continuam lá, ainda no mesmo bloco (`#bloco-3` no hash).

## Já cobertos por observação direta durante o desenvolvimento

- 360px sem rolagem horizontal, em toda tela (inicial, cada tipo de bloco, diagnóstico).
- Navegação completa só por teclado (Tab, Enter, Espaço) em todos os tipos de bloco.
- Contraste das cores fixas (`--tinta` sobre `--papel`, `--papel` sobre `--verde` nos botões, `--verde` sobre `--verde-claro` no acerto, `--neutro` (600) sobre `--neutro-claro` no erro) — todas já conferidas em ~5,4:1 ou mais, acima do mínimo de 4,5:1 do WCAG AA para texto normal.
- Teclado numérico no iOS: abrir um campo `type="number"` num iPhone real ou simulador e confirmar que o teclado virtual não quebra o layout (nenhum elemento fica coberto ou cortado).
- `prefers-reduced-motion`: ativar essa preferência no sistema operacional e confirmar que a barra de progresso não anima a largura.
```

- [ ] **Step 3: Execute every case in `TESTES-MANUAIS.md`**

Work through each numbered case above against the running app, exactly as described. Note any failures — none are expected at this point, since each behavior was already exercised in its owning task, but this is the first time they're checked as a connected sequence in one sitting.

- [ ] **Step 4: 360px viewport check across every screen**

With devtools set to 360×640: `index.html`, `atividade.html` at each block type (`b1`–`b5`), the artifact panel opened, and `diagnostico.html`. Expected: no horizontal scrollbar anywhere.

- [ ] **Step 5: Performance budget check**

In devtools, open the Network tab, set throttling to "Slow 3G" (or the closest available simulated 3G profile), disable cache, and reload `atividade.html?trilha=trilha-ia&aula=aula-01`. Expected: first meaningful render (the `b1` question visible) under 1.5s, and total transferred size for this page's own requests (HTML + `css/estilo.css` + `js/*.js` + `dados/indice.json` + `dados/trilha-ia/aula-01.json` — excluding the Google Fonts request, which the spec's budget explicitly carves out) under 150KB. If either is exceeded, note it as a finding rather than silently passing — this budget was set by the spec, not discovered here for the first time.

- [ ] **Step 6: Final commit**

```bash
git add TESTES-MANUAIS.md
git commit -m "Adiciona testes manuais e finaliza QA da v2"
```

---

### Task 16: `README.md`

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: the final v2 file layout and JSON shapes from all previous tasks.

- [ ] **Step 1: Replace `README.md`**

```markdown
# Atividades do curso

Aplicativo simples para as atividades que os alunos fazem depois de assistir a cada videoaula. Ele roda direto no navegador do aluno — não precisa de internet além de abrir a página, não guarda nada em nenhum servidor, e as respostas ficam salvas no próprio celular ou computador do aluno.

## Como está organizado

- `index.html` — a página inicial: lista de trilhas e aulas, com o estado de cada uma (não iniciada, em andamento, concluída) e um botão para retomar de onde parou.
- `atividade.html` — a atividade em si, um bloco de cada vez.
- `diagnostico.html` — reúne tudo que o aluno já construiu numa trilha.
- `dados/indice.json` — a lista de todas as trilhas e aulas que existem.
- `dados/modelo-aula.json` — um modelo pronto para copiar quando for criar uma aula nova.
- `dados/<nome-da-trilha>/aula-XX.json` — o conteúdo de cada aula.
- As pastas `css` e `js` cuidam da aparência e do funcionamento. Você não precisa mexer nelas para criar uma aula nova.

## Como criar uma aula nova (sem programar)

1. Copie o arquivo `dados/modelo-aula.json`.
2. Cole a cópia dentro da pasta da trilha (por exemplo, `dados/trilha-ia/`) e dê um nome como `aula-02.json`.
3. Preencha os textos. As linhas que começam com `_leiame` são só explicações — pode apagar todas.
4. Abra `dados/indice.json` e adicione uma linha nova dentro da lista `aulas` da trilha correta:

```json
{ "id": "aula-02", "titulo": "Título da nova aula", "ordem": 2, "arquivo": "dados/trilha-ia/aula-02.json" }
```

5. Pronto. Não é preciso mexer em nenhum arquivo `.js`.

**Um cuidado importante:** o `id` de cada bloco (`b1`, `b2`...) nunca deve ser renomeado ou reordenado depois que a aula for publicada — é por esse `id` que o aplicativo guarda a resposta do aluno.

## Os quatro tipos de pergunta

- **`cenario`** — uma situação com uma resposta certa. Ao errar, o aluno vê primeiro uma dica curta; a explicação completa só aparece a partir do segundo erro.
- **`lista_aberta`** — vários campos de texto livre.
- **`calculo`** — o aluno preenche números (ou escolhe opções) e vê um resultado calculado na hora. Um campo pode se alimentar do que o aluno respondeu num bloco `lista_aberta` anterior — dessa mesma aula ou de uma aula anterior — usando `depende_de`.
- **`escolha_simples`** — uma pergunta de reflexão, sem resposta certa ou errada.

O arquivo `dados/modelo-aula.json` tem um exemplo pronto de cada um, com explicações ao lado de cada campo.

## Testando no seu computador

Sirva a pasta com um servidor de arquivos estático que preserve a parte da URL depois do `?` e do `#` — por exemplo:

```
python3 -m http.server 8000
```

(Não use `npx serve`: por padrão ele redireciona `atividade.html?...` para `atividade` e descarta essa parte da URL, o que quebra a navegação deste aplicativo.)

Para rodar os testes automáticos das partes internas (não é necessário para criar aulas):

```
node --test js/*.test.js
```

Veja também `TESTES-MANUAIS.md` para os casos que precisam ser conferidos à mão.

## Publicando no GitHub Pages

1. Crie um repositório novo no GitHub e envie todos os arquivos desta pasta para ele.
2. No GitHub, abra o repositório e vá em **Settings** → **Pages**.
3. Em "Build and deployment", escolha **Deploy from a branch**.
4. Selecione a branch `main` (ou `master`) e a pasta `/ (root)`. Clique em Save.
5. Depois de alguns minutos, o GitHub mostra o endereço do site, algo como `https://seu-usuario.github.io/nome-do-repositorio/`.
6. O link de cada trilha, para colocar na área de membros, segue o formato: `https://seu-usuario.github.io/nome-do-repositorio/index.html` (a tela inicial já leva o aluno para a aula certa).
7. Sempre que você adicionar uma aula nova e enviar (`git push`) as mudanças para o GitHub, o site atualiza sozinho em alguns minutos.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "Atualiza README para a arquitetura v2"
```
