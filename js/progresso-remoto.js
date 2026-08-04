const SUPABASE_URL = 'https://tldmtouhyiglqszwxdmc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_dhQZyHqufAU9vfR2KLEkHQ_hdx5c5ki';

export function extrairParametrosDeSessao(search, hash) {
  const parametros = new URLSearchParams(search);
  const matriculaId = parametros.get('matricula_id');
  const aulaId = parametros.get('aula_id');
  const combinacao = /^#tok=(.+)$/.exec(hash || '');
  const token = combinacao ? decodeURIComponent(combinacao[1]) : null;
  if (!token || !matriculaId || !aulaId) return null;
  return { matriculaId, aulaId, token };
}

export function lerELimparParametrosDeSessao() {
  const sessao = extrairParametrosDeSessao(window.location.search, window.location.hash);
  if (sessao) {
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }
  return sessao;
}

export async function notificarConclusao(sessao, fetchImpl = fetch) {
  if (!sessao) return false;
  try {
    const resposta = await fetchImpl(`${SUPABASE_URL}/rest/v1/progresso?on_conflict=matricula_id,aula_id`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${sessao.token}`,
        Prefer: 'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify({
        matricula_id: sessao.matriculaId,
        aula_id: sessao.aulaId,
        concluida: true,
        concluida_em: new Date().toISOString()
      })
    });
    if (!resposta.ok) {
      console.warn(`Não foi possível sincronizar a conclusão da aula com o Supabase (status ${resposta.status}).`);
      return false;
    }
    return true;
  } catch (erro) {
    console.warn('Não foi possível sincronizar a conclusão da aula com o Supabase.', erro);
    return false;
  }
}
