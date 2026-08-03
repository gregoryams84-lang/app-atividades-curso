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
