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
