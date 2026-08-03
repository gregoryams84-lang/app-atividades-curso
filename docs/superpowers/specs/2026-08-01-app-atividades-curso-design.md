# App de Atividades Interativas — Design

Data: 2026-08-01

## Contexto e objetivo

Aplicação web estática (sem backend, sem build step) hospedada no GitHub Pages, linkada a partir da área de membros do curso (Kiwify). O aluno assiste a uma videoaula curta e clica num link que abre uma atividade desta aplicação. As respostas ficam salvas no navegador do aluno; aulas seguintes recuperam respostas de aulas anteriores para dar continuidade.

Público: pequeno empreendedor brasileiro, pouca familiaridade digital, acesso majoritariamente por celular. Prioridade absoluta: simplicidade, texto sem jargão de interface, botões grandes.

Requisito arquitetural central: o conteúdo de cada atividade vive em JSON, nunca em código. Adicionar uma aula nova é criar um JSON e adicionar uma linha num índice.

## Arquitetura

```
app-atividades-curso/
├── index.html              → lista de trilhas e aulas disponíveis
├── atividade.html          → renderiza a atividade indicada na querystring
├── css/
│   ├── estilo.css          → estilo principal (mobile-first)
│   └── impressao.css       → folha de impressão, carregada via <link media="print">
├── js/
│   ├── app.js               → motor de renderização: lê JSON, monta blocos, orquestra fluxo
│   ├── armazenamento.js      → persistência (localStorage) + exportar/importar + leitura cross-aula
│   └── formula.js            → avaliador de fórmulas aritméticas simples, sem eval/Function
├── dados/
│   ├── indice.json           → catálogo de trilhas e aulas
│   ├── modelo-aula.json      → gabarito comentado para novas aulas
│   └── trilha-ia/
│       └── aula-01.json      → conteúdo real da Aula 1
└── README.md                 → como criar uma aula nova, sem jargão técnico
```

URL de uma atividade: `atividade.html?trilha=trilha-ia&aula=aula-01`.

`formula.js` é isolado de `app.js` porque a avaliação de fórmulas do bloco `calculo` precisa ser seguro (nunca `eval`/`Function` sobre texto de um JSON) e é uma responsabilidade que pode ser testada isoladamente.

## Modelo de dados

### `dados/indice.json`

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

Nova aula = novo objeto em `aulas`. Nova trilha = novo objeto em `trilhas`. Nunca é preciso tocar em JavaScript.

### JSON de uma aula

Estrutura geral:

```json
{
  "trilha": "trilha-ia",
  "aula": "aula-01",
  "titulo": "Você já usa IA. O problema é como.",
  "blocos": [ /* lista de blocos, ver abaixo */ ]
}
```

Cada bloco tem `id` (identificador único dentro da aula, usado como chave de armazenamento e como alvo de dependências) e `tipo`.

**`multipla_escolha`**
```json
{
  "id": "b1",
  "tipo": "multipla_escolha",
  "enunciado": "texto da pergunta",
  "opcoes": ["opção a", "opção b", "opção c", "opção d"],
  "correta": 1,
  "feedback_acerto": "texto mostrado ao acertar",
  "feedback_erro": "texto mostrado ao errar, permite tentar de novo"
}
```

**`lista_aberta`**
```json
{
  "id": "b3",
  "tipo": "lista_aberta",
  "enunciado": "texto da instrução",
  "ajuda": "texto de apoio opcional",
  "quantidade_campos": 5,
  "exemplos": ["exemplo 1", "exemplo 2", "exemplo 3"]
}
```
`exemplos` pode ter menos itens que `quantidade_campos`; campos sem exemplo correspondente recebem um placeholder genérico ("descreva uma tarefa que você repete").

**`calculo`**
```json
{
  "id": "b4",
  "tipo": "calculo",
  "enunciado": "texto da instrução",
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
}
```
- Campo `tipo: "selecao"` com `opcoes_de_bloco: "<id>"` é o mecanismo genérico de dependência entre blocos: o motor lê ao vivo os valores atualmente preenchidos no bloco referenciado (deve ser um `lista_aberta` já renderizado, mais cedo na mesma aula) e os usa como opções. Não é caso especial da Aula 1 — qualquer bloco `calculo` pode referenciar qualquer `lista_aberta` anterior.
- Campo `tipo: "selecao"` com `opcoes` estático funciona como um `<select>` normal.
- `calculos` é um mapa `nome → fórmula`, avaliado em ordem; uma fórmula pode usar o resultado de uma fórmula anterior no mesmo mapa (`horas` usa `total`). Fórmulas suportam `+ - * / ( )`, números literais e identificadores que sejam `id` de campo do bloco ou `nome` de um cálculo anterior. Sem `eval`/`Function` — parser dedicado em `formula.js`.
- `resultado_texto` usa `{nome}` para interpolar qualquer valor calculado. Recalcula a cada tecla.

**`escolha_simples`**
```json
{
  "id": "b5",
  "tipo": "escolha_simples",
  "enunciado": "texto da pergunta",
  "opcoes": ["opção 1", "opção 2", "opção 3"]
}
```
Qualquer opção é aceita como resposta válida; não há feedback de certo/errado.

