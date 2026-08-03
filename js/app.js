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

function renderizarBloco(bloco, ctx) {
  if (bloco.tipo === 'multipla_escolha') return renderizarMultiplaEscolha(bloco, ctx);
  if (bloco.tipo === 'lista_aberta') return renderizarListaAberta(bloco, ctx);
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

  let progressoAtual = respostasAtuais()[CHAVE_PROGRESSO] ?? 0;

  function avancarProgresso(proximoIndice) {
    if (proximoIndice <= progressoAtual) return;
    progressoAtual = proximoIndice;
    armazenamento.salvarResposta(trilha, aula, CHAVE_PROGRESSO, proximoIndice);
    atualizarBarraProgresso(Math.min(proximoIndice + 1, dadosAula.blocos.length), dadosAula.blocos.length);
    if (proximoIndice >= dadosAula.blocos.length) return;
    const novoBloco = renderizarBloco(dadosAula.blocos[proximoIndice], contextoDoBloco(proximoIndice));
    conteudo.appendChild(novoBloco);
    novoBloco.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  atualizarBarraProgresso(Math.min(progressoAtual + 1, dadosAula.blocos.length), dadosAula.blocos.length);
  const ultimoIndiceARenderizar = Math.min(progressoAtual, dadosAula.blocos.length - 1);
  for (let i = 0; i <= ultimoIndiceARenderizar; i++) {
    conteudo.appendChild(renderizarBloco(dadosAula.blocos[i], contextoDoBloco(i)));
  }
}

iniciarAtividade();
