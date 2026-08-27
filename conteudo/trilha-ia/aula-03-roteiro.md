# Aula 3 — MCPs e Skills: o Claude com superpoderes

**Habilidade:** entender pra que serve um MCP e uma Skill, reconhecer as ferramentas dos três kits apresentados, cadastrar as contas necessárias e instalar tudo no VS Code — saindo da aula com o ambiente pronto pra colocar a mão na massa num projeto real do próprio negócio.

> **Nota:** este documento descreve os 9 vídeos realmente gravados
> (transcritos em 2026-08-27), que substituem o roteiro antigo sobre
> "montar um pedido reutilizável com contexto, tarefa, formato e
> exemplo" — um roteiro abandonado que nunca foi gravado. A aula 3
> real ensina o conceito de MCP e Skill, apresenta os três kits de
> ferramentas (pesquisa/automação, mídia gerada, skills/CLI/referência),
> mostra o cadastro de cada conta e a instalação via `mcp.json` no VS
> Code, e fecha com uma aplicação prática longa ("mão na massa"). PDF e
> atividade foram reescritos pra bater com isso.

## Resumo do que é dito, parte a parte

1. **Explicações iniciais** — Gregory avisa que essa é a parte mais
   técnica da trilha: são instalações pra "a máquina rodar da forma
   certa", com termos novos, mas no ritmo certo, passo a passo. Adianta
   o roteiro da aula: o que é MCP, o que é Skill, mais sobre o Claude, e
   no final a turma já monta um projeto. Dá a dica central da aula —
   antes de pedir qualquer coisa pro Claude, **antecipe o contexto**:
   conte pra ele quem você é, o que sua empresa faz, todos os detalhes,
   antes de fazer o pedido. Demonstra com o próprio exemplo: "sou dono
   de uma pizzaria, tenho dois funcionários, fico no bairro X de São
   Paulo, entrego uma média de 30 pizzas no fim de semana e 10 durante a
   semana" — só depois desse contexto é que vem o pedido ("elabore uma
   estratégia de marketing pro Instagram e Facebook"). Sem esse contexto
   antes, a resposta sai genérica.

2. **Mais sobre o Claude** — recapitula o ecossistema completo: **Claude**
   (o chat, você pergunta e ele responde ali mesmo), **Claude Code**
   (abre arquivo, escreve código, roda teste, "sentado do seu lado"),
   **Claude Cowork** (a terceira aba do Claude Desktop, roda a tarefa
   sozinho em segundo plano e entrega pronta). Depois as duas formas de
   estender: **Skills** são atalhos programados uma vez (ex: revisar
   código sempre pelos mesmos passos) — automação local. **MCP** é o
   protocolo que conecta a sistemas de fora (banco de dados, Google
   Drive, planilha) sem copiar e colar nada — conexão externa. E os
   motores por trás: **Haiku** (rápido e barato), **Sonnet** (equilíbrio
   do dia a dia), **Opus** (raciocínio pesado), **Fable** (agentes
   autônomos, decisão longa e sozinha). Fecha: três produtos, duas
   formas de estender, quatro motores — "agora você sabe qual peça
   chamar".

3. **Conceito: o que são MCPs e Skills** — situa que a instalação em si
   fica pra outra parte da aula, aqui é só o conceito. **MCP** é um
   plugin de capacidade: dá ao Claude acesso a algo que ele não
   consegue sozinho (buscar na internet, gerar imagem) — sem instalar,
   esse poder não existe; instalando, abre uma porta nova. **Skill** é
   diferente: não dá uma ferramenta nova, dá um manual de procedimento —
   um roteiro que o Claude segue quando a tarefa combina com aquele
   assunto (ex: estruturar um post pra Instagram: gancho → desenvolvimento
   → chamada final). Resumo: MCP abre uma porta nova; Skill ensina o
   melhor jeito de andar pela casa que já existe.

4. **MCPs de pesquisa e automação (Kit de Ferramentas A)** — quatro MCPs,
   quatro problemas diferentes: **Context7**, documentação técnica em
   tempo real (o modelo aprendeu até uma certa data; se uma biblioteca
   mudou depois, o Context7 busca a documentação atual direto na fonte).
   **Jina AI**, busca e leitura da web de verdade (sem MCP o Claude só
   sabe o que aprendeu no treinamento; com o Jina ele busca na web, lê
   página convertendo em texto limpo, busca artigo acadêmico, tira
   screenshot de site). **Chrome DevTools**, automação e inspeção de
   navegador (controla um Chrome de verdade: navega, clica, preenche
   formulário, tira screenshot, lê o console, audita performance e
   acessibilidade). **Supabase**, banco de dados e back-end completo
   (Postgres, autenticação, armazenamento de arquivo — é o back-end real
   por trás do site Toca o Negócio). Explica que um MCP pode ter dois
   escopos: global (qualquer conversa) ou só dentro de um projeto — se
   não aparecer numa pasta diferente, não é bug, é escopo.

