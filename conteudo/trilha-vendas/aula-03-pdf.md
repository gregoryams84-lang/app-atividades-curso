# Material de apoio — Aula 3: Crie seu agente e conecte ao WhatsApp

## O problema que essa aula resolve

Com a Página do Facebook criada (Aula 1) e o Portfólio de Negócios montado
(Aula 2), falta a parte que coloca tudo pra funcionar de verdade: criar o
agente de IA no Chatvolt, conectar ele ao WhatsApp oficial, e criar o
primeiro template de mensagem pra aprovação da Meta.

## Criando o agente

1. Escolha **"Personalizado"**. Preencha o setor (ex: "Vendas"), a
   categoria do negócio (ex: "Varejo") e o que o agente vai fazer (ex:
   "Atendimento Geral").
2. **Chave de ouro:** deixe o Claude aberto numa janela ao lado o tempo
   todo. Use ele pra:
   - Sugerir nome pro agente (peça um nome "pessoal", não genérico).
   - Preencher palavras-chave e público-alvo — pode colar o print da tela
     do Chatvolt direto no Claude e pedir pra preencher.
   - Escrever ou melhorar o prompt de comportamento do agente.
3. **Foto do agente:** gere um avatar realista no **Google Flow**
   (gratuito), com um prompt em inglês (peça pro Claude escrever — fica
   mais fácil pro Google entender), baixe e suba no Chatvolt.

## Base de conhecimento

Peça pro Claude escrever um arquivo **.txt** com todas as informações do
seu negócio. Ele faz perguntas até ter o suficiente, e só então gera o
texto. Baixe esse arquivo — é a base de conhecimento do seu agente.

## Implantar e configurar

- **Implantar:** vincule o agente a Telegram, WhatsApp, Instagram, Website,
  YouTube ou Mercado Livre, conforme fizer sentido pro seu negócio.
- **Prompt:** escolha o nível de resposta — light, médio ou regular
  (regular já resolve bem casos simples). O modelo de IA por trás também
  pode ser o Claude.
- **Base de conhecimento, idioma e imagem:** mantenha a base ativa, deixe a
  geração automática de idioma ligada, e não ignore imagem — deixe a IA ler
  print que o cliente mandar.
- **Tempo de resposta:** configure uns 20 a 25 segundos de atraso de
  propósito — responder em 5 segundos parece robô.
- **Mensagem de follow-up:** um retorno automático se o cliente não
  respondeu (de ~1 hora, pra negócio de decisão rápida, até 24 horas —
  depende do seu tipo de negócio).
- **Artefatos:** só configure se o seu negócio tiver muitos preços
  diferentes pra listar.

## Teste antes de confiar

1. Use a aba **"chat"** dentro do próprio agente pra testar. Se ele errar
   ou não souber algo, a correção não é no agente — é na **base de
   conhecimento**: peça pro Claude reescrever o .txt incluindo a
   informação que faltou, baixe o arquivo novo e suba de novo em
   **Implantar → Configurações → Base de conhecimentos → Adicionar fonte
   de dados**. Espere processar até aparecer "resolvido".
2. Depois, teste fora da configuração: em **"Agentes → Conversa com o
   agente"**, crie um chat novo e repita a pergunta.
3. **Recomendação:** crie vários chats de teste com perguntas reais dos
   seus próprios clientes, e vá ajustando a base de conhecimento toda vez
   que a resposta não sair do jeito que você responderia.

## Quando o agente pede ajuda humana

No painel de conversas, se o agente pedir ajuda humana, clique em
**"intervir"** e responda pessoalmente. Depois de resolver, clique em
**"habilitar IA"** pra devolver a conversa pro agente continuar sozinho.

## Conectando o WhatsApp

1. Dentro do Chatvolt, abra seu agente, vá na aba **"Deploy"** e encontre
   a seção **WhatsApp**.
2. Clique em **"Settings"**, depois em **"Add WhatsApp Account"**.
3. Escolha **"Use an existing WhatsApp Business account"** e informe seu
   número.
4. No celular, abra o **WhatsApp Business** → **Configurações** →
   **Aparelhos conectados** → escaneie o QR code que aparece na tela.
5. Chega uma mensagem da WhatsApp Business Platform — toque em
   **"Connect"**, depois **"Connect to WhatsApp Business Platform"** e
   toque **"Confirm"** pra autorizar.
6. O número é registrado automaticamente. Se a Meta pedir, adicione uma
   forma de pagamento (só obrigatório se for enviar templates depois).
7. Feche a janela — pronto, o WhatsApp virou um canal do Chatvolt.

**Antes de tudo isso:** é preciso ter a Página do Facebook já montada
(Aula 1) — a vinculação do WhatsApp pede uma autorização via Facebook.

## Criando templates de mensagem

Vá em **"Gestão de clientes" → "Disparos" → "Gerenciar Templates"**.

Na criação:

- **Nome do template** — ex: mensagem de boas-vindas, ativação, contato com
  clientes.
- **Categoria** — ex: Marketing.
- **Cabeçalho** — um título chamativo, curto.
- **Corpo do texto** — a mensagem em si. Use o Claude pra dar exemplos
  referentes ao seu negócio.
- **Rodapé** — o nome do seu negócio.
- **Botões** — um botão com o telefone (liga direto pro número), e um
  segundo botão de resposta rápida, tipo **"Hoje não"** — deixa a mensagem
  mais íntima e evita que o cliente denuncie como propaganda.

Depois de configurado, o template fica **"em análise"** até a Meta aprovar.

## Checklist final

- [ ] Agente criado em "Personalizado", com nome e base de conhecimento em
      .txt enviada
- [ ] Testado no chat com perguntas reais de cliente, e ajustado onde
      errou
- [ ] WhatsApp conectado via aba Deploy → Settings → Add WhatsApp Account
- [ ] QR code escaneado no WhatsApp Business e conexão confirmada no
      celular
- [ ] Primeiro template criado em Gestão de clientes → Disparos →
      Gerenciar Templates

---
Toca o Negócio · Trilha Vender pela internet e pelo WhatsApp · Aula 3
