# Aula 2 — Preparando seu computador pra usar IA de verdade

**Habilidade:** montar o ambiente de trabalho completo — Windows 11 Pro, Claude Pro, GitHub e VS Code conectados — e saber pra que serve cada peça.

> **Nota:** este documento descreve os 7 vídeos realmente gravados
> (transcritos em 2026-08-25), que não seguiram o roteiro original das
> "ferramentas que cabem no bolso". Gregory gravou o passo a passo real de
> como montar o ambiente antes de usar o Claude Code: verificação do
> Windows, instalação do Claude, criação de conta no GitHub, instalação do
> VS Code, dica de uso em paralelo com o chat, instalação da extensão
> Claude Code no VS Code, e explicação do terminal PowerShell. PDF e
> atividade foram reescritos pra bater com isso.

## Resumo do que é dito, parte a parte

1. **Verificação do Windows** — abrir Configurações → Sistema → Ativação e
   confirmar que é Windows 11 **Pro** (não Home). Só o Pro tem as
   ferramentas necessárias pro Claude Code. Sem o Pro, sugestão é comprar a
   licença (ex: Mercado Livre).

2. **Instalação do Claude** — link `claude.com/download`. Instala o app no
   computador (não só a versão web). Cria conta (e-mail ou Google) e
   assina o plano **Pro** — obrigatório, porque o Claude Code não funciona
   no plano gratuito. Gregory reforça: esse projeto é pra sair do papel de
   verdade, não pra "testar" no free.

3. **Criação de conta no GitHub** — link `github.com`. Descrito como "a
   nuvem que registra todo o projeto numa linha do tempo". Necessário pro
   Claude conectar e registrar o trabalho.

4. **Instalação do VS Code** — link `code.visualstudio.com`. Instala e,
   na primeira abertura, faz login com a conta do GitHub criada na parte
   anterior — conectando GitHub (nuvem) + VS Code (onde o trabalho
   acontece).

5. **Dica: chat em paralelo** — trabalhar com uma janela lateral aberta com
   o chat do Claude enquanto usa o Code. Serve pra tirar dúvidas, pensar em
   voz alta ou por áudio, escrever prompts — o chat orienta, o Code
   executa.

6. **Instalação da extensão Claude Code no VS Code** — `Ctrl+Shift+X`,
   busca "Claude", instala, autoriza o acesso Anthropic (o Claude já
   precisa estar instalado no PC antes). Mostra que dentro do VS Code
   existem os dois modos, chat e Claude Code, trabalhando juntos.

7. **O que é o PowerShell** — o terminal do computador. É onde ficam
   guardadas chaves e senhas de API que não podem circular pela nuvem
   (acesso só local). Também acessível direto de dentro do VS Code, num
   painel de Terminal na parte inferior da tela.

Fecha reforçando que tudo — terminal, chat e Claude Code — fica no mesmo
lugar, dentro do VS Code, uma vez que o ambiente está montado.
