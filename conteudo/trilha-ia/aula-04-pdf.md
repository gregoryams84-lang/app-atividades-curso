# Material de apoio — Aula 4: Monte seu agente de atendimento no WhatsApp

## O problema que essa aula resolve

Mensagem de cliente chega o dia inteiro — de manhã, à noite, no fim de
semana — e alguém precisa responder. Igual ao "funcionário de secretaria"
que Gregory citou na Aula 1 (numa outra frente de trabalho dele, fora do
Toca o Negócio): a maior parte das perguntas repetidas é sempre a mesma.
Essa aula ensina a criar um agente de IA que assume esse atendimento
repetitivo — tira dúvida, faz pedido, cadastra — sozinho, 24 horas por
dia, via WhatsApp, Instagram ou site.

## O que é o Chatvolt

Uma plataforma no-code que cria um agente de IA pra atender seus clientes
por você. Pensa nele como um funcionário virtual, treinado com as
informações da sua empresa: catálogo, dúvidas frequentes e regras de
atendimento. O caminho básico:

1. Cria a conta.
2. Escolhe o canal (WhatsApp, site ou Instagram).
3. O agente aprende com os dados do negócio (documentos, planilhas, site).
4. Você ajusta o tom das respostas e ativa.

## Passo a passo: conhecendo a plataforma

1. Pesquisa "Chatvolt" e cria a conta com **"continuar com o Google"**.
2. Assim que termina o cadastro, o Chatvolt já pede pra criar um agente —
   **feche essa janela (X)** e vá pra página principal primeiro.
3. Conheça as seções antes de criar qualquer coisa:

| Seção | Pra que serve |
|---|---|
| **Caixa de entrada** | Toda conversa (WhatsApp, Instagram, novos leads) acontece aqui — não mais direto no WhatsApp Business |
| **Novos agentes** | Onde os agentes são criados |
| **Base de conhecimento** | Todo o conteúdo da empresa, pra o agente ficar bem informado |
| **Artefatos** | Catálogo com os preços dos produtos — compensa quando o negócio tem muitas opções diferentes |
| **Volt API** | Não usada nesta aula |
| **Gestão de clientes** | Contatos dos clientes; fluxo de CRM fica no plano Pro |
| **Disparos de WhatsApp** | Mensagem em massa sem cair no bloqueio de robô — exige linha vinculada ao Chatvolt e template aprovado pela Meta |

## Qual plano escolher

Pra vincular o **WhatsApp oficial** — o objetivo desta aula — é preciso
pelo menos o **plano básico** (o gratuito não vincula). É o plano que o
próprio Gregory usa:

- **R$ 237/mês**
- 2 agentes
- 7.500 perguntas respondidas por mês
- 4 bases de conhecimento
- 200 artefatos (200 preços diferentes)
- WhatsApp oficial conectado

## Criando o agente

1. Escolha **"Personalizado"**. Preencha o setor (ex: "Vendas"), a
   categoria do negócio (ex: "Varejo") e o que o agente vai fazer (ex:
   "Atendimento Geral").
2. **Chave de ouro da aula:** deixe o Claude aberto numa janela ao lado o
   tempo todo. Use ele pra:
   - Sugerir nome pro agente (peça um nome "pessoal", não genérico).
   - Preencher palavras-chave e público-alvo — pode colar o print da tela
     do formulário do Chatvolt direto no Claude e pedir pra preencher.
   - Escrever ou melhorar o prompt de comportamento do agente.
3. **Foto do agente:** gere um avatar realista no **Google Flow**
   (gratuito), com um prompt em inglês (peça pro Claude escrever — fica
   mais fácil pro Google entender), baixe e suba no Chatvolt.

## Base de conhecimento: o coração do agente

Peça pro Claude escrever um arquivo **.txt** com todas as informações do
seu negócio. Peça pra ele fazer perguntas até ter o suficiente, e só
então gerar o texto. Baixe esse arquivo — é a base de conhecimento do seu
agente.

**Cuidado real do dono:** só coloque na base de conhecimento a informação
que você realmente tem certeza (preço, prazo, condição). Não invente
dado nenhum só pra preencher.

## Implantar e configurar

- **Implantar:** vincule o agente a Telegram, WhatsApp, Instagram,
  Website, YouTube ou Mercado Livre, conforme fizer sentido pro seu
  negócio.
- **Configurações → Prompt:** escolha o nível de resposta — **light,
  médio ou regular** (regular já resolve bem casos simples, sem exigir
  raciocínio complicado). O modelo de IA por trás também pode ser o
  Claude.
- **Base de conhecimento:** mantenha ativa. **Idioma:** deixe a geração
  automática ligada. **Imagem:** não ignore — deixe a IA ler print que o
  cliente mandar. **Quebra de mensagem:** ative "evitar", pra a resposta
  sair inteira.
- **Tempo de resposta:** configure uns **20 a 25 segundos** de atraso de
  propósito — responder em 5 segundos parece robô.
- **Mensagem de follow-up:** um retorno automático se o cliente não
  respondeu (algo entre 1 hora, pra negócio com decisão rápida, até 24
  horas, dependendo do seu tipo de negócio).
- **Artefatos:** só configure se o seu negócio tiver muitos preços
  diferentes pra listar.

## Testar antes de confiar

1. Use a aba **"chat"** dentro do próprio agente pra testar. Se ele
   errar ou não souber algo, a correção não é no agente — é na **base de
   conhecimento**: peça pro Claude reescrever o .txt incluindo a
   informação que faltou, baixe o arquivo novo e suba de novo em
   **Implantar → Configurações → Base de conhecimentos → Adicionar fonte
   de dados**. Espere processar até aparecer "resolvido".
2. Depois, teste fora da configuração: em **"Agentes → Conversa com o
   agente"**, crie um chat novo e repita a pergunta.
3. **Recomendação:** crie vários chats de teste com perguntas reais dos
   seus próprios clientes (não só uma ou duas) e vá ajustando a base de
   conhecimento toda vez que a resposta não sair do jeito que você
   responderia. É trabalhoso, mas é o que deixa o agente confiável.

## Quando o agente pede ajuda humana

No painel de conversas (o mesmo lugar onde chegam as mensagens de
WhatsApp e Instagram), se o agente pedir ajuda humana — numa reclamação,
por exemplo — clique em **"intervir"** e responda pessoalmente. Depois de
resolver, clique em **"habilitar IA"** pra devolver a conversa pro agente
continuar sozinho. O mesmo princípio da Aula 2: crise nunca fica só com a
IA — mas, resolvida, o agente volta a cuidar do resto.

## Checklist final

- [ ] Conta criada no Chatvolt (plano básico, se for vincular WhatsApp)
- [ ] Agente criado em "Personalizado", com nome e função definidos
- [ ] Base de conhecimento em .txt gerada com o Claude e enviada
- [ ] Tempo de resposta (uns 20-25s) e mensagem de follow-up configurados
- [ ] Testado na aba "chat" com perguntas reais de cliente, e ajustado
      onde errou

---
Toca o Negócio · Trilha IA no Negócio · Aula 4
