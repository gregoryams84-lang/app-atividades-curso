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
