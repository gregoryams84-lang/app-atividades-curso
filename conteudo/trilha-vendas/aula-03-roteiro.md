# Aula 3 — Crie seu agente e conecte ao WhatsApp

**Habilidade:** criar do zero, dentro do Chatvolt, o agente de atendimento do
seu negócio (com ajuda do Claude), conectar esse agente ao WhatsApp oficial
que você já vinculou no portfólio (Aula 2), e criar o primeiro template de
mensagem pra aprovação da Meta.

> **Nota:** este documento descreve os 3 vídeos realmente gravados
> (transcritos em 2026-09-04), que substituem o roteiro-guia de planejamento
> escrito antes da gravação ("Automação de conteúdo pras redes sociais", que
> previa uma automação de geração de posts). **O tema real desta aula é
> totalmente diferente:** ela ensina a criar o agente de IA no Chatvolt, a
> conectar esse agente ao WhatsApp oficial, e a criar templates de mensagem
> — nada sobre automação de conteúdo pras redes sociais. O título desta aula
> no índice do curso precisa ser corrigido. PDF e atividade foram reescritos
> pra bater com o conteúdo real.
>
> **Outro ponto que vale registrar:** o Vídeo 1 desta aula ("Chatvolt:
> criando o agente") é, na prática, a mesma demonstração já documentada na
> Aula 4 da Trilha 1 (IA no Negócio) — mesmo exemplo da "Pizzaria Nona" e da
> "Nona Carmela", passo a passo idêntico de criação do agente. Tudo indica
> que é a mesma gravação reaproveitada nas duas trilhas. Por causa disso, o
> vídeo termina dizendo que "vincular Instagram/WhatsApp de verdade fica pra
> próxima trilha" — mas, dentro desta trilha (Vender pela internet e pelo
> WhatsApp), essa conexão não fica pra depois: ela é exatamente o Vídeo 2
> desta MESMA aula, gravado separadamente. Vale o Gregory avaliar se faz
> sentido manter esse vídeo duplicado nas duas trilhas, ou se um dos dois
> merece uma gravação nova e específica.

## Resumo do que é dito, parte a parte

