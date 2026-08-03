# App de Atividades Interativas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static, framework-free web app (HTML/CSS/JS, no build step) that renders JSON-defined interactive lessons, persists answers in `localStorage`, and lets a lesson's `calculo` blocks read live answers from earlier `lista_aberta` blocks on the same page.

**Architecture:** Three pure ES modules (`formula.js`, `armazenamento.js`, `blocos.js`) hold all logic that doesn't touch the DOM and are unit-tested with Node's built-in test runner (`node --test`). `app.js` is the only DOM-touching file: it fetches `dados/indice.json` and a lesson JSON, then reveals blocks progressively on a single page (never swaps screens), tracking how many blocks are unlocked via a reserved `_progresso` entry in the same `localStorage` record used for answers.

**Tech Stack:** Plain HTML/CSS/JS (ES modules via `<script type="module">`), no CDN dependencies, no bundler. Node.js is used only as a dev-time test runner (`node --test`) for the three pure modules — it is never required to run or serve the app itself.

## Global Constraints

- No framework, no build step — plain HTML/CSS/JS only.
- No external CDN dependencies.
- Must work when served by GitHub Pages (the only way the student ever reaches it). Opening the raw file from disk (`file://`) is not a supported path: `app.js` loads lesson content via `fetch`, which Chrome and most modern browsers block for local files regardless of implementation — this was confirmed as an acceptable, resolved trade-off, not an open defect. Local testing during development requires serving the folder with any static file server.
- **Local server choice matters:** `atividade.html` relies on a query string (`?trilha=...&aula=...`) to know which lesson to load. The popular `npx serve` tool 301-redirects `/atividade.html?trilha=X&aula=Y` to `/atividade` and **drops the query string entirely** (its default "clean URLs" behavior) — confirmed by direct testing. GitHub Pages does no such rewriting, so this never affects the real deployed app, but it silently breaks every local manual test in this plan that opens `atividade.html?...`. Use `python3 -m http.server <port>` for local testing instead (confirmed to preserve query strings, no redirect) — or, if `npx serve` must be used, pass a `serve.json` with `"cleanUrls": false`.
- Mobile-first; no horizontal scroll at 360px viewport width.
- No emoji anywhere in the UI or in any JSON content.
- Body text minimum 16px; buttons/inputs minimum 44px touch target.
- WCAG AA contrast; every field has an associated `<label for>`; full keyboard navigation.
- All lesson content lives in JSON under `dados/`; adding a lesson must never require writing JavaScript.
- No interface text may expose a technical term (`localStorage`, `JSON`, etc.) to the student.
- Persistence key is `atividades:<trilha>:<aula>` in `localStorage`; every field autosaves, no save button.
- Reserved data keys/ids starting with `_` (e.g. `_progresso`, `_leiame`) are engine/documentation-only and must never be used as an authored block id.

---

### Task 1: Project scaffolding

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `atividade.html`
- Create: `css/estilo.css` (minimal placeholder, filled in Task 6)
- Create: `css/impressao.css` (minimal placeholder, filled in Task 6)
- Create: `.gitignore`

