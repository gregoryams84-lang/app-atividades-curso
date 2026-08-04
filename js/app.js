import { criarArmazenamento } from './armazenamento.js';
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
import { criarResolvedorDependencias } from './dependencias.js';

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
  if (bloco.tipo === 'cenario') return renderizarCenario(bloco, ctx);
  if (bloco.tipo === 'lista_aberta') return renderizarListaAberta(bloco, ctx);
  if (bloco.tipo === 'calculo') return renderizarCalculo(bloco, ctx);
  if (bloco.tipo === 'escolha_simples') return renderizarEscolhaSimples(bloco, ctx);
  throw new Error(`Tipo de bloco desconhecido: ${bloco.tipo}`);
}

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

  function exibirFeedback(indiceEscolhido, correta, tentativasParaNivel) {
    Array.from(opcoesContainer.children).forEach((b) => {
      b.classList.remove('opcao-selecionada');
      b.setAttribute('aria-pressed', 'false');
    });
    opcoesContainer.children[indiceEscolhido].classList.add('opcao-selecionada');
    opcoesContainer.children[indiceEscolhido].setAttribute('aria-pressed', 'true');

    feedback.hidden = false;
    if (correta) {
      feedback.textContent = bloco.feedback_acerto;
      feedback.className = 'feedback feedback-acerto';
      botaoContinuar.hidden = false;
    } else {
      const nivel = determinarNivelFeedback(tentativasParaNivel);
      feedback.textContent = nivel === 'dica' ? bloco.dica_erro : `${bloco.dica_erro} ${bloco.explicacao_erro}`;
      feedback.className = 'feedback feedback-erro';
      botaoContinuar.hidden = true;
    }
  }

  function responder(indiceEscolhido) {
    const correta = avaliarRespostaCorreta(bloco, indiceEscolhido);
    if (!correta) tentativas += 1;
    exibirFeedback(indiceEscolhido, correta, tentativas);
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
    const correta = avaliarRespostaCorreta(bloco, respostaSalva.indiceEscolhido);
    exibirFeedback(respostaSalva.indiceEscolhido, correta, tentativas);
  }

  return container;
}

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
    });
    opcoesContainer.appendChild(botao);
  });

  container.appendChild(opcoesContainer);
  container.appendChild(botaoContinuar);
  return container;
}

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
iniciarAtividade();
