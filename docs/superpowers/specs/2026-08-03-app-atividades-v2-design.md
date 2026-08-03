# App de Atividades Interativas — Design v2

Data: 2026-08-03

## Contexto e objetivo

Segunda versão do design deste aplicativo. A primeira versão (spec de 2026-08-01, já implementada até a Tarefa 10 de 14) usava uma arquitetura de página única contínua, com os blocos revelados progressivamente e nunca removidos da tela. Esta versão substitui essa arquitetura por um modelo de navegação passo a passo (uma tela cheia por bloco), reproduzindo mecânicas específicas de plataformas educacionais de referência (Brilliant, Khan Academy, Codecademy, Duolingo — detalhado abaixo), e acrescenta uma tela de diagnóstico, versionamento de esquema, e tratamento explícito de estados de erro/carregamento.

Aplicação web estática (sem backend, sem build step), hospedada no GitHub Pages, linkada a partir da área de membros do curso. Público: pequeno empreendedor brasileiro, pouca familiaridade digital, acesso majoritariamente por celular, à noite, cansado. Prioridade absoluta: simplicidade, texto sem jargão de interface, botões grandes.

Requisito arquitetural central (mantido do v1): o conteúdo de cada atividade vive em JSON, nunca em código. Nenhuma função do motor pode conhecer o conteúdo de uma aula específica — uma verificação do tipo "se for a aula 1" no código é sinal de arquitetura errada.

## Mecânicas de referência (requisito de implementação, não inspiração)

- **Brilliant** — problema antes da explicação: primeiro passo é sempre uma situação concreta, nunca recapitulação do vídeo. Dica curta (com referência de tempo do vídeo) na primeira resposta errada; explicação completa só a partir da segunda tentativa errada. Tentativas ilimitadas, sem contador visível. Feedback aparece na própria tela do bloco, sem modal.
- **Khan Academy** — painel da trilha na tela inicial com estado por aula (não iniciada / em andamento / concluída), derivado das respostas salvas. Botão de retomada nomeado com a próxima aula pendente. Cada aula declara, em uma frase, a habilidade que o aluno passa a ter.
- **Codecademy** — o que o aluno escreve permanece visível e acessível nos passos seguintes da mesma aula (painel lateral no desktop, seção recolhível no celular). Quando um bloco usa resposta de aula anterior, isso é indicado explicitamente ("baseado no que você respondeu na Aula X").
- **Duolingo** — copiar: sessão curta, progresso visível, retomada exata do ponto onde parou, salvamento automático. Não copiar: sequência de dias, troféus, pontos, mascote, confete, som, comemoração, contagem regressiva.
- **Diferencial próprio, não coberto por nenhuma das quatro:** toda atividade termina com um artefato do negócio do aluno (lista, número, decisão escrita), reunido numa tela de diagnóstico e reaproveitado nas aulas seguintes. Nunca exibir nota, pontuação, percentual de acerto ou mensagem de reprovação, em nenhuma tela.

## Arquitetura de arquivos

```
/index.html            → painel da trilha: estado de cada aula, botão de retomada, link para o diagnóstico
/atividade.html        → renderiza um bloco por vez, navegação por hash (#bloco-N)
/diagnostico.html      → reúne tudo que o aluno construiu na trilha inteira
/css/estilo.css
/css/impressao.css
/js/app.js             → carregamento, validação de schema, roteamento por hash, renderização por tipo
/js/armazenamento.js   → único módulo que toca localStorage; API assíncrona; debounce; trata quota/privado
/js/dependencias.js    → resolve dependências entre blocos, com os três casos de borda
/js/blocos.js          → funções puras por tipo de bloco
/js/formula.js         → avaliador aritmético seguro (herdado do v1 sem mudança de lógica)
/dados/indice.json
/dados/modelo-aula.json
/dados/trilha-ia/aula-01.json
/TESTES-MANUAIS.md     → casos de verificação manual
```

URL de uma atividade: `atividade.html?trilha=trilha-ia&aula=aula-01#bloco-1`.

`dependencias.js` é separado de `app.js` porque resolver dependência (incluindo os três casos de borda) é uma responsabilidade isolada e testável sozinha com Node, no mesmo espírito de `formula.js` e `blocos.js`.

## Reaproveitamento do v1

