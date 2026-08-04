# Testes manuais

Casos para verificar à mão no navegador antes de publicar uma mudança. Sirva a pasta com `python3 -m http.server 8000` (nunca `npx serve` — ele descarta a querystring e o hash que este aplicativo usa).

## Conteúdo inválido

1. Edite temporariamente `dados/trilha-ia/aula-01.json` e quebre a sintaxe JSON (por exemplo, remova uma vírgula). Abra a atividade. Esperado: mensagem "Não foi possível carregar esta atividade agora..." — nunca tela branca. Reverta o arquivo.
2. Edite `schema_version` para `99`. Esperado: "Esta atividade precisa de uma versão mais nova do aplicativo..." e um erro no console apontando o arquivo. Reverta.

## Bloco com id desconhecido

Em `dados/trilha-ia/aula-01.json`, mude temporariamente o `id` do bloco `b3` para `b3x`. Recarregue uma atividade que já tinha resposta salva em `b3`. Esperado: nenhuma tela quebrada; a resposta antiga simplesmente não aparece mais pré-preenchida no bloco renomeado (ele é tratado como um bloco novo, vazio). Reverta.

## Dependência de aula ainda não respondida

Limpe o `localStorage` (`localStorage.clear()` no console) e navegue direto para `atividade.html?trilha=trilha-ia&aula=aula-01#bloco-4` — o roteamento deve redirecionar para o primeiro bloco pendente (`#bloco-1`), confirmando a proteção. Para testar o fallback da dependência isoladamente, aponte temporariamente `b4.campos[0].depende_de` para uma aula real mas sem nenhuma resposta salva (ex.: crie uma segunda aula fictícia no índice sem respondê-la) — o campo deve virar texto livre com a nota "Você ainda não respondeu isso...".

## Campo numérico com texto

No bloco de cálculo, tente colar texto num campo numérico (em navegadores que permitem colar texto em `<input type="number">`, ou usando o console: `document.querySelector('#b4-vezes_semana').value = 'abc'` seguido de disparar um evento `input`). Esperado: o resultado mostra "indisponível" em vez de travar ou mostrar `NaN`.

## Campo numérico com zero

Preencha `vezes_semana` ou `minutos_vez` com `0`. Esperado: resultado mostra "Você gasta cerca de 0 minutos por semana, o que dá 0 horas por mês." — não "indisponível" (multiplicar por zero é uma conta válida, diferente de dividir por zero).

## Armazenamento cheio

No console: `for (let i = 0; i < 10000; i++) { try { localStorage.setItem('lixo' + i, 'x'.repeat(1000000)); } catch (e) { break; } }` até `localStorage.setItem` começar a lançar erro. Recarregue a atividade e responda um bloco. Esperado: aviso "Não estamos conseguindo salvar suas respostas agora..." aparece, e a atividade continua respondível na sessão. Limpe o `localStorage` depois (`localStorage.clear()`).

## Importação de arquivo inválido

Ver Task 14, Step 4 do plano de implementação: arquivo com JSON quebrado, e arquivo JSON válido mas sem chaves reconhecidas — ambos devem mostrar mensagem clara, nunca sobrescrever nada.

## Recarregar no meio do preenchimento

Comece a preencher o bloco `b3` (lista aberta), preencha 2 de 5 campos, recarregue a página sem avançar. Esperado: os 2 campos preenchidos continuam lá, ainda no mesmo bloco (`#bloco-3` no hash).

## Sincronização de conclusão com o Supabase

Requer um link de sessão válido, gerado pelo painel do aluno em `tocaonegocio.com.br/atividades/painel.html` (matrícula de teste ativa, aula com `link_atividade` cadastrado).

1. Abra o DevTools (aba Network) antes de clicar no link do painel. Complete a aula até o fim. Esperado: uma requisição `POST` para `.../rest/v1/progresso?on_conflict=matricula_id,aula_id` com status `2xx`, e uma nova linha em `progresso` no dashboard do Supabase (`concluida = true`, `matricula_id`/`aula_id` corretos).
2. Complete a mesma aula de novo (ela já estava concluída). Esperado: uma nova requisição é enviada, mas o número de linhas em `progresso` para essa combinação de matrícula/aula continua sendo 1 (upsert, não duplica).
3. Acesse `atividade.html?trilha=trilha-ia&aula=aula-01` diretamente, sem vir do painel (sem `matricula_id`/`aula_id`/`#tok=`). Esperado: a atividade funciona normalmente do início ao fim; no console, nenhum erro — no máximo o aviso "Não foi possível sincronizar..." se você completar a aula sem esses parâmetros.
4. No painel, copie o link de uma aula, mas edite manualmente `matricula_id` na URL para um uuid aleatório antes de abrir. Complete a aula. Esperado: o console mostra o aviso de falha de sincronização (a RLS nega a escrita), e nenhuma linha nova aparece em `progresso` para esse uuid inventado.

## Já cobertos por observação direta durante o desenvolvimento

- 360px sem rolagem horizontal, em toda tela (inicial, cada tipo de bloco, diagnóstico).
- Navegação completa só por teclado (Tab, Enter, Espaço) em todos os tipos de bloco.
- Contraste das cores fixas (`--tinta` sobre `--papel`, `--papel` sobre `--verde` nos botões, `--verde` sobre `--verde-claro` no acerto, `--neutro` (600) sobre `--neutro-claro` no erro) — todas já conferidas em ~5,4:1 ou mais, acima do mínimo de 4,5:1 do WCAG AA para texto normal.
- Teclado numérico no iOS: abrir um campo `type="number"` num iPhone real ou simulador e confirmar que o teclado virtual não quebra o layout (nenhum elemento fica coberto ou cortado).
- `prefers-reduced-motion`: ativar essa preferência no sistema operacional e confirmar que a barra de progresso não anima a largura.
