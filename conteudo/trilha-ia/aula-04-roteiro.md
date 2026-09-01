# Aula 4 — Crie Funcionários

**Habilidade:** criar do zero, dentro do Chatvolt, um agente de IA treinado
com informação real do próprio negócio, publicado e testado — pronto pra
assumir o atendimento repetitivo no WhatsApp (e Instagram, site) sem
perder o controle das situações que ainda precisam de uma pessoa.

> **Nota:** este documento descreve os 4 vídeos realmente gravados
> (transcritos em 2026-09-01), que substituem o roteiro-guia de
> planejamento em 5 partes escrito antes da gravação. A distribuição do
> conteúdo real ficou diferente do planejado: a Parte 2 virou só a
> vinheta de apresentação do Chatvolt (sem cadastro nela); o cadastro da
> conta e um tour completo pela plataforma e pelos planos formam a Parte
> 3 (que no plano nem existia como vídeo separado); e a criação do
> agente, as configurações, a base de conhecimento e o teste final — que
> no plano estavam em três partes distintas — foram gravados juntos, num
> único vídeo prático de ~20 minutos (Parte 4). PDF e atividade foram
> reescritos pra bater com isso.

## Resumo do que é dito, parte a parte

1. **Apresentação** (~1min20) — Gregory situa o problema: nessa aula o
   objetivo é criar um agente que saiba toda a informação do negócio, pra
   ajudar a responder dúvida de cliente via WhatsApp, e-mail, Instagram e
   Facebook. Lembra o "funcionário de secretaria" citado na Aula 1 (outra
   frente de trabalho dele, um polo de ensino a distância — que só
   respondia pergunta simples e repetitiva, tipo como assinar contrato ou
   gerar boleto) e explica que aqui, nessa trilha, o aluno vai criar
   exatamente esse tipo de agente pro próprio negócio: um funcionário de
   atendimento que tira dúvida, faz pedido, cadastra, matricula — tudo
   que fizer sentido — via WhatsApp, Instagram ou outra rede social.

2. **Chatvolt: o que é** (~1min) — vinheta de apresentação da ferramenta.
   Mensagem de cliente chega o dia inteiro (manhã, noite, fim de semana) e
   alguém precisa responder — isso tem nome, Chatvolt: uma plataforma
   no-code que cria um agente de IA pra atender os clientes por você,
   "um funcionário virtual" treinado com as informações da empresa
   (catálogo, dúvidas frequentes, regras de atendimento), que conversa 24
   horas por dia. O caminho básico: criar a conta, escolher o canal
   (WhatsApp, site ou Instagram), o agente aprende com os dados do
   negócio (documentos, planilhas, site), o dono ajusta o tom das
   respostas e ativa.

3. **Conhecendo a plataforma e os planos** (~7min) — passo a passo real de
   cadastro: entra no Google, pesquisa "Chatvolt", cria a conta com
   **"continuar com o Google"**. Assim que termina de preencher os dados,
   o Chatvolt já pede pra criar um agente na hora — a orientação da aula é
   **fechar essa janela (X)** e ir pra página principal primeiro, sem
   criar o agente ainda. A partir daí, Gregory apresenta cada seção da
   plataforma:
   - **Caixa de entrada** — de agora em diante, toda conversa (WhatsApp,
     Instagram, novos leads) acontece ali dentro, não mais direto no
     WhatsApp Business ou WhatsApp Web.
   - **Novos agentes** — onde os agentes são criados.
   - **Base de conhecimento** — onde entra todo o conteúdo da empresa,
     pra o agente ficar bem informado.
   - **Artefatos** — um catálogo com os preços dos produtos. Explica que
     só compensa usar quando o negócio tem muitos preços diferentes —
     cita como exemplo **um outro negócio dele, fora do Toca o Negócio**
     (o polo de ensino a distância, com cerca de 800 cursos de
     pós-graduação): se o agente tivesse que vasculhar tudo isso junto,
     se confundiria; com os artefatos, ele busca o preço certo direto.
   - **Volt API** — não é usada nessa aula.
   - **Gestão de clientes** — contatos dos clientes; fluxo de CRM fica no
     plano Pro.
   - **Disparos de WhatsApp** — mandar mensagem em massa sem cair no
     bloqueio que o WhatsApp aplica quando desconfia de robô ou fraude;
     pra isso, a linha precisa estar vinculada ao Chatvolt **e** o
     template da mensagem precisa de aprovação da Meta.
   Sobre os planos: pra vincular o WhatsApp oficial (o objetivo da aula),
   é preciso pelo menos o **plano básico** — o gratuito não vincula.
   Gregory indica o básico (é o que ele mesmo usa): **R$ 237/mês**, com 2
   agentes, 7.500 perguntas respondidas por mês, 4 bases de conhecimento e
   200 artefatos. Compara o custo com o de manter funcionário — fecha
   avisando que o próximo vídeo é a criação do agente com a base de
   conhecimento.