- `js/formula.js`: reaproveitado quase sem mudança — o avaliador seguro (sem `eval`/`Function`) já implementado atende ao requisito do v2. Único ajuste: ao invés de dividir por zero silenciosamente virar `0`, o valor calculado passa a carregar um sinalizador de "indisponível" que a camada de renderização usa para mostrar texto de resultado indisponível em vez de um número.
- `dados/trilha-ia/aula-01.json`: o conteúdo pedagógico (perguntas, alternativas, textos de feedback) é o mesmo da Aula 1 já escrita no v1; o JSON é reestruturado para o novo schema (`schema_version`, `tipo: "cenario"` em vez de `multipla_escolha`, `dica_erro`/`explicacao_erro` separados, `depende_de` em vez de `opcoes_de_bloco`).
- `css/estilo.css`: paleta, botões e campos são reaproveitados; a navegação de página única contínua é substituída por layout de tela-por-bloco mais o painel do artefato. **Correção em relação à v1:** a v1 usava fonte do sistema (nenhuma dependência externa). A v2 permite explicitamente uma exceção — uma única fonte do Google Fonts — e usa essa exceção: tipografia passa a ser **Inter** (boa legibilidade em telas pequenas, suporte completo a acentuação em português), carregada via `<link>` no `<head>` das três páginas, com `system-ui` como alternativa caso a fonte não carregue.
- `js/armazenamento.js` e `js/app.js`: reescritos — mudança de modelo de navegação, de chave de armazenamento, e de API (assíncrona, com debounce e tratamento de quota).

## Modelo de dados

### `dados/indice.json`

```json
{
  "trilhas": [
    {
      "id": "trilha-ia",
      "titulo": "IA no Negócio",
      "aulas": [
        { "id": "aula-01", "titulo": "Você já usa IA. O problema é como.", "ordem": 1, "arquivo": "dados/trilha-ia/aula-01.json" }
      ]
    }
  ]
}
```

### JSON de uma aula

```json
{
  "schema_version": 1,
  "trilha": "trilha-ia",
  "aula": "aula-01",
  "titulo": "Você já usa IA. O problema é como.",
  "habilidade": "Reconhecer, pelas três perguntas, se uma tarefa do seu negócio vale a pena automatizar.",
  "blocos": [ /* ver tipos abaixo */ ]
}
```

`schema_version` é obrigatório. Se o motor encontrar uma versão que não reconhece, recusa a aula inteira: tela amigável ("Esta atividade precisa de uma versão mais nova do aplicativo") + erro de console apontando o arquivo. Nunca renderiza parcialmente.

`habilidade`: uma frase, exibida no topo da atividade e no painel da trilha.

Cada bloco declara um `id` estável — nunca reordenável ou renomeado depois de publicado, pois as respostas salvas são indexadas por ele — e um `tipo`.

### Tipos de bloco

**`cenario`** (equivalente ao `multipla_escolha` do v1, renomeado e com dica em duas etapas + contagem de tentativas):
```json
{
  "id": "b1",
  "tipo": "cenario",
  "enunciado": "texto da situação",
  "opcoes": ["opção a", "opção b", "opção c", "opção d"],
  "correta": 1,
  "dica_erro": "Reveja o trecho dos 3:30 do vídeo.",
  "explicacao_erro": "As três perguntas são: repete, custa tempo, a resposta segue padrão.",
  "feedback_acerto": "texto mostrado ao acertar"
}
```
Primeira resposta errada: mostra só `dica_erro`. A partir da segunda resposta errada (nesta ou em visitas futuras a esta tela): mostra `dica_erro` + `explicacao_erro`. Tentativas ilimitadas, sem penalidade, sem contador visível — mas o número de tentativas é salvo junto da resposta (não exibido ao aluno), para análise futura.

**`lista_aberta`**
```json
{
  "id": "b3",
  "tipo": "lista_aberta",
  "enunciado": "texto da instrução",
  "ajuda": "texto de apoio opcional",
  "quantidade_campos": 5,
  "minimo_preenchido": 1,
  "placeholders": ["exemplo 1", "exemplo 2", "exemplo 3"]
}
```
Campos vazios são permitidos; para avançar, basta que ao menos `minimo_preenchido` campos tenham conteúdo.

**`calculo`**
```json
{
  "id": "b4",
  "tipo": "calculo",
  "enunciado": "texto da instrução",
  "campos": [
    { "id": "tarefa", "tipo": "selecao", "rotulo": "Qual das cinco?", "depende_de": { "trilha": "trilha-ia", "aula": "aula-01", "bloco": "b3" } },
    { "id": "vezes_semana", "tipo": "numero", "rotulo": "Quantas vezes por semana", "unidade": "vezes", "minimo": 0, "maximo": 999 },
    { "id": "minutos_vez", "tipo": "numero", "rotulo": "Quanto tempo leva cada vez", "unidade": "minutos", "minimo": 0, "maximo": 999 },
    { "id": "resposta_padrao", "tipo": "selecao", "rotulo": "A resposta certa é quase sempre a mesma?", "opcoes": ["Sim", "Não", "Às vezes"] }
  ],
  "calculos": { "total": "vezes_semana * minutos_vez", "horas": "total * 4.345 / 60" },
  "resultado_texto": "Você gasta cerca de {total} minutos por semana, o que dá {horas} horas por mês."
}
```
Recalcula a cada alteração, com debounce curto de exibição (não precisa ser instantâneo tecla a tecla). Divisão por zero, campo vazio ou valor não numérico fazem o resultado ser mostrado como indisponível (texto simples, nunca `NaN`/`Infinity`/um número inventado).