## Persistência (`armazenamento.js`)

- Chave por aula: `atividades:<trilha>:<aula>` no `localStorage`.
- Valor: objeto `{ "<blocoId>": <resposta>, ... }`, onde o formato de `<resposta>` depende do tipo do bloco (índice escolhido para múltipla escolha, lista de strings para lista aberta, objeto de valores de campo para cálculo, string/índice para escolha simples).
- Salvamento automático a cada alteração de campo — sem botão salvar.
- Ao reabrir uma atividade, os campos são pré-preenchidos a partir do que estiver salvo.
- Função pública `obterResposta(trilha, aula, blocoId)`: retorna a resposta salva de qualquer combinação trilha/aula/bloco, para uso por aulas futuras (ex.: Aula 2 lê o que o aluno escreveu no bloco `b3` da Aula 1). É a função que o JSON de uma aula futura usa para exibir ou retomar respostas de aulas anteriores.
- `opcoes_de_bloco` (usado dentro de um bloco `calculo`, ver abaixo) é um mecanismo diferente e mais restrito: só lê blocos `lista_aberta` já renderizados **dentro da mesma aula**, ao vivo, enquanto o aluno digita — não usa `obterResposta` nem cruza aulas. Retomar respostas de aulas anteriores é sempre explícito, feito pelo JSON da aula futura chamando `obterResposta`.

### Exportar / Importar

- **Exportar** ("Salvar uma cópia das minhas respostas"): agrega todas as chaves `atividades:*` do `localStorage` num único JSON e baixa como `minhas-respostas.json`.
- **Importar** ("Recuperar minhas respostas de outro celular"): lê um arquivo no mesmo formato, grava as chaves correspondentes no `localStorage` e recarrega a atividade atual.
- Os dois botões aparecem na tela de resultado de toda aula, não só na última do curso.

## Fluxo de renderização (`app.js`)

1. `atividade.html` lê `trilha` e `aula` da querystring, busca `dados/indice.json`, confirma que a combinação existe.
2. Busca o JSON da aula referenciado no índice.
3. Renderiza os blocos em ordem, um de cada vez (uma "tela" por bloco), com barra de progresso (bloco atual / total de blocos).
4. Antes de exibir um bloco, pré-carrega do `localStorage` a resposta já salva e preenche os campos.
5. A cada alteração de campo: salva automaticamente, recalcula se for bloco `calculo`, e re-renderiza as opções de qualquer bloco `calculo` (já renderizado ou atual) cujo `opcoes_de_bloco` aponte para o bloco alterado.
6. Após o último bloco, exibe a tela de resultado: resumo construído a partir dos dados salvos daquela aula (para a Aula 1: lista do bloco `b3` + resultado do bloco `b4`), botão de imprimir/PDF (usa `impressao.css` via `window.print()`), e os botões de exportar/importar.

### Tratamento de erro

Por ser 100% estático, os únicos erros possíveis são: (a) `trilha`/`aula` ausente ou não encontrada no índice, (b) falha ao buscar o JSON da aula. Ambos exibem uma tela única, sem jargão: "Não encontramos esta atividade. Volte para a área de membros e clique no link novamente."

## Design visual

- Cor de destaque: azul-petróleo escuro `#1B4B5A` sobre fundo branco.
- Texto: quase-preto `#1A1A1A` sobre branco.
- Acerto: verde escuro discreto. Tentar de novo: terracota escuro (nunca vermelho vivo).
- Fonte do sistema (`system-ui`), corpo 16px+, títulos de bloco 20-22px, botões 18px, alvo de toque mínimo 44px.
- Um único componente de botão grande reutilizado em toda a aplicação.
- Sem emoji em nenhum texto de interface ou feedback.
- Rótulos (`<label for>`) associados a todo campo; navegação por teclado funcional; contraste mínimo WCAG AA.

## Teste (sem framework, verificação manual)

Como é uma aplicação estática sem build, a verificação é manual, em navegador:
- Abrir `index.html` direto do disco (`file://`) e também via um servidor estático local — ambos devem funcionar.
- Redimensionar para 360px de largura e confirmar ausência de rolagem horizontal em toda tela (lista de aulas, cada tipo de bloco, tela de resultado).
- Preencher uma atividade, fechar a aba, reabrir — confirmar que os campos vêm pré-preenchidos.
- Testar o bloco `calculo` da Aula 1: digitar no bloco `b3`, confirmar que o `<select>` do bloco `b4` atualiza ao vivo; digitar números no `b4` e confirmar que o resultado recalcula a cada tecla.
- Exportar respostas, limpar `localStorage` do navegador, importar o arquivo exportado, confirmar que tudo volta.
- Testar navegação só por teclado (Tab, Enter, Espaço) em todos os tipos de bloco.
- Testar impressão (pré-visualização) da tela de resultado.

## Fora de escopo (YAGNI)

- Qualquer sincronização entre dispositivos que não seja o exportar/importar manual.
- Qualquer tipo de bloco além dos quatro especificados.
- Autenticação, contas de usuário, ou qualquer coisa que exija backend.
- Suporte a navegadores muito antigos (sem `fetch`, sem `localStorage`) — fora do público-alvo real (celulares modernos).