4. **Criando e configurando o agente, com teste final** (~20min) —
   demonstração prática completa, usando o exemplo da "Pizzaria Nona" (o
   mesmo projeto fictício da Aula 3). Ao criar o agente:
   - Escolhe **"Personalizado"**, define o setor **"Vendas"**, a
     categoria **"Varejo"**, o nome (Pizzaria Nona) e o que o agente vai
     fazer (**"Atendimento Geral"**).
   - **Chave de ouro da aula:** deixa o Claude (chamado de "Chat Cloud"
     ou "Cloud" na fala) aberto numa janela ao lado o tempo todo, e usa
     ele pra sugerir nome pro agente (pede um nome "pessoal", escolhe
     **"Nona Carmela"**), preencher palavras-chave e público-alvo (copia
     e cola o formulário do Chatvolt no Claude e pede pra preencher —
     "às vezes é até mais rápido" colar o print da tela), e escrever o
     prompt de comportamento do agente.
   - **Foto do agente:** gera um avatar realista no **Google Flow**
     (plataforma gratuita), com um prompt em inglês feito pelo Claude
     ("em inglês fica mais fácil pro Google entender"), baixa a imagem e
     sobe no Chatvolt.
   - **Base de conhecimento:** pede pro Claude escrever um arquivo
     **.txt** com todas as informações do negócio — o Claude faz
     perguntas sobre a empresa até ter o suficiente, gera o texto, e o
     aluno baixa esse arquivo.
   - **Implantar:** seção onde o agente pode ser vinculado a Telegram,
     WhatsApp, Instagram, Website, YouTube e Mercado Livre (no exemplo da
     pizzaria: Instagram, WhatsApp e site).
   - **Configurações → Prompt:** nível de resposta **light, médio ou
     regular** — escolhe regular pra pizzaria (não precisa de raciocínio
     complicado). O texto do prompt já vem preenchido, mas dá pra pedir
     pro Claude reescrever melhor pro seu mercado. Modelo de IA: reutiliza
     o próprio Claude, mais simples e mais barato pra um caso como esse.
     Mantém a base de conhecimento ativa, liga a geração automática no
     idioma do cliente, **não ignora imagem** (deixa a IA ler print que o
     cliente mandar) e ativa "evitar quebra de mensagem" (resposta sai
     inteira, não fatiada).
   - **Tempo de resposta:** recomenda uns **20 a 25 segundos** de atraso
     de propósito — responder em 5 segundos "parece um robô mesmo".
   - **Mensagem de follow-up:** configurar um retorno automático se o
     cliente não respondeu — no exemplo da pizzaria, cerca de 1 hora
     depois ("já escolheu o pedido?"); pra outros negócios, cita 24 horas
     como referência. Varia por tipo de negócio.
   - **Artefatos:** no caso da pizzaria, não compensa (poucos preços) —
     de novo o contraste com o exemplo dos 800 cursos de pós-graduação.
   - **Identidade do agente:** sobe a foto gerada e um nome de referência
     interno, pra identificar o agente na lista.
   - Menciona que fluxo de CRM e respostas rápidas também dá pra
     configurar, e que vincular Instagram/WhatsApp de verdade (Meta) fica
     pra próxima trilha — aqui o foco é só a criação do agente.
   - **Teste dentro do próprio Chatvolt (aba "chat"):** pergunta "Qual o
     valor da pizza?" — o agente responde de forma genérica, perguntando
     tipo e tamanho (porque a base de conhecimento tinha só isso).
     Pergunta "Qual sabor tem?" — o agente não sabe, porque sabor não
     tinha entrado na base de conhecimento ainda. O ajuste mostrado: volta
     no Claude, pede pra incluir sabores (usa valores fictícios, já que
     não é dono de pizzaria de verdade), gera um novo .txt ("Base Dona
     Nona 1"), e sobe esse arquivo em **Implantar → Configurações → Base
     de conhecimentos → Adicionar fonte de dados**. Espera o
     processamento (fica "pendente, 0 tokens" até aparecer OK/resolvido).
   - **Teste final, fora da configuração:** em "Agentes → Conversa com o
     agente", cria um novo chat e repete a pergunta — agora vem a
     resposta certa. Recomendação de Gregory: criar vários chats de teste
     com perguntas reais dos próprios clientes (conta que, no caso dele,
     testou cerca de cem perguntas) e ir ajustando a base de conhecimento
     toda vez que a resposta não sair como o dono responderia — processo
     trabalhoso, mas que deixa o agente "respondendo exatamente o que
     você responderia".
   - **Painel de conversas:** mesmo lugar onde aparecem as mensagens reais
     (WhatsApp, Instagram etc.). Quando o agente pede ajuda humana (ex:
     reclamação), o dono clica em **"intervir"**, responde pessoalmente,
     e depois clica em **"habilitar IA"** pra devolver a conversa pro
     agente continuar sozinho — o mesmo princípio de crise nunca ficar só
     com a IA, já visto na Aula 2.