**`escolha_simples`**
```json
{ "id": "b5", "tipo": "escolha_simples", "enunciado": "texto da pergunta", "opcoes": ["opção 1", "opção 2", "opção 3"] }
```
Qualquer resposta é aceita e libera a continuidade.

Adicionar um quinto tipo no futuro exige apenas uma nova função registrada no mapa `tipo → função` de `app.js` — nenhum outro código muda.

## Dependências entre blocos

Declaradas no campo do bloco que depende, com referência explícita a trilha, aula e id do bloco-fonte:
```json
{ "id": "tarefa", "tipo": "selecao", "rotulo": "...", "depende_de": { "trilha": "trilha-ia", "aula": "aula-01", "bloco": "b3" } }
```

`js/dependencias.js` expõe `async function resolverDependencia(depende_de)`, chamada toda vez que a tela do bloco dependente é (re)montada — nunca "ao vivo" enquanto o aluno digita em outro bloco, já que agora cada bloco é sua própria tela. Isso significa: se o aluno volta e edita o bloco 3 depois de já ter respondido o bloco 4, ao reabrir a tela do bloco 4 ele relê a resposta atual do bloco 3 e recalcula/atualiza a seleção automaticamente — decisão confirmada com o usuário.

Três casos de borda, cada um retornando um resultado estruturado que a camada de renderização usa para decidir a UI, e cada um com um fallback idêntico (campo de texto livre comum, funcional, nunca tela quebrada) e um aviso de console distinto:

1. **Aula ainda não respondida** — a aula referenciada existe no índice, mas não há nada salvo dela. UI: nota curta acima do campo ("Você ainda não respondeu isso — pode escrever aqui mesmo").
2. **Bloco que sumiu** — a aula referenciada tem respostas salvas, mas o `bloco` específico não existe mais no JSON atual dela (o conteúdo foi editado depois). Aviso de console aponta que o bloco referenciado não existe mais nesta versão da aula.
3. **Dependência circular** — A depende de B que depende (direta ou indiretamente) de A. Detectado percorrendo a cadeia de dependências com um conjunto de ids já visitados; ao detectar repetição, interrompe e usa o fallback. Aviso de console aponta o ciclo encontrado.

## Camada de persistência (`armazenamento.js`)

Único módulo que toca `localStorage`; nenhum outro arquivo acessa `localStorage` diretamente. Interface pública, toda `async` (mesmo com implementação síncrona por baixo hoje, para não exigir refatoração numa futura troca por backend):

```js
async function salvarRespostasDaAula(trilha, aula, respostas)
async function obterRespostasDaAula(trilha, aula)
async function obterValorDeBloco(trilha, aula, blocoId)   // usado por dependencias.js
async function listarAulasConcluidas(trilha)
async function exportarTudo()
async function importarTudo(dados)   // ver fluxo de confirmação abaixo
```

- **Chave por aula:** `toca:v1:{trilha}:{aula}`. Índice separado `toca:v1:indice` (lista de trilha+aula com resposta), mantido junto de cada gravação — alimenta o painel de estados da tela inicial sem varrer todo o `localStorage`. Chaves nunca reaproveitadas entre versões de esquema (uma futura v2 de chave usaria `toca:v2:...`).
- **Debounce de ~500ms:** o motor chama `salvarRespostasDaAula` a cada alteração de campo, mas o módulo só grava de fato 500ms após a última chamada.
- **Armazenamento indisponível** (cheio, ou bloqueado em navegação anônima): a primeira gravação que falhar (captura `QuotaExceededError` ou erro de acesso) dispara um aviso simples e visível ("Não estamos conseguindo salvar suas respostas agora — você ainda pode continuar, mas anote suas respostas por garantia"); a atividade continua utilizável na sessão, só sem persistir.
- **Importar exige confirmação:** `importarTudo` primeiro valida o arquivo e retorna um resumo do que seria substituído; a UI mostra esse resumo e só chama a gravação de fato depois de confirmação explícita do aluno — nunca sobrescreve direto.

## Navegação e renderização da atividade