5. **MCPs de mídia gerada (Kit de Ferramentas B)** — três MCPs, um
   assunto: imagem, vídeo, voz. **Kairogen**, catálogo grande (Seedream,
   Flux, Nanobanana, GPT Image, Sora, Veo, Kling, clonagem e alteração
   de voz, dublagem, upscaling via Topaz) — o "canivete suíço" quando
   você não sabe qual modelo usar. **Nanobanana**, geração e edição de
   imagem via Gemini do Google — irmã mais simples e focada do Kairogen,
   só imagem, direto, quando você já sabe o que quer. **Magnific**,
   geração de imagem e vídeo com upscaling por IA — usado quando o
   Kairogen ou o Nanobanana já geraram algo e falta só mais qualidade; é
   o único MCP remoto da lista (não instala pacote local, conecta direto
   na nuvem — nem todo MCP é uma instalação, alguns são só uma URL e um
   login).

6. **Skills, CLI e referência (Kit de Ferramentas C)** — os dois vídeos
   anteriores foram só MCP; aqui nenhuma das quatro ferramentas é MCP.
   **Superpowers**, metodologia de trabalho (não faz uma coisa
   específica, muda como o Claude aborda qualquer tarefa: brainstorming
   estruturado, TDD, debugging sistemático, escrita de planos, uso de
   Git Worktrees). **Find Skills**, descoberta de skills da comunidade
   (busca num catálogo por skills prontas sobre um assunto, em vez de
   escrever uma do zero). **Hyperframes**, produção de vídeo (renderiza
   vídeo de verdade a partir de HTML, CSS e animação — é como o canal
   produz os próprios vídeos; não é só instrução, é um programa que
   roda, com uma skill guiando o uso). **Claude Cookbook**, material de
   estudo (não é MCP nem skill ativa, é uma pasta de exemplos oficiais —
   notebooks mostrando como usar a API e o SDK do Claude: chamada de
   ferramenta, conteúdo multimodal, agente autônomo, avaliação de
   resultado — serve pra quando a tarefa é programar contra essa API,
   fora do Claude Code).

7. **Cadastro das ferramentas** — passo a passo de criar as contas de
   cada ferramenta dos kits, todas via login com Google (ou GitHub,
   quando indicado): **Kairogen** (acesso via Google). **Jina** (login
   no canto superior da plataforma, também via Google). **Google AI
   Studio, pro NanoBanana** — aqui tem um passo a mais: depois de
   acessar, cria uma **API Key** (ícone de chave, "criar nova chave",
   dar um nome pra ela) e copiar essa chave pra um documento à parte
   (Gregory usa um Word), porque ela vai ser usada depois no VS Code.
   **Node.js** (nodejs.org, baixar a versão Windows Install, executar o
   instalador — necessário pra máquina rodar as ferramentas).
   **Magnific** (registro via Google). **Find Skills MCP** — outro
   passo com chave: acessar, ir em "Documentos", achar "API Documentos",
   criar a chave lá embaixo e copiar pro mesmo documento das outras
   chaves. **Supabase** (inscrição via conta do GitHub — pra conectar
   com o projeto —, criar uma organização com um nome à sua escolha,
   criar uma senha e criar o projeto). **HeyGen** (plataforma de vídeo
   usada pelo Hyperframes: acesso via Google, plano free, preenche
   informações básicas do projeto). Fecha avisando que o próximo passo é
   colocar tudo isso dentro do VS Code.

8. **Instalando as ferramentas no VS Code** — `Ctrl+Shift+P` abre a
   busca de comandos; digita "MCP" e escolhe **"Open User
   Configuration"**. Apaga o conteúdo existente e cola o `mcp.json`
   completo disponibilizado na plataforma, abaixo do vídeo (esse
   arquivo não é reproduzido no material de apoio — o aluno pega ele
   direto na aula). Depois de colar, aparecem todas as skills e MCPs em
   lista — clica em **Start** em cada um. Duas ferramentas pedem a
   chave copiada na parte anterior (NanoBanana e Find Skills): apaga o
   texto de exemplo e cola a chave certa antes de dar Start. Ao terminar,
   **Ctrl+S** salva a configuração — passo que não pode ser esquecido.
   Alternativa se algum MCP não ativar: `Ctrl+Shift+P` → **"Browse MCP
   Server"**, busca pelo nome (ex: Chrome, Supabase) e instala por ali —
   mais lento que colar o `mcp.json` pronto, mas funciona igual. Fecha
   dizendo que com tudo instalado já dá pra criar imagem, conteúdo,
   site ou aplicativo, e que a parte seguinte é a "mão na massa" —
   sempre pensando no negócio de quem está assistindo, direto ao ponto:
   precisa de site, começa o site; precisa de imagem pro Instagram,
   começa a imagem.

