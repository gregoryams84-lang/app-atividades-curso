# Material de apoio — Aula 5: Automatize o que acontece por trás do agente

## O problema que essa aula resolve

Toda tarde alguém para o que está fazendo pra pensar no post de hoje. E se
isso acontecesse sozinho? Isso é uma automação: um fluxo que trabalha por
você, montado nó por nó — e ela nasce no **n8n**, o editor de automações.

## O que é o n8n

Uma plataforma no-code que conecta sistemas e monta fluxos de trabalho sem
programar. Um fluxo é montado em nós — cada nó faz uma coisa (dispara,
gera um texto, gera uma imagem, envia um e-mail) e passa o resultado
adiante pro próximo.

## Como funciona o fluxo de exemplo (Vídeo 1)

1. **Nó 1 — gatilho:** configurado pra disparar todo dia, às **18h**, no
   horário de Brasília.
2. **Nó 2 — uma IA escreve a legenda:** o sabor do dia, os emojis, o tom
   da sua marca.
3. **Nó 3, opcional — outra IA gera a foto** do produto do dia.
4. Os dados se organizam num só lugar e seguem por **e-mail**, pra
   aprovação, antes de qualquer coisa ir ao ar.
5. Você testa o fluxo inteiro uma vez. Funcionou? Então ativa — e ele
   passa a rodar sozinho, todo dia, no horário configurado.

A partir daí, o post do dia já chega pronto na sua caixa de entrada. Você
só diz sim.

## Passo a passo: montando a automação no n8n (Vídeo 2)

1. **Cadastro:** entra na plataforma n8n, faz o cadastro, vai em
   "Workflow" e cria um novo projeto.
2. **Criação por IA:** usa o recurso de criação por IA do próprio n8n
   (o botão de criar automação a partir de um prompt).
3. **O prompt é escrito com o Claude:** peça pro Claude escrever o texto
   que descreve a automação que você quer (ex: "quero uma automação que
   crie e me entregue o post do dia pro meu Instagram"). Cole esse texto
   no recurso de criação do n8n — ele sugere o fluxo completo a partir
   dali.
4. **Configure a IA que gera o conteúdo dentro do fluxo:** é uma etapa
   separada do prompt inicial. No exemplo da aula, a indicação usada foi
   o **ChatGPT**, já vinculado de graça na própria plataforma — mas
   qualquer IA disponível no n8n serve.
5. **Configure a entrega pro seu e-mail:** é assim que você aprova o
   conteúdo antes de qualquer coisa ir ao ar.
6. **Teste de verdade:** depois do teste da automação em si, rode uma
   execução real. Espere o conteúdo ser gerado (leva um tempinho) e
   confira no seu e-mail se saiu como você queria.

## Adicionando narração (opcional)

Se quiser um áudio pra acompanhar a imagem e o título, peça pro n8n
incluir um nó de narração. Quando esse nó pedir a voz:

1. Abra o **ElevenLabs** (plataforma de geração de voz) e crie conta
   gratuita com seu e-mail do Google.
2. Filtre por idioma **português** e sotaque **brasileiro**.
3. Escolha a voz que combina com sua marca.
4. Copie o **ID dessa voz** e cole no n8n, no nó de narração — é assim
   que ele sabe qual voz usar pra gerar o áudio.

## O que a automação entrega (e o que continua manual)

Ao final, o fluxo gera legenda, imagem e narração automaticamente, e
manda tudo pro seu e-mail. **A publicação em si continua manual**: você
abre o e-mail, copia o conteúdo (imagem, título, narração) e posta no
Instagram. A automação faz o trabalho de criar — não o de publicar.

## Fechamento da trilha

Essa é a última aula da Trilha IA no Negócio. As três frentes já
montadas até aqui — um agente que atende no WhatsApp (Aula 4), treinado
com a informação real do seu negócio, e agora uma automação que cria o
post do dia sozinha — trabalham juntas: uma cuida do atendimento, a
outra cuida do conteúdo. A próxima trilha entra na parte de marketing:
Instagram, Facebook, TikTok, entender seu público, e vincular de vez o
WhatsApp aos agentes que você já criou.

## Checklist final

- [ ] Conta criada no n8n
- [ ] Workflow criado com a criação por IA do n8n, a partir de um prompt
      escrito com ajuda do Claude
- [ ] IA de geração de conteúdo configurada dentro do fluxo (ex: ChatGPT)
- [ ] Voz escolhida no ElevenLabs (português, sotaque brasileiro) e ID
      colado no n8n, se for usar narração
- [ ] Entrega configurada pro seu e-mail, pra aprovar antes de postar
- [ ] Fluxo testado de verdade (executado) e ativado pra rodar sozinho no
      horário definido

---
Toca o Negócio · Trilha IA no Negócio · Aula 5