1. **Vídeo 1 — Chatvolt: criando o agente** (~20min08) — demonstração
   prática completa, usando o exemplo da "Pizzaria Nona" (o mesmo projeto
   fictício de aulas anteriores da trilha). Ao criar o agente:
   - Escolhe **"Personalizado"**, setor **"Vendas"**, categoria
     **"Varejo"**, nome (Pizzaria Nona) e o que o agente vai fazer
     (**"Atendimento Geral"**).
   - **Chave de ouro:** deixa o Claude aberto numa janela ao lado o tempo
     todo — usa ele pra sugerir nome pro agente (pede um nome "pessoal",
     escolhe **"Nona Carmela"**), preencher palavras-chave e público-alvo
     (cola o print da tela do Chatvolt no Claude e pede pra preencher — "às
     vezes é até mais rápido"), e escrever o prompt de comportamento.
   - **Foto do agente:** gera um avatar realista no **Google Flow**
     (gratuito), com um prompt em inglês feito pelo Claude ("em inglês fica
     mais fácil pro Google entender"), baixa e sobe no Chatvolt.
   - **Base de conhecimento:** pede pro Claude escrever um arquivo **.txt**
     com todas as informações do negócio — o Claude faz perguntas até ter
     o suficiente, gera o texto, e o aluno baixa o arquivo.
   - **Implantar:** vincula a Telegram, WhatsApp, Instagram, Website,
     YouTube ou Mercado Livre (no exemplo: Instagram, WhatsApp e site).
   - **Configurações → Prompt:** nível de resposta light, médio ou regular
     (escolhe regular pra pizzaria). Modelo de IA: reutiliza o Claude.
     Mantém base de conhecimento ativa, geração automática de idioma
     ligada, não ignora imagem, ativa "evitar quebra de mensagem".
   - **Tempo de resposta:** uns 20 a 25 segundos de atraso de propósito —
     responder em 5 segundos "parece um robô mesmo".
   - **Mensagem de follow-up:** retorno automático se o cliente não
     respondeu (no exemplo da pizzaria, cerca de 1 hora depois; pra outros
     negócios, cita 24 horas — varia por tipo de negócio).
   - **Artefatos:** não compensa pra pizzaria (poucos preços).
   - **Teste no chat:** pergunta "Qual o valor da pizza?" — resposta
     genérica (faltava contexto). Pergunta "Qual sabor tem?" — o agente não
     sabia, porque sabor não tinha entrado na base de conhecimento. Ajuste:
     volta no Claude, pede pra incluir sabores (valores fictícios), gera
     novo .txt, sobe em **Implantar → Configurações → Base de
     conhecimentos → Adicionar fonte de dados**, espera processar até
     "resolvido".
   - **Teste final:** em "Agentes → Conversa com o agente", cria um chat
     novo e repete a pergunta — agora vem certo. Recomendação: criar vários
     chats de teste com perguntas reais dos próprios clientes (no caso de
     Gregory, testou cerca de cem perguntas) e ajustar a base de
     conhecimento toda vez que a resposta não sair como o dono responderia.
   - **Painel de conversas:** quando o agente pede ajuda humana, clica em
     **"intervir"**, responde pessoalmente, depois clica em **"habilitar
     IA"** pra devolver a conversa pro agente.
   - (Ao final, o vídeo menciona que vincular Instagram/WhatsApp de verdade
     via Meta fica pra depois — ver nota no topo deste documento.)

2. **Vídeo 2 — Conectando o WhatsApp** (~58s) — passo a passo rápido,
   narrado, pra vincular o WhatsApp ao agente do Chatvolt:
   1. Dentro do Chatvolt, abra seu agente, vá na aba **"Deploy"** e
      encontre a seção **WhatsApp**.
   2. Clique em **"Settings"**, depois em **"Add WhatsApp Account"**.
   3. Abre uma janela pedindo login do Facebook — escolha **"Use an
      existing WhatsApp Business account"** e informe o número.
   4. No celular, abra o **WhatsApp Business** → **Configurações** →
      **Aparelhos conectados** → escaneie o QR code que aparece na tela.
   5. Chega uma mensagem da WhatsApp Business Platform — toque em
      **"Connect"**, depois **"Connect to WhatsApp Business Platform"** e
      toque **"Confirm"** pra autorizar.
   6. O número é registrado automaticamente. Se a Meta pedir, adicione uma
      forma de pagamento (só obrigatório se for enviar templates depois).
   7. Feche a janela — pronto, o WhatsApp virou um canal do Chatvolt.

3. **Vídeo 3 — Nosso agente no WhatsApp e criação de templates** (~4min09)
   — depois de vincular:
   - Antes de tudo, é preciso ter a **Página do Facebook já montada**
     (Aula 1), porque a vinculação do WhatsApp pede uma autorização via
     Facebook.
   - Depois de vincular o WhatsApp, dá pra vincular o **Instagram** também,
     se tiver interesse.
   - **Criando templates:** vá em **"Gestão de clientes" → "Disparos" →
     "Gerenciar Templates"**.
   - Na criação: nome do template (ex: mensagem de boas-vindas/ativação),
     categoria (ex: Marketing), idioma. Preenche o **cabeçalho** (título
     chamativo), o **corpo do texto** (a mensagem em si — recomenda usar o
     Claude pra dar exemplos referentes ao negócio) e o **rodapé** (nome do
     negócio).
   - **Botões:** um botão de telefone (liga direto pro número), e um
     segundo botão de resposta rápida — no exemplo, **"Hoje não"** —
     porque deixa a mensagem mais íntima e evita que o cliente denuncie
     como propaganda.
   - Depois de configurado, o template é enviado pra análise — fica
     "em análise" até a Meta aprovar.