9. **Mão na massa** — a parte mais longa da aula (27 minutos). Antes de
   começar, uma instalação extra rápida: a extensão **Python** no VS
   Code (`Ctrl+Shift+X`, busca "Python", da Microsoft) — reabre o VS
   Code depois pra confirmar que instalou. Aí sim começa a demonstração
   ao vivo, criando do zero o site de uma pizzaria fictícia ("Dona
   Nona"), aplicando tudo que foi ensinado:
   - **Modo automático:** no ícone de permissão do Claude Code, deixa em
     "auto" (não manual) — assim ele resolve sozinho o que for possível
     e só pergunta o que realmente precisa de decisão sua; no manual,
     ele para pra perguntar cada detalhezinho.
   - **Esforço do modelo:** pra uma tarefa estrutural que você faz uma
     vez só e não vai ficar mudando toda hora (criar o site inteiro),
     vale deixar o Claude trabalhar "mais forte" (gasta mais
     token/crédito, mas capricha) — diferente de um pedido simples do
     dia a dia, que não precisa desse nível.
   - **Contexto antes do pedido:** de novo a lição da Parte 1, na
     prática — antes de pedir o site, escreve um texto com todo o
     contexto (o site precisa ser leve pra abrir bem em qualquer
     celular ou computador — site pesado é penalizado pelo Google e
     trava celular mais simples —, nome da pizzaria, cidade, cardápio
     com 20 sabores, bebidas, ainda sem logo). Pede pro Claude
     perguntar qualquer dúvida sobre o negócio antes de criar, ser
     "especialista em construção de site e estúdio de mídia", usar
     todas as MCPs e Skills necessárias (instalando sozinho o que
     faltar), e manda 2 links de sites de referência que achou bonitos.
   - **Claude pergunta, você decide:** direção visual (escolhe "mistura
     equilibrada"), forma de pagamento (Mercado Pago + Pix + WhatsApp,
     recomendado pelo próprio Claude), modalidades de atendimento
     (delivery, retirada, consumo local — escolhe as três), fotos
     (nenhuma disponível, gera por IA), tamanhos de pizza, como avisar
     de pedido novo (WhatsApp automático, sem custo), **domínio** (o
     endereço do site na internet — se não tiver, registra em lugares
     como Registro.br ou Locaweb, uns R$ 30/ano; o Claude dá o passo a
     passo de como registrar), atendimento no salão (cardápio digital
     via QR code).
   - **Arquitetura recomendada:** o Claude propõe 3 caminhos (site
     estático leve — recomendado —, aplicação completa com banco de
     dados e painel administrativo, ou plataforma pronta de delivery) e
     explica o porquê da recomendação: entrega pagamento de verdade,
     leveza e menor custo/complexidade. Gregory aceita a recomendação
     mas pede um adendo: quer animação e efeito 3D pra parecer diferente
     dos concorrentes, sem perder a leveza — o Claude pondera o
     trade-off e seguem juntos.
   - **Identidade visual e conteúdo real:** o Claude sugere cores,
     tipografia e conceito de logo (escolhe "selo vintage") — se não
     gostar depois de ver pronto, é só pedir pra mudar. Depois pede o
     conteúdo real pra preencher o site: endereço completo, WhatsApp,
     horário, área e taxa de entrega, lista dos 20 sabores e das
     bebidas, e um detalhe da história do negócio.
   - **Nunca invente uma história falsa:** ponto chave da aula — se o
     seu negócio não tem uma história real prum "quem somos", **não
     invente uma**. Gregory cita o caso real de uma marca famosa de
     sorvete no Brasil que foi cancelada depois que descobriram que a
     história de origem contada por ela era mentira. Uma história real
     aproxima o cliente; uma história falsa pode derrubar o negócio
     quando descoberta.
   - **Resultado e iteração:** depois de rodar (usando o terminal
     PowerShell por trás, o mesmo terminal explicado na Aula 2), o site
     fica pronto e é salvo na área de trabalho a pedido. Gregory abre o
     link, revisa, e pede um ajuste pontual (não gostou da imagem 3D de
     pizza girando, pede uma foto real e artesanal no lugar) —
     mostrando que dá pra apontar qualquer detalhe (inclusive colando
     um print) e pedir pra mudar.
   - **Uma conversa por projeto:** organizar em conversas separadas —
     uma pro site, uma pro Instagram, uma pro Facebook, uma pro agente
     de WhatsApp — pra não misturar informação de projetos diferentes.
     Pra continuar um projeto depois (ex: adicionar um sabor novo de
     pizza), é só voltar na conversa daquele projeto específico.
   - **Fechamento:** o resultado economiza a contratação de alguém pra
     criar e manter o site, fica sempre atualizado e não depende de
     terceiros. A próxima aula da trilha trata de automação de agente
     de WhatsApp — inteligência artificial respondendo o WhatsApp da
     empresa.
