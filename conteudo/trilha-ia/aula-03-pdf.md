# Material de apoio — Aula 3: MCPs e Skills, o Claude com superpoderes

## Antes de qualquer ferramenta: dê contexto

Antes de pedir qualquer coisa pro Claude, antecipe quem você é. Não
chegue perguntando direto — conte primeiro o essencial do seu negócio:
o que você vende, quantos funcionários tem, onde fica, os números que
importam. Só depois faça o pedido.

**Exemplo real da aula:** "Sou dono de uma pizzaria, tenho dois
funcionários, fico no bairro X de São Paulo, entrego uma média de 30
pizzas no fim de semana e 10 durante a semana. Elabore uma estratégia
de marketing pro Instagram e Facebook." Sem esse contexto antes, a
resposta sai genérica — com ele, o Claude usa cada detalhe que você deu.

## O ecossistema Claude, peça por peça

| Peça | Pra que serve |
|---|---|
| **Claude** (chat) | Você pergunta, ele responde ali na conversa |
| **Claude Code** | Abre arquivo, escreve código, roda teste — "sentado do seu lado" |
| **Claude Cowork** | Pega a tarefa, roda sozinho em segundo plano, entrega pronta |
| **Skills** | Atalho programado uma vez — automação local |
| **MCP** | Protocolo que conecta a sistemas de fora — conexão externa |
| **Haiku** | Motor rápido e barato |
| **Sonnet** | Motor de equilíbrio, o do dia a dia |
| **Opus** | Motor de raciocínio pesado |
| **Fable** | Motor pra agente autônomo, decisão longa e sozinha |

## MCP x Skill: a diferença que importa

- **MCP é uma porta nova.** Dá ao Claude acesso a algo que ele não
  consegue sozinho — buscar na internet, gerar imagem. Sem instalar,
  esse poder não existe.
- **Skill é um manual de procedimento.** Não dá ferramenta nova, dá um
  roteiro que o Claude segue quando a tarefa combina com aquele
  assunto — por exemplo, como estruturar um post pra Instagram (gancho
  → desenvolvimento → chamada final).

MCP abre uma porta nova na casa. Skill ensina o melhor jeito de andar
pela casa que já existe.

## Os três kits de ferramentas

### Kit A — MCPs de pesquisa e automação

| Ferramenta | Resolve |
|---|---|
| **Context7** | Documentação técnica atualizada — busca a versão mais recente de uma biblioteca direto na fonte |
| **Jina AI** | Busca e leitura real da web — pesquisa, lê página, artigo acadêmico, screenshot de site |
| **Chrome DevTools** | Controla um Chrome de verdade — navega, clica, preenche formulário, audita performance |
| **Supabase** | Banco de dados e back-end completo — Postgres, autenticação, armazenamento |

*Um MCP pode ser global (qualquer conversa) ou só de um projeto. Se ele não aparecer numa pasta diferente, não é bug — é escopo.*

### Kit B — MCPs de mídia gerada

| Ferramenta | Resolve |
|---|---|
| **Kairogen** | Catálogo grande de imagem, vídeo e voz (Seedream, Flux, Nanobanana, GPT Image, Sora, Veo, Kling, clonagem de voz, upscaling) — use quando não souber qual modelo escolher |
| **Nanobanana** | Geração e edição de imagem via Gemini — direto, quando você já sabe o que quer |
| **Magnific** | Upscaling e acabamento fino de imagem/vídeo — usado depois que o Kairogen ou o Nanobanana já geraram algo; único MCP remoto do kit (só URL e login, sem instalar pacote) |

### Kit C — Skills, CLI e referência

| Ferramenta | Resolve |
|---|---|
| **Superpowers** | Metodologia de trabalho — brainstorming estruturado, TDD, debugging sistemático, escrita de planos |
| **Find Skills** | Descoberta de skills prontas da comunidade, em vez de escrever uma do zero |
| **Hyperframes** | Produção de vídeo de verdade a partir de HTML, CSS e animação |
| **Claude Cookbook** | Pasta de exemplos oficiais de código — pra quando a tarefa é programar contra a API do Claude, fora do Claude Code |

## Checklist de cadastro

Crie as contas abaixo (a maioria é login direto com Google ou GitHub):

- [ ] Kairogen — acesso via Google
- [ ] Jina — login no topo da página, via Google
- [ ] Google AI Studio (NanoBanana) — acessar, criar uma **API Key**, guardar num documento à parte
- [ ] Node.js — baixar em nodejs.org, instalar a versão Windows
- [ ] Magnific — registro via Google
- [ ] Find Skills MCP — acessar, ir em Documentos → API, criar a chave e guardar junto com a do NanoBanana
- [ ] Supabase — inscrição via GitHub, criar organização, criar senha, criar projeto
- [ ] HeyGen — acesso via Google, plano free

**Guarde as chaves do NanoBanana e do Find Skills num documento à parte** — elas serão coladas no VS Code no próximo passo.

## Instalando tudo no VS Code

1. `Ctrl+Shift+P` para abrir a busca de comandos.
2. Digite "MCP" e escolha **Open User Configuration**.
3. Apague o conteúdo existente e cole o `mcp.json` disponibilizado na aula (esse arquivo fica na plataforma, junto do vídeo).
4. Clique em **Start** em cada MCP e Skill da lista.
5. Nos dois que pedem chave (NanoBanana e Find Skills), apague o texto de exemplo e cole a sua chave antes de dar Start.
6. **`Ctrl+S` para salvar** — sem isso a configuração não fica gravada.

Se algum MCP não ativar pelo `mcp.json`: `Ctrl+Shift+P` → **Browse MCP Server** → busca pelo nome (ex: Chrome, Supabase) e instala por ali. Funciona igual, só que ferramenta por ferramenta.

## Mão na massa: o que muda na prática

A aula fecha com uma demonstração real de criação de site, do zero,
dentro do VS Code. Alguns pontos valem pra qualquer projeto que você for
tocar depois:

- **Modo automático.** Deixe o Claude Code no modo "auto" (não manual)
  — assim ele resolve sozinho o que puder e só te chama quando a
  decisão é realmente sua.
- **Esforço proporcional à tarefa.** Uma coisa estrutural, que você
  cria uma vez e não fica alterando toda hora (como um site inteiro),
  vale deixar o Claude trabalhar "mais forte". Um pedido simples do dia
  a dia não precisa desse nível.
- **Nunca invente uma história falsa pro seu negócio.** Se o Claude
  pedir um "quem somos" e você não tem uma história real, não invente
  uma — uma história falsa, quando descoberta, pode derrubar a
  confiança no negócio inteiro.
- **Uma conversa por projeto.** Site, Instagram, Facebook, agente de
  WhatsApp — cada um na sua própria conversa, pra não misturar
  informação. Pra continuar um projeto depois, volta na conversa dele.
- **Iteração é normal.** Não gostou de um detalhe do resultado? Aponta
  exatamente o que quer mudar (pode até colar um print) e pede o
  ajuste — o projeto vai sendo lapidado, não precisa sair perfeito de
  primeira.

## Agora é sua vez

Com o ambiente pronto, não crie por criar — comece pelo que o seu
negócio precisa agora: site, aplicativo, imagem pro Instagram,
conteúdo. Direto ao ponto.

---
Toca o Negócio · Trilha IA no Negócio · Aula 3
