# Aula 5 — Automatize o que acontece por trás do agente

> **Nota (2026-08-27):** este roteiro substitui a versão anterior
> ("Organização da rotina", sobre usar IA em tarefas de fundo — agenda,
> cobrança, rascunho). Gregory definiu a nova estrutura em 3 vídeos,
> construindo em cima do agente de WhatsApp montado na Aula 4, agora usando
> n8n pra automação. **Ainda não gravado.** A atividade (`aula-05.json`) e o
> material de apoio (`aula-05-pdf.md`) continuam apontando pro conteúdo
> antigo por enquanto — serão reescritos a partir da transcrição real assim
> que os vídeos forem gravados, do mesmo jeito que foi feito pras Aulas 2 e
> 3.

**Habilidade:** entender o que é o n8n e usá-lo pra automatizar o que
acontece por trás do agente de WhatsApp montado na Aula 4 — sem precisar
programar.

**Ferramenta:** n8n, conectado ao agente Chatvolt da Aula 4.

## Estrutura em 3 partes

**Parte 1 — Apresentação**
Situa o que já foi montado (o agente responde mensagem no WhatsApp) e o
que falta: o que acontece DEPOIS da conversa — dado que não fica só no
chat, ação que precisa disparar sozinha. É isso que a automação resolve.

**Parte 2 — Conceito e informações do n8n**
O que é o n8n, pra que serve (conectar sistemas e automatizar fluxos de
trabalho sem programar), e onde ele se encaixa ao lado do agente que já
existe — o agente conversa, o n8n age a partir dessa conversa.

**Parte 3 — Automação pro agente criado**
Passo a passo prático: conectar o n8n ao agente da Aula 4 e montar uma
automação real a partir de uma conversa do WhatsApp (ex.: registrar o
pedido, avisar o dono, atualizar uma planilha — o exemplo exato depende
do fluxo que Gregory gravar). Demonstração ao vivo da automação disparando
de verdade.

## Depois de gravado

Repetir o processo já validado nas Aulas 2 e 3: transcrever cada vídeo,
reescrever `aula-05-roteiro.md` como resumo real parte a parte, reescrever
`dados/trilha-ia/aula-05.json` (atividade) e `conteudo/trilha-ia/aula-05-pdf.md`
(material de apoio) com base no conteúdo real gravado, e corrigir o título
em `dados/indice.json` se mudar.
