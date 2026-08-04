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