**Interfaces:**
- Produces: the two entry-point HTML pages both load `js/app.js` as an ES module and `css/estilo.css`; `atividade.html` also loads `css/impressao.css` for print.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "app-atividades-curso",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test js/*.test.js"
  }
}
```

- [ ] **Step 2: Create `.gitignore`**

```
node_modules/
.DS_Store
```

- [ ] **Step 3: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Atividades do curso</title>
  <link rel="stylesheet" href="css/estilo.css">
</head>
<body>
  <main class="pagina">
    <h1>Atividades do curso</h1>
    <p class="texto-apoio">Escolha a aula para continuar de onde parou.</p>
    <div id="lista-trilhas" class="lista-trilhas" aria-live="polite"></div>
  </main>
  <script type="module" src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 4: Create `atividade.html`**

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Atividade</title>
  <link rel="stylesheet" href="css/estilo.css">
  <link rel="stylesheet" href="css/impressao.css" media="print">
</head>
<body>
  <main class="pagina">
    <div id="barra-progresso" class="barra-progresso" hidden>
      <div id="barra-progresso-preenchida" class="barra-progresso-preenchida"></div>
    </div>
    <p id="barra-progresso-texto" class="barra-progresso-texto"></p>
    <div id="conteudo-atividade" aria-live="polite"></div>
  </main>
  <script type="module" src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 5: Create placeholder `css/estilo.css`**

```css
body { font-family: system-ui, sans-serif; }
```

- [ ] **Step 6: Create placeholder `css/impressao.css`**

```css
@media print { body { color: #000; } }
```

- [ ] **Step 7: Verify pages open without console errors**

Open `index.html` directly in a browser (double-click, or drag into a browser window). Expected: title "Atividades do curso" and the two text lines render; no red errors in the browser console (a 404 for `dados/indice.json` in the console at this stage is expected and fine — `js/app.js` does not exist yet).

- [ ] **Step 8: Commit**

```bash
git add package.json .gitignore index.html atividade.html css/estilo.css css/impressao.css
git commit -m "Cria estrutura inicial do projeto"
```

---

### Task 2: `js/formula.js` — safe arithmetic evaluator

**Files:**
- Create: `js/formula.js`
- Test: `js/formula.test.js`

**Interfaces:**
- Produces: `avaliarExpressao(expressao: string, contexto: Record<string, number>): number` and `avaliarCalculos(calculos: Record<string, string>, valoresIniciais: Record<string, number>): Record<string, number>` — both used by `js/app.js` in Task 10.

- [ ] **Step 1: Write the failing tests**

Create `js/formula.test.js`:

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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test js/formula.test.js`
Expected: FAIL — `Cannot find module './formula.js'` (file doesn't exist yet).

- [ ] **Step 3: Write the implementation**

Create `js/formula.js`:

```js
const OPERADORES = new Set(['+', '-', '*', '/', '(', ')']);

function tokenizar(expressao) {
  const tokens = [];
  let i = 0;
  while (i < expressao.length) {
    const c = expressao[i];
    if (c === ' ' || c === '\t') { i++; continue; }
    if (OPERADORES.has(c)) { tokens.push({ tipo: c }); i++; continue; }
    if (/[0-9.]/.test(c)) {
      let numero = '';
      while (i < expressao.length && /[0-9.]/.test(expressao[i])) { numero += expressao[i]; i++; }
      tokens.push({ tipo: 'numero', valor: parseFloat(numero) });
      continue;
    }
    if (/[a-zA-Z_]/.test(c)) {
      let nome = '';
      while (i < expressao.length && /[a-zA-Z0-9_]/.test(expressao[i])) { nome += expressao[i]; i++; }
      tokens.push({ tipo: 'identificador', nome });
      continue;
    }
    throw new Error(`Caractere inválido na fórmula: "${c}"`);
  }
  return tokens;
}

function criarParser(tokens, contexto) {
  let pos = 0;

  function verAtual() { return tokens[pos]; }

  function consumir(tipoEsperado) {
    const token = tokens[pos];
    if (!token || token.tipo !== tipoEsperado) {
      throw new Error(`Fórmula malformada: esperava "${tipoEsperado}"`);
    }
    pos++;
    return token;
  }

  function fator() {
    const token = verAtual();
    if (!token) throw new Error('Fórmula malformada: fim inesperado');
    if (token.tipo === 'numero') { pos++; return token.valor; }
    if (token.tipo === 'identificador') {
      pos++;
      const valor = contexto[token.nome];
      return typeof valor === 'number' && !Number.isNaN(valor) ? valor : 0;
    }
    if (token.tipo === '(') {
      pos++;
      const valor = expressaoCompleta();
      consumir(')');
      return valor;
    }
    if (token.tipo === '-') {
      pos++;
      return -fator();
    }
    throw new Error('Fórmula malformada: token inesperado');
  }

  function termo() {
    let valor = fator();
    while (verAtual() && (verAtual().tipo === '*' || verAtual().tipo === '/')) {
      const operador = tokens[pos].tipo;
      pos++;
      const proximo = fator();
      valor = operador === '*' ? valor * proximo : (proximo === 0 ? 0 : valor / proximo);
    }
    return valor;
  }

  function expressaoCompleta() {
    let valor = termo();
    while (verAtual() && (verAtual().tipo === '+' || verAtual().tipo === '-')) {
      const operador = tokens[pos].tipo;
      pos++;
      const proximo = termo();
      valor = operador === '+' ? valor + proximo : valor - proximo;
    }
    return valor;
  }

  return { expressaoCompleta, terminou: () => pos >= tokens.length };
}

export function avaliarExpressao(expressao, contexto) {
  const tokens = tokenizar(expressao);
  const parser = criarParser(tokens, contexto);
  const resultado = parser.expressaoCompleta();
  if (!parser.terminou()) {
    throw new Error('Fórmula malformada: sobrou conteúdo após o fim da expressão');
  }
  return resultado;
}

export function avaliarCalculos(calculos, valoresIniciais) {
  const contexto = { ...valoresIniciais };
  for (const nome of Object.keys(calculos)) {
    contexto[nome] = avaliarExpressao(calculos[nome], contexto);
  }
  return contexto;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test js/formula.test.js`
Expected: PASS, all 9 tests green.

- [ ] **Step 5: Commit**

```bash
git add js/formula.js js/formula.test.js
git commit -m "Adiciona avaliador de formulas aritmeticas seguro"
```

---

### Task 3: `js/armazenamento.js` — persistence layer

**Files:**
- Create: `js/armazenamento.js`
- Test: `js/armazenamento.test.js`

**Interfaces:**
- Consumes: none.
- Produces: `criarArmazenamento(storage)` returning `{ salvarResposta(trilha, aula, blocoId, resposta), obterResposta(trilha, aula, blocoId), obterRespostasDaAula(trilha, aula), exportarTudo(), importarTudo(dados) }`. `storage` must implement `getItem`, `setItem`, `length`, `key(i)` (the subset of the `Storage`/`localStorage` interface used here). `js/app.js` (Task 8) instantiates this with `window.localStorage`.

- [ ] **Step 1: Write the failing tests**

Create `js/armazenamento.test.js`:

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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test js/armazenamento.test.js`
Expected: FAIL — `Cannot find module './armazenamento.js'`.

- [ ] **Step 3: Write the implementation**

Create `js/armazenamento.js`:

```js
function chaveDaAula(trilha, aula) {
  return `atividades:${trilha}:${aula}`;
}

export function criarArmazenamento(storage) {
  function lerAula(trilha, aula) {
    const bruto = storage.getItem(chaveDaAula(trilha, aula));
    if (!bruto) return {};
    try {
      return JSON.parse(bruto);
    } catch {
      return {};
    }
  }

  function salvarResposta(trilha, aula, blocoId, resposta) {
    const dados = lerAula(trilha, aula);
    dados[blocoId] = resposta;
    storage.setItem(chaveDaAula(trilha, aula), JSON.stringify(dados));
  }

  function obterResposta(trilha, aula, blocoId) {
    const dados = lerAula(trilha, aula);
    return Object.prototype.hasOwnProperty.call(dados, blocoId) ? dados[blocoId] : undefined;
  }

  function obterRespostasDaAula(trilha, aula) {
    return lerAula(trilha, aula);
  }

  function exportarTudo() {
    const tudo = {};
    for (let i = 0; i < storage.length; i++) {
      const chave = storage.key(i);
      if (chave && chave.startsWith('atividades:')) {
        tudo[chave] = JSON.parse(storage.getItem(chave));
      }
    }
    return tudo;
  }

  function importarTudo(dados) {
    for (const chave of Object.keys(dados)) {
      if (chave.startsWith('atividades:')) {
        storage.setItem(chave, JSON.stringify(dados[chave]));
      }
    }
  }

  return { salvarResposta, obterResposta, obterRespostasDaAula, exportarTudo, importarTudo };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test js/armazenamento.test.js`
Expected: PASS, all 6 tests green.

- [ ] **Step 5: Commit**

```bash
git add js/armazenamento.js js/armazenamento.test.js
git commit -m "Adiciona camada de persistencia com exportar e importar"
```

---

### Task 4: `js/blocos.js` — pure block-logic helpers

**Files:**
- Create: `js/blocos.js`
- Test: `js/blocos.test.js`

**Interfaces:**
- Consumes: none.
- Produces: `normalizarListaAberta(valores, quantidadeCampos)`, `resolverOpcoesSelecao(campo, respostasDoBlocoReferenciado)`, `avaliarRespostaCorreta(bloco, indiceEscolhido)`, `todosCamposPreenchidos(campos, valores)`, `interpolarTexto(modelo, valores)`, `montarResumo(blocosDaAula, respostasDaAula)` — all consumed by `js/app.js` in Tasks 8–11.

- [ ] **Step 1: Write the failing tests**

Create `js/blocos.test.js`:

```js
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test js/blocos.test.js`
Expected: FAIL — `Cannot find module './blocos.js'`.

- [ ] **Step 3: Write the implementation**

Create `js/blocos.js`:

```js
export function normalizarListaAberta(valores, quantidadeCampos) {
  const normalizados = [];
  for (let i = 0; i < quantidadeCampos; i++) {
    const valor = valores[i];
    normalizados.push(typeof valor === 'string' ? valor.trim() : '');
  }
  return normalizados;
}

export function resolverOpcoesSelecao(campo, respostasDoBlocoReferenciado) {
  if (campo.opcoes_de_bloco) {
    const valores = Array.isArray(respostasDoBlocoReferenciado) ? respostasDoBlocoReferenciado : [];
    return valores
      .map((v) => (typeof v === 'string' ? v.trim() : ''))
      .filter((v) => v.length > 0);
  }
  return Array.isArray(campo.opcoes) ? campo.opcoes : [];
}

export function avaliarRespostaCorreta(bloco, indiceEscolhido) {
  return indiceEscolhido === bloco.correta;
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
    const valor = valores[nome];
    return valor === undefined ? correspondencia : formatarNumero(valor);
  });
}

export function montarResumo(blocosDaAula, respostasDaAula) {
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test js/blocos.test.js`
Expected: PASS, all 8 tests green.

- [ ] **Step 5: Commit**

```bash
git add js/blocos.js js/blocos.test.js
git commit -m "Adiciona funcoes puras de logica de blocos"
```

---

### Task 5: Lesson content — `indice.json`, `aula-01.json`, `modelo-aula.json`

**Files:**
- Create: `dados/indice.json`
- Create: `dados/trilha-ia/aula-01.json`
- Create: `dados/modelo-aula.json`

**Interfaces:**
- Produces: the exact JSON shapes consumed by `js/app.js` in Tasks 7–11 (`indice.trilhas[].aulas[].arquivo`, and a lesson's `.titulo` / `.blocos[]` with `tipo` one of `multipla_escolha`, `lista_aberta`, `calculo`, `escolha_simples`).

- [ ] **Step 1: Create `dados/indice.json`**

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
          "arquivo": "dados/trilha-ia/aula-01.json"
        }
      ]
    }
  ]
}
```

- [ ] **Step 2: Create `dados/trilha-ia/aula-01.json`**

```json
{
  "trilha": "trilha-ia",
  "aula": "aula-01",
  "titulo": "Você já usa IA. O problema é como.",
  "blocos": [
    {
      "id": "b1",
      "tipo": "multipla_escolha",
      "enunciado": "Um dono de pizzaria gasta cerca de 15 minutos por dia respondendo a mesma pergunta, \"vocês entregam no meu bairro?\". Pelas três perguntas da aula, essa tarefa é:",
      "opcoes": [
        "Não é candidata, é tempo demais para automatizar",
        "Candidata forte, porque repete, custa tempo e a resposta segue um padrão",
        "Não é candidata, porque atendimento nunca deve ser automatizado",
        "Falta informação para decidir"
      ],
      "correta": 1,
      "feedback_acerto": "Exato. Repete, soma tempo, e a resposta depende só do endereço — é padrão.",
      "feedback_erro": "Reveja o trecho dos 3:30 do vídeo. As três perguntas são: repete, custa tempo, a resposta segue padrão."
    },
    {
      "id": "b2",
      "tipo": "multipla_escolha",
      "enunciado": "A mesma pizzaria recebe uma reclamação de um cliente que pediu para um aniversário e a pizza chegou fria. Pelas três perguntas, essa tarefa é:",
      "opcoes": [
        "Candidata forte, porque reclamação sempre tem resposta pronta",
        "Não é candidata, porque depende de julgamento e do histórico daquele cliente",
        "Candidata, desde que a resposta seja revisada depois",
        "Falta informação para decidir"
      ],
      "correta": 1,
      "feedback_acerto": "Isso. É rara e depende do seu julgamento. Automatizar aqui custa cliente.",
      "feedback_erro": "Reveja o trecho dos 3:30 do vídeo. Uma reclamação de aniversário não se repete do mesmo jeito e exige julgamento — não é padrão."
    },
    {
      "id": "b3",
      "tipo": "lista_aberta",
      "enunciado": "Liste 5 tarefas que você repete no seu negócio toda semana. Escreva do jeito que você falaria, não precisa ser formal.",
      "quantidade_campos": 5,
      "exemplos": [
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
        { "id": "tarefa", "tipo": "selecao", "rotulo": "Qual das cinco?", "opcoes_de_bloco": "b3" },
        { "id": "vezes_semana", "tipo": "numero", "rotulo": "Quantas vezes por semana você faz" },
        { "id": "minutos_vez", "tipo": "numero", "rotulo": "Quanto tempo leva cada vez, em minutos" },
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

- [ ] **Step 3: Create `dados/modelo-aula.json`**

```json
{
  "_leiame": [
    "Este arquivo é um modelo. Copie-o, renomeie e preencha para criar uma aula nova.",
    "Os campos que começam com _ (como este) são apenas explicação e são ignorados pelo aplicativo.",
    "Cada bloco tem um 'id' único dentro da aula (b1, b2, b3...) e um 'tipo'.",
    "Nunca use um id que comece com underline (_) — esses são reservados para uso interno.",
    "Tipos disponíveis: multipla_escolha, lista_aberta, calculo, escolha_simples.",
    "Veja dados/trilha-ia/aula-01.json para um exemplo real e completo."
  ],
  "trilha": "id-da-trilha",
  "aula": "id-da-aula",
  "titulo": "Título que aparece para o aluno",
  "blocos": [
    {
      "_leiame": "Bloco de múltipla escolha: uma pergunta com uma resposta certa.",
      "id": "b1",
      "tipo": "multipla_escolha",
      "enunciado": "Escreva aqui a pergunta.",
      "opcoes": ["Primeira opção", "Segunda opção", "Terceira opção"],
      "correta": 0,
      "feedback_acerto": "Texto mostrado quando o aluno acerta.",
      "feedback_erro": "Texto mostrado quando o aluno erra. Ele pode tentar de novo."
    },
    {
      "_leiame": "Bloco de lista aberta: o aluno escreve respostas livres, um texto por campo.",
      "id": "b2",
      "tipo": "lista_aberta",
      "enunciado": "Escreva aqui a instrução.",
      "ajuda": "Texto de apoio opcional. Pode remover esta linha se não precisar.",
      "quantidade_campos": 3,
      "exemplos": ["exemplo do primeiro campo", "exemplo do segundo campo"]
    },
    {
      "_leiame": "Bloco de cálculo: o aluno preenche números (ou escolhe opções) e vê um resultado calculado na hora.",
      "id": "b3",
      "tipo": "calculo",
      "enunciado": "Escreva aqui a instrução.",
      "campos": [
        {
          "_leiame": "Seleção alimentada pelas respostas de um bloco lista_aberta anterior. Troque 'opcoes_de_bloco' pelo id daquele bloco.",
          "id": "escolha",
          "tipo": "selecao",
          "rotulo": "Texto da pergunta deste campo",
          "opcoes_de_bloco": "b2"
        },
        {
          "_leiame": "Seleção com opções fixas, escritas à mão.",
          "id": "frequencia",
          "tipo": "selecao",
          "rotulo": "Texto da pergunta deste campo",
          "opcoes": ["Sim", "Não", "Às vezes"]
        },
        {
          "_leiame": "Campo numérico simples.",
          "id": "quantidade",
          "tipo": "numero",
          "rotulo": "Texto da pergunta deste campo"
        }
      ],
      "_leiame_calculos": "Cada linha calcula um número novo a partir dos campos numéricos acima (tipo 'numero') ou de cálculos anteriores. Campos de seleção não entram na fórmula. Use apenas + - * / e parênteses.",
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

Run: `node -e "JSON.parse(require('fs').readFileSync('dados/indice.json')); JSON.parse(require('fs').readFileSync('dados/trilha-ia/aula-01.json')); JSON.parse(require('fs').readFileSync('dados/modelo-aula.json')); console.log('ok')"`
Expected: prints `ok` with no error.

- [ ] **Step 5: Commit**

```bash
git add dados/indice.json dados/trilha-ia/aula-01.json dados/modelo-aula.json
git commit -m "Adiciona indice e conteudo real da Aula 1, e o modelo de aula"
```

---

### Task 6: Visual design — `css/estilo.css` and `css/impressao.css`

**Files:**
- Modify: `css/estilo.css` (replace placeholder from Task 1)
- Modify: `css/impressao.css` (replace placeholder from Task 1)

**Interfaces:**
- Consumes: the class names and element ids that Tasks 7–11 will produce in `js/app.js` (`.pagina`, `.lista-trilhas`, `.lista-aulas`, `.botao-grande`, `#barra-progresso`, `#barra-progresso-preenchida`, `#barra-progresso-texto`, `.bloco`, `.enunciado`, `.texto-apoio`, `.opcoes`, `.opcao`, `.opcao-selecionada`, `.feedback`, `.feedback-acerto`, `.feedback-erro`, `.rotulo-campo`, `.campo-texto`, `.campo-numero`, `.campo-selecao`, `.resultado-calculo`, `.resultado`, `.resultado-item`, `.resultado-enunciado`, `.acoes-resultado`, `.nao-imprimir`, `.mensagem-erro`). This task defines these class names up front so later tasks only need to apply them.

- [ ] **Step 1: Replace `css/estilo.css`**

```css
:root {
  --cor-destaque: #1B4B5A;
  --cor-destaque-escura: #123845;
  --cor-texto: #1A1A1A;
  --cor-fundo: #FFFFFF;
  --cor-acerto: #2E6B4F;
  --cor-acerto-fundo: #E6F2EC;
  --cor-erro: #8A4A2F;
  --cor-erro-fundo: #F5E9E2;
  --cor-borda: #C9C9C9;
  --espaco-toque-minimo: 44px;
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  background: var(--cor-fundo);
  color: var(--cor-texto);
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: 16px;
  line-height: 1.5;
  overflow-x: hidden;
}

.pagina {
  max-width: 640px;
  margin: 0 auto;
  padding: 24px 16px 64px;
}

h1 { font-size: 24px; margin: 0 0 8px; }
h2 { font-size: 20px; margin: 0 0 12px; }

.texto-apoio {
  color: #444444;
  margin: 0 0 20px;
}

.mensagem-erro {
  background: var(--cor-erro-fundo);
  color: var(--cor-erro);
  border-radius: 8px;
  padding: 16px;
  font-size: 18px;
}

.lista-trilhas { display: flex; flex-direction: column; gap: 24px; }
.lista-aulas { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }

.botao-grande {
  display: block;
  width: 100%;
  min-height: var(--espaco-toque-minimo);
  padding: 14px 16px;
  font-size: 18px;
  font-weight: 600;
  text-align: center;
  text-decoration: none;
  color: #FFFFFF;
  background: var(--cor-destaque);
  border: none;
  border-radius: 8px;
  cursor: pointer;
}
.botao-grande:hover { background: var(--cor-destaque-escura); }
.botao-grande:focus-visible { outline: 3px solid #000000; outline-offset: 2px; }
.botao-grande[hidden] { display: none; }

.barra-progresso {
  background: #EAEAEA;
  border-radius: 999px;
  height: 10px;
  overflow: hidden;
}
.barra-progresso-preenchida {
  background: var(--cor-destaque);
  height: 100%;
  transition: width 0.3s ease;
}
.barra-progresso-texto {
  font-size: 14px;
  color: #444444;
  margin: 6px 0 24px;
}

.bloco {
  padding: 20px 0;
  border-top: 1px solid var(--cor-borda);
}
.bloco:first-child { border-top: none; padding-top: 0; }

.enunciado {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 16px;
}

.opcoes {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.opcao {
  min-height: var(--espaco-toque-minimo);
  padding: 12px 16px;
  font-size: 17px;
  text-align: left;
  background: #FFFFFF;
  color: var(--cor-texto);
  border: 2px solid var(--cor-borda);
  border-radius: 8px;
  cursor: pointer;
}
.opcao:focus-visible { outline: 3px solid #000000; outline-offset: 2px; }
.opcao-selecionada { border-color: var(--cor-destaque); background: #EAF1F3; }

.feedback {
  padding: 14px 16px;
  border-radius: 8px;
  font-size: 17px;
  margin-bottom: 16px;
}
.feedback[hidden] { display: none; }
.feedback-acerto { background: var(--cor-acerto-fundo); color: var(--cor-acerto); }
.feedback-erro { background: var(--cor-erro-fundo); color: var(--cor-erro); }

.rotulo-campo {
  display: block;
  font-size: 16px;
  font-weight: 600;
  margin: 12px 0 6px;
}

.campo-texto, .campo-numero, .campo-selecao {
  display: block;
  width: 100%;
  min-height: var(--espaco-toque-minimo);
  padding: 10px 12px;
  font-size: 17px;
  border: 2px solid var(--cor-borda);
  border-radius: 8px;
  margin-bottom: 8px;
  font-family: inherit;
  color: var(--cor-texto);
  background: #FFFFFF;
}
.campo-texto:focus-visible, .campo-numero:focus-visible, .campo-selecao:focus-visible {
  outline: 3px solid var(--cor-destaque);
  outline-offset: 1px;
}

.resultado-calculo {
  font-size: 18px;
  font-weight: 600;
  background: #EAF1F3;
  border-radius: 8px;
  padding: 14px 16px;
  margin: 12px 0 16px;
}
.resultado-calculo[hidden] { display: none; }

.resultado { padding-top: 24px; border-top: 2px solid var(--cor-destaque); margin-top: 24px; }
.resultado-item { margin-bottom: 20px; }
.resultado-enunciado { font-weight: 600; margin-bottom: 8px; }
.acoes-resultado { display: flex; flex-direction: column; gap: 12px; margin-top: 24px; }

@media (min-width: 480px) {
  .enunciado { font-size: 22px; }
}
```

- [ ] **Step 2: Replace `css/impressao.css`**

```css
@media print {
  #barra-progresso,
  #barra-progresso-texto,
  .bloco,
  .nao-imprimir {
    display: none !important;
  }

  body {
    color: #000000;
    background: #FFFFFF;
  }

  .resultado {
    border-top: none;
    padding-top: 0;
    margin-top: 0;
  }
}
```

- [ ] **Step 3: Manual check at 360px**

Open `index.html` in a browser, open devtools, set the viewport to 360×640. Expected: no horizontal scrollbar, text is legible, the (still placeholder-empty) page has generous margins.

- [ ] **Step 4: Commit**

```bash
git add css/estilo.css css/impressao.css
git commit -m "Define paleta, tipografia e estilos de todos os componentes"
```

---

### Task 7: `js/app.js` — home page (index.html) rendering

**Files:**
- Create: `js/app.js`

**Interfaces:**
- Consumes: `dados/indice.json` shape from Task 5.
- Produces: `iniciarPaginaInicial()` — later tasks append `iniciarAtividade()` and other functions to this same file.

- [ ] **Step 1: Write `js/app.js` with the home-page bootstrap**

```js
async function buscarJson(caminho) {
  const resposta = await fetch(caminho);
  if (!resposta.ok) throw new Error(`Falha ao buscar ${caminho}`);
  return resposta.json();
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

      const lista = document.createElement('ul');
      lista.className = 'lista-aulas';
      for (const aula of trilha.aulas) {
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.className = 'botao-grande';
        link.href = `atividade.html?trilha=${trilha.id}&aula=${aula.id}`;
        link.textContent = aula.titulo;
        item.appendChild(link);
        lista.appendChild(item);
      }
      secao.appendChild(lista);
      listaTrilhas.appendChild(secao);
    }
  } catch {
    listaTrilhas.innerHTML = '<p class="mensagem-erro">Não foi possível carregar as aulas agora. Tente novamente em instantes.</p>';
  }
}

iniciarPaginaInicial();
```

- [ ] **Step 2: Manual test**

Serve the project with a static server (from the project root: `python3 -m http.server 8000` or any static server that does not rewrite URLs — see Global Constraints on why `file://` is not supported and why `npx serve`'s default clean-URLs behavior breaks query-string lessons). Open `index.html`. Expected: a heading "IA no Negócio" and one button-styled link "Você já usa IA. O problema é como.", pointing to `atividade.html?trilha=trilha-ia&aula=aula-01`.

- [ ] **Step 3: Commit**

```bash
git add js/app.js
git commit -m "Renderiza a lista de trilhas e aulas na pagina inicial"
```

---

### Task 8: Activity bootstrap + `multipla_escolha` rendering

**Files:**
- Modify: `js/app.js`

**Interfaces:**
- Consumes: `criarArmazenamento` from `js/armazenamento.js` (Task 3), `avaliarRespostaCorreta` from `js/blocos.js` (Task 4).
- Produces: `iniciarAtividade()`, `renderizarBloco(bloco, ctx)` dispatcher, `renderizarMultiplaEscolha(bloco, ctx)`, `criarBotaoGrande(texto, aoClicar)`, `mostrarErroAtividade(mensagem)`, `atualizarBarraProgresso(passoAtual, total)`. The `ctx` object shape produced by `contextoDoBloco` here — `{ trilha, aula, respostaSalva, obterRespostasDaAula, registrarDependente, notificarDependentes, aoAvancar }` — is relied on unchanged by Tasks 9–11.

- [ ] **Step 1: Add imports and shared helpers to the top of `js/app.js`**

```js
import { criarArmazenamento } from './armazenamento.js';
import { avaliarCalculos } from './formula.js';
import {
  resolverOpcoesSelecao,
  avaliarRespostaCorreta,
  normalizarListaAberta,
  todosCamposPreenchidos,
  montarResumo,
  interpolarTexto
} from './blocos.js';

const armazenamento = criarArmazenamento(window.localStorage);
const CHAVE_PROGRESSO = '_progresso';

function criarBotaoGrande(texto, aoClicar) {
  const botao = document.createElement('button');
  botao.type = 'button';
  botao.className = 'botao-grande';
  botao.textContent = texto;
  botao.addEventListener('click', aoClicar);
  return botao;
}

function mostrarErroAtividade(mensagem) {
  const conteudo = document.getElementById('conteudo-atividade');
  const barra = document.getElementById('barra-progresso');
  if (barra) barra.hidden = true;
  conteudo.innerHTML = `<p class="mensagem-erro">${mensagem}</p>`;
}

function atualizarBarraProgresso(passoAtual, total) {
  const barra = document.getElementById('barra-progresso');
  const preenchida = document.getElementById('barra-progresso-preenchida');
  const texto = document.getElementById('barra-progresso-texto');
  barra.hidden = false;
  const passoLimitado = Math.min(passoAtual, total);
  preenchida.style.width = `${Math.round((passoLimitado / total) * 100)}%`;
  texto.textContent = `Passo ${passoLimitado} de ${total}`;
}
```

(Keep the existing `buscarJson` and `iniciarPaginaInicial` from Task 7 above these additions.)

- [ ] **Step 2: Add the block dispatcher and `multipla_escolha` renderer**

```js
function renderizarBloco(bloco, ctx) {
  if (bloco.tipo === 'multipla_escolha') return renderizarMultiplaEscolha(bloco, ctx);
  throw new Error(`Tipo de bloco desconhecido: ${bloco.tipo}`);
}

function renderizarMultiplaEscolha(bloco, ctx) {
  const container = document.createElement('div');
  container.className = 'bloco';
  container.id = bloco.id;

  const enunciado = document.createElement('p');
  enunciado.className = 'enunciado';
  enunciado.textContent = bloco.enunciado;
  container.appendChild(enunciado);

  const opcoesContainer = document.createElement('div');
  opcoesContainer.className = 'opcoes';

  const feedback = document.createElement('p');
  feedback.className = 'feedback';
  feedback.hidden = true;

  const botaoContinuar = criarBotaoGrande('Continuar', ctx.aoAvancar);
  botaoContinuar.classList.add('nao-imprimir');
  botaoContinuar.hidden = true;

  function responder(indiceEscolhido) {
    Array.from(opcoesContainer.children).forEach((b) => {
      b.classList.remove('opcao-selecionada');
      b.setAttribute('aria-pressed', 'false');
    });
    opcoesContainer.children[indiceEscolhido].classList.add('opcao-selecionada');
    opcoesContainer.children[indiceEscolhido].setAttribute('aria-pressed', 'true');
    const correta = avaliarRespostaCorreta(bloco, indiceEscolhido);
    feedback.hidden = false;
    feedback.textContent = correta ? bloco.feedback_acerto : bloco.feedback_erro;
    feedback.className = `feedback ${correta ? 'feedback-acerto' : 'feedback-erro'}`;
    botaoContinuar.hidden = !correta;
    if (correta) {
      armazenamento.salvarResposta(ctx.trilha, ctx.aula, bloco.id, indiceEscolhido);
    }
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

  if (ctx.respostaSalva !== undefined) responder(ctx.respostaSalva);

  return container;
}
```

- [ ] **Step 3: Add `iniciarAtividade` and its supporting closures**

```js
function pegarParametrosDaUrl() {
  const parametros = new URLSearchParams(window.location.search);
  return { trilha: parametros.get('trilha'), aula: parametros.get('aula') };
}

async function iniciarAtividade() {
  const conteudo = document.getElementById('conteudo-atividade');
  if (!conteudo) return;

  const { trilha, aula } = pegarParametrosDaUrl();
  if (!trilha || !aula) {
    mostrarErroAtividade('Não encontramos esta atividade. Volte para a área de membros e clique no link novamente.');
    return;
  }

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

  const dependentesPorBloco = {};

  function registrarDependente(blocoId, aoAtualizar) {
    if (!dependentesPorBloco[blocoId]) dependentesPorBloco[blocoId] = [];
    dependentesPorBloco[blocoId].push(aoAtualizar);
  }

  function notificarDependentes(blocoId) {
    (dependentesPorBloco[blocoId] || []).forEach((aoAtualizar) => aoAtualizar());
  }

  function respostasAtuais() {
    return armazenamento.obterRespostasDaAula(trilha, aula);
  }

  function contextoDoBloco(indiceBloco) {
    const bloco = dadosAula.blocos[indiceBloco];
    return {
      trilha,
      aula,
      respostaSalva: respostasAtuais()[bloco.id],
      obterRespostasDaAula: respostasAtuais,
      registrarDependente,
      notificarDependentes,
      aoAvancar: () => avancarProgresso(indiceBloco + 1)
    };
  }

  function avancarProgresso(proximoIndice) {
    armazenamento.salvarResposta(trilha, aula, CHAVE_PROGRESSO, proximoIndice);
    atualizarBarraProgresso(Math.min(proximoIndice + 1, dadosAula.blocos.length), dadosAula.blocos.length);
    if (proximoIndice >= dadosAula.blocos.length) return;
    const novoBloco = renderizarBloco(dadosAula.blocos[proximoIndice], contextoDoBloco(proximoIndice));
    conteudo.appendChild(novoBloco);
    novoBloco.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const progressoSalvo = respostasAtuais()[CHAVE_PROGRESSO] ?? 0;
  atualizarBarraProgresso(Math.min(progressoSalvo + 1, dadosAula.blocos.length), dadosAula.blocos.length);
  const ultimoIndiceARenderizar = Math.min(progressoSalvo, dadosAula.blocos.length - 1);
  for (let i = 0; i <= ultimoIndiceARenderizar; i++) {
    conteudo.appendChild(renderizarBloco(dadosAula.blocos[i], contextoDoBloco(i)));
  }
}

iniciarAtividade();
```

- [ ] **Step 4: Manual test**

Serve the project and open `atividade.html?trilha=trilha-ia&aula=aula-01`. Expected: block `b1`'s question renders with 4 options and a progress bar reading "Passo 1 de 5". Click a wrong option: red feedback shows, no "Continuar" button. Click the correct option: green feedback shows and "Continuar" appears — but clicking it currently throws (block `b2` also `multipla_escolha`, which the dispatcher *does* support, so it should actually render `b2` correctly and stop there, since `b3` is `lista_aberta` which is not yet implemented). Confirm `b2` renders, answer it correctly, and confirm attempting to advance past `b2` throws `Tipo de bloco desconhecido: lista_aberta` in the console — this is expected at this stage. Reload the page: confirm `b1` and `b2` reappear pre-filled with their correct answers and green feedback.

- [ ] **Step 5: Manual test — unknown activity**

Open `atividade.html?trilha=nope&aula=nope`. Expected: the plain-language error message, no console stack trace shown to the user.

- [ ] **Step 6: Commit**

```bash
git add js/app.js
git commit -m "Adiciona motor da atividade e renderizacao de multipla escolha"
```

---

### Task 9: `lista_aberta` rendering + dependent-block notification

**Files:**
- Modify: `js/app.js`

**Interfaces:**
- Consumes: `normalizarListaAberta` from `js/blocos.js`.
- Produces: `renderizarListaAberta(bloco, ctx)`, registered in the dispatcher.

- [ ] **Step 1: Register the new type in the dispatcher**

In `renderizarBloco`, add the branch:

```js
function renderizarBloco(bloco, ctx) {
  if (bloco.tipo === 'multipla_escolha') return renderizarMultiplaEscolha(bloco, ctx);
  if (bloco.tipo === 'lista_aberta') return renderizarListaAberta(bloco, ctx);
  throw new Error(`Tipo de bloco desconhecido: ${bloco.tipo}`);
}
```

- [ ] **Step 2: Add `renderizarListaAberta`**

```js
function renderizarListaAberta(bloco, ctx) {
  const container = document.createElement('div');
  container.className = 'bloco';
  container.id = bloco.id;

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
    campo.placeholder = (bloco.exemplos && bloco.exemplos[i]) || 'escreva aqui';

    campo.addEventListener('input', () => {
      valoresAtuais[i] = campo.value;
      armazenamento.salvarResposta(ctx.trilha, ctx.aula, bloco.id, normalizarListaAberta(valoresAtuais, bloco.quantidade_campos));
      ctx.notificarDependentes(bloco.id);
    });

    container.appendChild(rotulo);
    container.appendChild(campo);
  }

  const botaoContinuar = criarBotaoGrande('Continuar', ctx.aoAvancar);
  botaoContinuar.classList.add('nao-imprimir');
  container.appendChild(botaoContinuar);
  return container;
}
```

- [ ] **Step 3: Manual test**

Serve the project, open `atividade.html?trilha=trilha-ia&aula=aula-01`, answer `b1` and `b2` correctly. Expected: `b3` appears with 5 labeled text fields, the first three showing the specified placeholders and the last two showing the generic "escreva aqui" placeholder. Type into a couple of fields, reload the page: confirm `b1`, `b2`, `b3` all reappear with previous values intact (progress bar reads "Passo 3 de 5"). Confirm attempting to click "Continuar" on `b3` throws `Tipo de bloco desconhecido: calculo` — expected at this stage.

- [ ] **Step 4: Commit**

```bash
git add js/app.js
git commit -m "Adiciona renderizacao de lista aberta e notificacao de dependentes"
```

---

### Task 10: `calculo` rendering with live cross-block dependency

**Files:**
- Modify: `js/app.js`

**Interfaces:**
- Consumes: `resolverOpcoesSelecao`, `todosCamposPreenchidos`, `interpolarTexto` from `js/blocos.js`; `avaliarCalculos` from `js/formula.js`; `ctx.registrarDependente` / `ctx.obterRespostasDaAula` from Task 8.
- Produces: `renderizarCalculo(bloco, ctx)`, registered in the dispatcher. Saves answers shaped as `{ ...valoresDosCampos, resultadoTexto: string }` — this shape is what `montarResumo` (Task 4) expects to find under `respostasDaAula[blocoId].resultadoTexto`.

- [ ] **Step 1: Register the new type in the dispatcher**

```js
function renderizarBloco(bloco, ctx) {
  if (bloco.tipo === 'multipla_escolha') return renderizarMultiplaEscolha(bloco, ctx);
  if (bloco.tipo === 'lista_aberta') return renderizarListaAberta(bloco, ctx);
  if (bloco.tipo === 'calculo') return renderizarCalculo(bloco, ctx);
  throw new Error(`Tipo de bloco desconhecido: ${bloco.tipo}`);
}
```

- [ ] **Step 2: Add `renderizarCalculo`**

```js
function renderizarCalculo(bloco, ctx) {
  const container = document.createElement('div');
  container.className = 'bloco';
  container.id = bloco.id;

  const enunciado = document.createElement('p');
  enunciado.className = 'enunciado';
  enunciado.textContent = bloco.enunciado;
  container.appendChild(enunciado);

  const respostaSalva = ctx.respostaSalva || {};
  const valoresAtuais = {};

  const resultadoTexto = document.createElement('p');
  resultadoTexto.className = 'resultado-calculo';
  resultadoTexto.hidden = true;

  const botaoContinuar = criarBotaoGrande('Continuar', ctx.aoAvancar);
  botaoContinuar.classList.add('nao-imprimir');
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
    armazenamento.salvarResposta(ctx.trilha, ctx.aula, bloco.id, { ...valoresAtuais, resultadoTexto: texto });
  }

  for (const campo of bloco.campos) {
    const rotulo = document.createElement('label');
    rotulo.className = 'rotulo-campo';
    rotulo.setAttribute('for', `${bloco.id}-${campo.id}`);
    rotulo.textContent = campo.rotulo;
    container.appendChild(rotulo);

    if (campo.tipo === 'selecao') {
      const elemento = document.createElement('select');
      elemento.id = `${bloco.id}-${campo.id}`;
      elemento.className = 'campo-selecao';

      function preencherOpcoes() {
        const valorAnterior = elemento.value;
        elemento.innerHTML = '';
        const opcaoVazia = document.createElement('option');
        opcaoVazia.value = '';
        opcaoVazia.textContent = 'Escolha uma opção';
        elemento.appendChild(opcaoVazia);
        const respostasReferenciadas = campo.opcoes_de_bloco
          ? ctx.obterRespostasDaAula()[campo.opcoes_de_bloco]
          : undefined;
        const opcoes = resolverOpcoesSelecao(campo, respostasReferenciadas);
        for (const opcao of opcoes) {
          const item = document.createElement('option');
          item.value = opcao;
          item.textContent = opcao;
          elemento.appendChild(item);
        }
        elemento.value = opcoes.includes(valorAnterior) ? valorAnterior : '';
        valoresAtuais[campo.id] = elemento.value;
      }

      preencherOpcoes();
      if (opcoesContemValor(elemento, respostaSalva[campo.id])) {
        elemento.value = respostaSalva[campo.id];
      }
      valoresAtuais[campo.id] = elemento.value;

      if (campo.opcoes_de_bloco) {
        ctx.registrarDependente(campo.opcoes_de_bloco, () => {
          preencherOpcoes();
          recalcular();
        });
      }

      elemento.addEventListener('change', () => {
        valoresAtuais[campo.id] = elemento.value;
        recalcular();
      });

      container.appendChild(elemento);
    } else {
      const elemento = document.createElement('input');
      elemento.type = 'number';
      elemento.inputMode = 'numeric';
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

function opcoesContemValor(elementoSelect, valor) {
  return Array.from(elementoSelect.options).some((opcao) => opcao.value === valor);
}
```

- [ ] **Step 3: Manual test — live dependency**

Serve the project, open the activity fresh (clear site data first), answer `b1`/`b2` correctly, fill all 5 fields of `b3` with distinct short phrases. Expected: `b4` appears; its "Qual das cinco?" `<select>` lists exactly the non-empty phrases typed in `b3`. Go back up to a `b3` field (still visible on the page, not removed) and change its text. Expected: without reloading, `b4`'s `<select>` options update live to reflect the edited text (if that item was the currently selected one, the selection may reset to "Escolha uma opção" — acceptable).

- [ ] **Step 4: Manual test — live calculation**

In `b4`, pick a task, type `4` for "vezes por semana" and `10` for "minutos cada vez", and pick any option for "resposta certa é sempre a mesma". Expected: as soon as all four fields have a value, a result line appears reading "Você gasta cerca de 40 minutos por semana, o que dá 2,9 horas por mês." (recomputed on every keystroke) and "Continuar" appears. Clear one field: expected the result line and "Continuar" disappear again.

- [ ] **Step 5: Manual test — reload persistence**

Reload the page. Expected: `b1`–`b4` all reappear fully pre-filled, including the correct `<select>` value in `b4`, and the same result text. Confirm the console shows `Tipo de bloco desconhecido: escolha_simples` only if you attempt to advance past `b4` — expected at this stage.

- [ ] **Step 6: Commit**

```bash
git add js/app.js
git commit -m "Adiciona renderizacao de calculo com dependencia ao vivo entre blocos"
```

---

### Task 11: `escolha_simples` rendering + results screen

**Files:**
- Modify: `js/app.js`

**Interfaces:**
- Consumes: `montarResumo` from `js/blocos.js`.
- Produces: `renderizarEscolhaSimples(bloco, ctx)`, `renderizarResultado()`, wired so `avancarProgresso` calls `renderizarResultado()` once `_progresso` reaches `blocos.length`.

- [ ] **Step 1: Register the new type in the dispatcher**

```js
function renderizarBloco(bloco, ctx) {
  if (bloco.tipo === 'multipla_escolha') return renderizarMultiplaEscolha(bloco, ctx);
  if (bloco.tipo === 'lista_aberta') return renderizarListaAberta(bloco, ctx);
  if (bloco.tipo === 'calculo') return renderizarCalculo(bloco, ctx);
  if (bloco.tipo === 'escolha_simples') return renderizarEscolhaSimples(bloco, ctx);
  throw new Error(`Tipo de bloco desconhecido: ${bloco.tipo}`);
}
```

- [ ] **Step 2: Add `renderizarEscolhaSimples`**

```js
function renderizarEscolhaSimples(bloco, ctx) {
  const container = document.createElement('div');
  container.className = 'bloco';
  container.id = bloco.id;

  const enunciado = document.createElement('p');
  enunciado.className = 'enunciado';
  enunciado.textContent = bloco.enunciado;
  container.appendChild(enunciado);

  const opcoesContainer = document.createElement('div');
  opcoesContainer.className = 'opcoes';

  const botaoContinuar = criarBotaoGrande('Continuar', ctx.aoAvancar);
  botaoContinuar.classList.add('nao-imprimir');

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
      armazenamento.salvarResposta(ctx.trilha, ctx.aula, bloco.id, indice);
    });
    opcoesContainer.appendChild(botao);
  });

  container.appendChild(opcoesContainer);
  container.appendChild(botaoContinuar);
  return container;
}
```

- [ ] **Step 3: Add `renderizarResultado` and wire it into `avancarProgresso`**

Inside `iniciarAtividade`, replace the body of `avancarProgresso` and add `renderizarResultado`:

```js
  function avancarProgresso(proximoIndice) {
    armazenamento.salvarResposta(trilha, aula, CHAVE_PROGRESSO, proximoIndice);
    atualizarBarraProgresso(Math.min(proximoIndice + 1, dadosAula.blocos.length), dadosAula.blocos.length);
    if (proximoIndice >= dadosAula.blocos.length) {
      renderizarResultado();
      return;
    }
    const novoBloco = renderizarBloco(dadosAula.blocos[proximoIndice], contextoDoBloco(proximoIndice));
    conteudo.appendChild(novoBloco);
    novoBloco.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderizarResultado() {
    const secao = document.createElement('div');
    secao.className = 'resultado';

    const titulo = document.createElement('h2');
    titulo.textContent = 'O que você construiu nesta aula';
    secao.appendChild(titulo);

    const itens = montarResumo(dadosAula.blocos, respostasAtuais());
    for (const item of itens) {
      const blocoResumo = document.createElement('div');
      blocoResumo.className = 'resultado-item';

      const enunciado = document.createElement('p');
      enunciado.className = 'resultado-enunciado';
      enunciado.textContent = item.enunciado;
      blocoResumo.appendChild(enunciado);

      if (item.tipo === 'lista') {
        const lista = document.createElement('ul');
        for (const valor of item.valores) {
          const li = document.createElement('li');
          li.textContent = valor;
          lista.appendChild(li);
        }
        blocoResumo.appendChild(lista);
      } else {
        const texto = document.createElement('p');
        texto.textContent = item.texto;
        blocoResumo.appendChild(texto);
      }
      secao.appendChild(blocoResumo);
    }

    conteudo.appendChild(secao);
    secao.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
```

Also update the initial render at the bottom of `iniciarAtividade` to show the results screen immediately if the lesson was already fully completed before this page load:

```js
  const progressoSalvo = respostasAtuais()[CHAVE_PROGRESSO] ?? 0;
  atualizarBarraProgresso(Math.min(progressoSalvo + 1, dadosAula.blocos.length), dadosAula.blocos.length);
  const ultimoIndiceARenderizar = Math.min(progressoSalvo, dadosAula.blocos.length - 1);
  for (let i = 0; i <= ultimoIndiceARenderizar; i++) {
    conteudo.appendChild(renderizarBloco(dadosAula.blocos[i], contextoDoBloco(i)));
  }
  if (progressoSalvo >= dadosAula.blocos.length) {
    renderizarResultado();
  }
```

- [ ] **Step 4: Manual test**

Complete `b1` through `b4` as in Task 10, then answer `b5`. Expected: clicking any `b5` option immediately reveals the results screen with heading "O que você construiu nesta aula", a bullet list of the non-empty tasks typed in `b3`, and the `b4` result sentence. Reload the page: expected the whole lesson (all 5 blocks, pre-filled) plus the results screen render immediately, in that order.

- [ ] **Step 5: Commit**

```bash
git add js/app.js
git commit -m "Adiciona escolha simples e a tela de resultado generica"
```

---

### Task 12: Export, import, and print on the results screen

**Files:**
- Modify: `js/app.js`

**Interfaces:**
- Consumes: `armazenamento.exportarTudo()` / `armazenamento.importarTudo()` from Task 3.
- Produces: three buttons appended to `renderizarResultado()`'s `.acoes-resultado` container.

- [ ] **Step 1: Add export/import/print helpers and wire them into `renderizarResultado`**

Add these functions near the other top-level helpers in `js/app.js`:

```js
function exportarRespostas() {
  const tudo = armazenamento.exportarTudo();
  const blob = new Blob([JSON.stringify(tudo, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'minhas-respostas.json';
  link.click();
  URL.revokeObjectURL(url);
}

function criarBotaoImportar() {
  const entrada = document.createElement('input');
  entrada.type = 'file';
  entrada.accept = 'application/json';
  entrada.hidden = true;
  entrada.addEventListener('change', async () => {
    const arquivo = entrada.files[0];
    if (!arquivo) return;
    const texto = await arquivo.text();
    armazenamento.importarTudo(JSON.parse(texto));
    window.location.reload();
  });
  const botao = criarBotaoGrande('Recuperar minhas respostas de outro celular', () => entrada.click());
  botao.appendChild(entrada);
  return botao;
}
```

Then, at the end of `renderizarResultado`, before appending `secao` to `conteudo`, add:

```js
    const acoes = document.createElement('div');
    acoes.className = 'acoes-resultado nao-imprimir';
    acoes.appendChild(criarBotaoGrande('Imprimir ou salvar em PDF', () => window.print()));
    acoes.appendChild(criarBotaoGrande('Salvar uma cópia das minhas respostas', exportarRespostas));
    acoes.appendChild(criarBotaoImportar());
    secao.appendChild(acoes);
```

(This block goes right after the loop that builds `itens`, and before the existing `conteudo.appendChild(secao)` / `scrollIntoView` lines.)

- [ ] **Step 2: Manual test — export/import round trip**

Complete the lesson to reach the results screen. Click "Salvar uma cópia das minhas respostas": expected a `minhas-respostas.json` file downloads. Open browser devtools → Application/Storage → clear this site's `localStorage`. Reload `atividade.html?trilha=trilha-ia&aula=aula-01`: expected the lesson now starts fresh at `b1`. Click through to the results screen area is not reachable yet since data is gone — instead, reload once more and click "Recuperar minhas respostas de outro celular", choose the previously downloaded file. Expected: the page reloads and the entire lesson (all blocks plus results) reappears exactly as before it was cleared.

- [ ] **Step 3: Manual test — print**

On the results screen, open the browser's print preview (Ctrl+P / Cmd+P). Expected: only the "O que você construiu nesta aula" heading, the list of tasks, and the calculation sentence are visible — the progress bar, all answered question blocks, and the three action buttons are hidden.

- [ ] **Step 4: Commit**

```bash
git add js/app.js
git commit -m "Adiciona exportar, importar e impressao na tela de resultado"
```

---

### Task 13: `README.md`

**Files:**
- Create: `README.md`

**Interfaces:**
- Consumes: the final file layout and JSON shapes from all previous tasks.

- [ ] **Step 1: Write `README.md`**

```markdown
# Atividades do curso

Aplicativo simples para as atividades que os alunos fazem depois de assistir a cada videoaula. Ele roda direto no navegador do aluno — não precisa de internet além de abrir a página, não guarda nada em nenhum servidor, e as respostas ficam salvas no próprio celular ou computador do aluno.

## Como está organizado

- `index.html` — a página inicial, com a lista de aulas.
- `atividade.html` — a página que mostra a atividade de uma aula específica.
- `dados/indice.json` — a lista de todas as trilhas e aulas que existem. Toda aula precisa estar listada aqui para aparecer na página inicial.
- `dados/modelo-aula.json` — um modelo pronto para copiar quando for criar uma aula nova.
- `dados/<nome-da-trilha>/aula-XX.json` — o conteúdo de cada aula.
- As pastas `css` e `js` cuidam da aparência e do funcionamento do aplicativo. Você não precisa mexer nelas para criar uma aula nova.

## Como criar uma aula nova (sem programar)

1. Copie o arquivo `dados/modelo-aula.json`.
2. Cole a cópia dentro da pasta da trilha (por exemplo, `dados/trilha-ia/`) e dê um nome como `aula-02.json`.
3. Abra o arquivo e substitua os textos de exemplo pelo conteúdo da sua aula: título, perguntas, opções, etc. As linhas que começam com `_leiame` são só explicações — pode apagar todas, elas não aparecem para o aluno.
4. Abra `dados/indice.json` e adicione uma linha nova dentro da lista `aulas` da trilha correta, apontando para o arquivo que você acabou de criar. Por exemplo:

```json
{ "id": "aula-02", "titulo": "Título da nova aula", "arquivo": "dados/trilha-ia/aula-02.json" }
```

5. Pronto. Não é preciso mexer em nenhum arquivo `.js`.

## Os quatro tipos de pergunta

- **`multipla_escolha`** — uma pergunta com uma resposta certa entre várias opções. O aluno recebe uma mensagem quando acerta e outra quando erra, podendo tentar de novo.
- **`lista_aberta`** — vários campos de texto livre, para o aluno escrever com as próprias palavras.
- **`calculo`** — o aluno preenche números (ou escolhe opções) e vê um resultado calculado na hora, sem precisar apertar nenhum botão de "calcular". Um campo de seleção deste bloco pode se alimentar do que o aluno escreveu em um bloco de lista aberta anterior — é só usar `opcoes_de_bloco` com o id daquele bloco.
- **`escolha_simples`** — uma pergunta de reflexão, sem resposta certa ou errada.

O arquivo `dados/modelo-aula.json` tem um exemplo pronto de cada um dos quatro tipos, com explicações ao lado de cada campo.

## Testando no seu computador

Não é preciso instalar nada para ver o aplicativo funcionando: basta publicá-lo no GitHub Pages (próxima seção) ou servir a pasta com qualquer servidor de arquivos estáticos local.

Se quiser rodar os testes automáticos das partes internas do aplicativo (não é necessário para criar aulas), é preciso ter o Node.js instalado e rodar, na pasta do projeto:

```
node --test js/*.test.js
```

## Publicando no GitHub Pages

1. Crie um repositório novo no GitHub e envie todos os arquivos desta pasta para ele.
2. No GitHub, abra o repositório e vá em **Settings** → **Pages**.
3. Em "Build and deployment", escolha a opção **Deploy from a branch**.
4. Selecione a branch `main` (ou `master`) e a pasta `/ (root)`. Clique em Save.
5. Depois de alguns minutos, o GitHub mostra o endereço do site, algo como `https://seu-usuario.github.io/nome-do-repositorio/`.
6. O link de cada atividade, para colocar na área de membros, segue o formato: `https://seu-usuario.github.io/nome-do-repositorio/atividade.html?trilha=trilha-ia&aula=aula-01` (troque `trilha-ia` e `aula-01` pelos ids da aula desejada, do jeito que estão em `dados/indice.json`).
7. Sempre que você adicionar uma aula nova e enviar (`git push`) as mudanças para o GitHub, o site atualiza sozinho em alguns minutos.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "Adiciona README explicando como criar uma aula nova"
```

---

### Task 14: Final QA pass

**Files:** none (verification only, using files from all previous tasks).

**Interfaces:** none — this task only verifies existing behavior end to end.

- [ ] **Step 1: Run the full automated test suite**

Run: `node --test js/*.test.js`
Expected: all tests from Tasks 2–4 pass (23 tests total: 9 in `formula.test.js`, 6 in `armazenamento.test.js`, 8 in `blocos.test.js`). Note: a bare `node --test js/` (directory argument, no glob) fails on some Node/Windows setups with `MODULE_NOT_FOUND` — always use the explicit glob form.

- [ ] **Step 2: 360px viewport check across every screen**

With devtools set to 360×640: check `index.html`, `atividade.html` at each block type (`b1`–`b5`), and the results screen. Expected: no horizontal scrollbar anywhere, no text clipped or overlapping.

- [ ] **Step 3: Keyboard-only navigation check**

Using only Tab, Shift+Tab, Enter, and Space (no mouse), complete the entire lesson from `atividade.html?trilha=trilha-ia&aula=aula-01` with a cleared `localStorage`. Expected: every button, option, text field, and select is reachable and operable, and focus outlines are visible at each stop (the `:focus-visible` outline defined in Task 6).

- [ ] **Step 4: Contrast spot check**

Confirm body text (`#1A1A1A` on `#FFFFFF`), the accent button (`#FFFFFF` on `#1B4B5A`), and the two feedback colors (`#2E6B4F` on `#E6F2EC`, `#8A4A2F` on `#F5E9E2`) all meet WCAG AA for normal text (4.5:1) — these are the same fixed color pairs from `css/estilo.css`, verify with any contrast checker.

- [ ] **Step 5: Confirm GitHub Pages is the supported path (informational, not a defect)**

Opening `index.html` by double-clicking it (`file://`) will show a load error in most browsers, because `fetch` is blocked for local files — this is expected and is not a bug to fix; it was resolved during planning as an accepted trade-off, since the student only ever reaches the app through a published GitHub Pages link, never by opening a local file. Confirm this by serving the folder with any static file server and reloading — the load error should disappear.

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "Finaliza QA da Aula 1 e do motor generico de atividades"
```