- Passo atual refletido no hash da URL: `#bloco-N`. Ao montar, o motor lê o hash; se ausente ou fora do intervalo de blocos da aula, normaliza para `#bloco-1`. Um listener de `hashchange` troca qual bloco está montado — isso dá voltar/avançar do navegador de graça e faz recarregar no meio preservar o passo atual.
- Uma tela por vez: ao trocar de bloco, o bloco anterior é desmontado do DOM (não apenas escondido).
- **Painel do artefato:** contêiner fixo (barra lateral no desktop; seção recolhível, fechada por padrão, com botão "ver o que você já escreveu" no celular) mostra as respostas de tipo `lista_aberta` e `calculo` já dadas nesta aula até o passo atual, em texto simples. Atualiza ao trocar de bloco. Quando um campo usa `depende_de` apontando para outra aula, mostra acima do campo: "Baseado no que você respondeu na Aula {título da aula}."
- **Foco:** ao trocar de bloco, o foco vai para o título/enunciado do novo bloco (não para o primeiro campo), para leitores de tela não pularem o contexto.
- **Atividade já respondida antes:** ao montar, se a aula já está concluída, os blocos aparecem preenchidos normalmente e o aluno navega livremente por eles — sem tela especial de conclusão (mantém "nunca comemoração").
- Nenhuma tela mostra nota, pontuação, percentual ou mensagem de reprovação.

## Tela inicial e diagnóstico

- `index.html`: painel por trilha, uma linha por aula, três estados (não iniciada / em andamento / concluída), sempre derivados de `armazenamento.listarAulasConcluidas`/`obterRespostasDaAula` — nunca marcado manualmente. Botão principal nomeado com a próxima aula pendente (ex.: "Continuar: Você já usa IA. O problema é como.").
- `diagnostico.html`: reúne, de todas as aulas já respondidas na trilha, as listas, números e decisões escritas pelo aluno, com a data de cada registro. Botão "Salvar em PDF" via impressão do navegador, com `css/impressao.css` limpo.

## Estados de interface

Nenhum estado não tratado pode resultar em tela branca:

- Carregando (buscando índice ou JSON da aula).
- Conteúdo inexistente (combinação trilha/aula fora do índice).
- Falha ao carregar (rede/arquivo ausente), com botão "Tentar de novo".
- `schema_version` não reconhecida (mensagem distinta da falha de rede).
- Armazenamento indisponível (aviso não bloqueante, atividade continua funcionando).
- Atividade já respondida antes (blocos preenchidos, navegação livre).
- Dependência não atendida (fallback de texto livre, ver seção de dependências).

## Desempenho e compatibilidade

Cada aula é buscada sob demanda (nunca a trilha inteira), o que naturalmente atende ao orçamento de carregar pouco. Alvo: Chrome e Safari em Android/iOS dos últimos três anos, sem recursos que exijam navegador recente sem alternativa. Atenção especial ao teclado virtual em campos numéricos no iOS (testar que não quebra o layout ao abrir).

## Acessibilidade

Rótulo associado a todo campo. Feedback de acerto/erro anunciado por região `aria-live`. Foco gerenciado ao trocar de bloco (ver acima). Navegação completa por teclado. Área de toque mínima de 44px. Contraste WCAG AA. Respeita `prefers-reduced-motion` (nenhuma transição além de mudanças curtas de estado, e mesmo essas desativadas quando o sistema pedir).

## Testes

Módulos puros ou com backend injetável (`js/formula.js`, `js/blocos.js`, `js/armazenamento.js`, `js/dependencias.js`) testados com `node --test` (glob explícito `js/*.test.js` — `node --test js/` com diretório falha neste ambiente Windows/Node, já documentado). Sem dependências externas de teste.

Arquivo `TESTES-MANUAIS.md` com casos concretos de verificação manual no navegador, cobrindo no mínimo: JSON inválido, bloco com id desconhecido, dependência de aula não respondida, campo numérico com texto, campo numérico com zero, armazenamento cheio (simulado via devtools), importação de arquivo inválido, recarregar no meio do preenchimento, e os já cobertos no v1 (360px sem rolagem horizontal, navegação só por teclado, contraste).

## Fora de escopo (YAGNI)

- Qualquer sincronização entre dispositivos além do exportar/importar manual.
- Qualquer tipo de bloco além dos quatro especificados.
- Autenticação, contas de usuário, backend real.
- Suporte a navegadores muito antigos sem `fetch`/`localStorage`.
- Abrir `atividade.html` direto do disco (`file://`): `fetch` é bloqueado pelo navegador para arquivos locais — trade-off aceito na v1 e mantido aqui, já que o aluno sempre chega pelo link publicado no GitHub Pages. Testar localmente exige servir a pasta com um servidor estático simples que preserve querystring/hash (`python3 -m http.server`; `npx serve` foi descartado por redirecionar e descartar a querystring).
