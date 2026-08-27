# Aula 4 — Monte seu agente de atendimento no WhatsApp

> **Nota (2026-08-27):** este roteiro substitui a versão anterior ("Atendimento
> sem parecer robô", sobre revisar texto genérico de IA). No fechamento do
> vídeo "mão na massa" da Aula 3, Gregory já anuncia que a próxima aula é
> sobre montar um agente de WhatsApp de verdade — este roteiro alinha o
> conteúdo com essa promessa e com a estrutura de 5 vídeos definida por ele.
> **Ainda não gravado.** A atividade (`aula-04.json`) e o material de apoio
> (`aula-04-pdf.md`) continuam apontando pro conteúdo antigo por enquanto —
> serão reescritos a partir da transcrição real assim que os vídeos forem
> gravados, do mesmo jeito que foi feito pras Aulas 2 e 3.

**Habilidade:** configurar do zero um agente de IA real no Chatvolt,
conectado ao WhatsApp do negócio, com base de conhecimento própria, testado
e pronto pra responder cliente sozinho.

**Ferramenta:** Chatvolt (mesma plataforma que Gregory já usa nos próprios
agentes de negócio, "Ana" e "Gregory").

## Estrutura em 5 partes

**Parte 1 — Apresentação**
Situa o problema (Aula 2 revisou texto que VOCÊ manda; e quando o cliente
manda fora do horário, ou chegam várias mensagens de uma vez?) e apresenta
a promessa da aula: sair com um agente de verdade respondendo sozinho no
WhatsApp do negócio.

**Parte 2 — Chatvolt**
Apresenta a ferramenta: o que é, pra que serve, como criar a conta. Contexto
de por que essa é a plataforma escolhida (é a mesma usada em produção,
não é só um exemplo de sala de aula).

**Parte 3 — Criar agente e configurações no Chatvolt**
Passo a passo de criar o agente dentro do Chatvolt e conectar o número de
WhatsApp do negócio. Configurações principais: nome do agente, tom de voz,
limites do que ele pode responder sozinho vs. o que precisa escalar pro
dono (reclamação, cobrança, negociação — reforça o que já foi dito na
Aula 2: crise nunca fica só com a IA).

**Parte 4 — Criar base de conhecimento pro agente**
Como alimentar o agente com informação real do negócio — os mesmos fatos
levantados na Aula 3 (o que vende, funcionários, localização, número real)
mais as perguntas mais comuns dos clientes e como o dono normalmente
responde. É essa base que faz o agente responder com informação certa, não
genérica.

**Parte 5 — Testar o agente**
Demonstração ao vivo: mensagem de teste chegando no WhatsApp conectado e o
agente respondendo sozinho. Fecha reforçando acompanhar as primeiras
conversas reais de perto antes de confiar 100% no agente.

## Depois de gravado

Repetir o processo já validado nas Aulas 2 e 3: transcrever cada vídeo,
reescrever `aula-04-roteiro.md` como resumo real parte a parte, reescrever
`dados/trilha-ia/aula-04.json` (atividade) e `conteudo/trilha-ia/aula-04-pdf.md`
(material de apoio) com base no conteúdo real gravado, e corrigir o título
em `dados/indice.json` se mudar.
