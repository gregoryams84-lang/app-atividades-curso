# Aula 5 — Automatize a criação do seu conteúdo

**Habilidade:** entender o que é o n8n e usar a criação por IA da plataforma
pra montar, sem programar, uma automação que gera sozinha o post do dia
(legenda, imagem e narração) e entrega pronto pra você aprovar antes de
publicar.

> **Nota:** este documento descreve os 2 vídeos realmente gravados
> (transcritos em 2026-09-01), que substituem o roteiro-guia de
> planejamento em 3 partes escrito antes da gravação. A ideia original
> era automatizar o que acontece DEPOIS de uma conversa no WhatsApp
> (registrar pedido, avisar o dono, atualizar planilha), amarrando o n8n
> ao agente Chatvolt da Aula 4. Na gravação real isso mudou de direção: o
> exemplo prático virou uma automação de **criação de conteúdo pro
> Instagram** (legenda, imagem e narração, geradas por IA dentro do
> próprio n8n e entregues por e-mail pra aprovação) — nenhum dos dois
> vídeos menciona o Chatvolt ou o WhatsApp. PDF e atividade foram
> reescritos pra bater com o conteúdo real. **O Vídeo 2 também fecha a
> trilha inteira** — no final ele faz uma mensagem de encerramento
> (motivacional, "não desista") e anuncia o assunto da próxima trilha
> (marketing: Instagram, Facebook, TikTok, e vincular o WhatsApp aos
> agentes) — isso está registrado no resumo abaixo.

## Resumo do que é dito, vídeo por vídeo

1. **Vídeo 1 — "Sua primeira automação: o que é o n8n"** (~1min17,
   animação/vinheta) — Situa o problema: toda tarde alguém para o que
   está fazendo pra pensar no post do dia. E se isso acontecesse
   sozinho? Isso é uma automação — um fluxo que trabalha por você, e ela
   nasce no **n8n**, o "editor de automações", montado nó por nó. A
   vinheta explica o fluxo em 3 nós, usando o exemplo da Nona (mesmo
   projeto fictício das aulas anteriores):
   - **Nó 1 — gatilho:** configurado pra disparar todo dia, às
     **18h**, no horário de Brasília.
   - **Nó 2 — uma IA escreve a legenda:** o sabor do dia, os emojis, o
     tom caloroso da Nona.
   - **Nó 3, opcional — outra IA gera a foto:** a pizza saindo do forno
     a lenha.
   Os dados se organizam num só lugar e seguem por **e-mail**, pra
   aprovação, antes de qualquer coisa ir ao ar. A orientação: testa o
   fluxo inteiro uma vez; se funcionou, ativa, e ele passa a rodar
   sozinho todo santo dia, às 18h. A partir daí, o post do dia já chega
   pronto na caixa de entrada — você só diz sim. Fecha com: "essa foi
   sua primeira automação, e no Toca o Negócio ela é só o começo."

2. **Vídeo 2 — "Aplicação prática do n8n"** (~9min03, demonstração real)
   — Passo a passo de montar, de verdade, a automação de conteúdo pro
   Instagram anunciada no Vídeo 1:
   - **Objetivo declarado no início:** criar uma automação que gere o
     conteúdo pra postar no Instagram sozinha; o conteúdo chega pronto
     no e-mail, e você (ainda manualmente) pega e posta no Instagram —
     "não vai precisar mais você mesmo ficar criando o conteúdo".
   - **Montagem no n8n:** entra na plataforma, faz o cadastro, vai em
     "Workflow", cria um novo projeto, e usa a criação por IA nativa do
     n8n (clica em algo como **"Build with"**).
   - **O prompt que descreve a automação foi escrito com o Claude**
     (citado na fala como **"Cloud Chat"**, o mesmo padrão de
     apelido usado na Aula 4) — pede pra criar uma automação que poste
     conteúdo no Instagram, gera o texto do prompt, e cola esse texto
     dentro do recurso de criação por IA do n8n. Mostra rapidamente
     (sem querer) o site do Toca aberto numa aba, fecha em seguida.
   - Lê o texto de exemplo gerado pra legenda: algo como "um cheiro de
     forno a lenha, cozinha, infância na Itália, hoje eu quero...".
     Aprova o texto, e o n8n sugere montar o fluxo automatizado pra
     publicar: gerar uma imagem, um texto junto com a imagem, um
     título — o próprio n8n cria essa automação.
   - **Escolha da IA de conteúdo, dentro do fluxo (diferente do
     Claude usado fora dele):** ao configurar o nó que gera o
     conteúdo, o n8n pergunta com qual IA gerar — a indicação usada foi
     o **ChatGPT**, já vinculado de graça na própria plataforma.
   - **Entrega:** configurada pro e-mail, pra servir de aprovação antes
     de qualquer coisa ir pro Instagram.
   - **Teste real:** o n8n pede pra rodar um teste de verdade (não só o
     teste da automação em si) — executa, espera o conteúdo ser
     gerado (leva um tempinho), confirma que foi entregue no e-mail, e
     abre o e-mail: nesse primeiro teste aparece a imagem e o título já
     gerados (a fala nesse ponto já antecipa a narração que vem a
     seguir, mas ela ainda não tinha sido configurada).
   - **Adicionando narração:** pede pro n8n incluir, junto com imagem e
     título, uma narração também. Ao configurar esse nó, ele pergunta
     de onde buscar a voz — é aí que entra o **ElevenLabs** (citado na
     fala como **"ElevenUp"**): abre o site, cria conta com o e-mail do
     Google (gratuito), busca uma voz filtrando idioma **português** e
     sotaque **brasileiro**, escolhe a voz **"Roberta"**, copia o ID
     dessa voz e cola no n8n pra vincular a voz ao conteúdo.
   - **Resultado final:** o fluxo gera tudo automaticamente — conteúdo,
     imagem e narração — e manda pro e-mail. Abre o e-mail: aparece a
     imagem, o título e, embaixo, a narração pra copiar e anexar no
     Instagram. A publicação em si continua manual — a automação entrega
     tudo pronto, não posta sozinha.
   - **Fechamento da aula e da trilha inteira:** depois de mostrar o
     resultado, o vídeo passa a falar diretamente com quem está
     assistindo, fechando a Trilha IA no Negócio como um todo: reforça
     que a automação ajuda a economizar tempo e manter o negócio
     atualizado, que "hoje em dia não tem como escapar disso", e
     anuncia que **a próxima trilha vai tratar de marketing** — TikTok,
     Instagram, Facebook, entender o público, e **vincular o WhatsApp
     aos agentes** (o agente da Aula 4). Fecha com uma mensagem
     motivacional: cita que 90% das pessoas desistem, pede pra quem
     está assistindo não desistir, correr atrás e acompanhar o
     conteúdo — "até a próxima trilha, um grande abraço".
