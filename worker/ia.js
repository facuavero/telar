// Telar · paso de IA. Messages API de Anthropic por HTTP directo: el repo no
// tiene build step ni dependencias, así que no entra el SDK.

const MODELO = 'claude-opus-5';
const VERSION = '2023-06-01';
const BETA_FALLBACK = 'server-side-fallback-2026-07-01';

const SISTEMA = [
  'Sos un paso dentro de una automatización de Telar.',
  'Respondés en español rioplatense, directo y sin preámbulos.',
  'Devolvés solo el resultado del paso: nada de "acá tenés" ni explicaciones de lo que vas a hacer.',
  'Si te falta un dato para resolverlo, decilo en una línea que empiece con "FALTA:".'
].join(' ');

export async function pedirle(env, { instruccion, contexto }) {
  if (!env.CLAVE_IA) {
    throw new Error('Falta el secreto CLAVE_IA en el worker (clave de la API de Anthropic).');
  }

  const cuerpo = {
    model: env.MODELO_IA || MODELO,
    max_tokens: 16000,
    system: SISTEMA,
    messages: [{ role: 'user', content: mensaje(instruccion, contexto) }],
    // Si un clasificador rechaza el pedido, el servidor reintenta solo con otro
    // modelo en vez de devolver la corrida vacía.
    fallbacks: 'default'
  };

  const r = await fetch((env.IA_BASE_URL || 'https://api.anthropic.com') + '/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': env.CLAVE_IA,
      'anthropic-version': VERSION,
      'anthropic-beta': BETA_FALLBACK
    },
    body: JSON.stringify(cuerpo)
  });

  const datos = await r.json().catch(() => null);
  if (!r.ok) {
    const detalle = datos?.error?.message || ('HTTP ' + r.status);
    if (r.status === 401) throw new Error('La clave de la IA no sirve: ' + detalle);
    if (r.status === 429) throw new Error('La IA está limitando el uso, probá de nuevo: ' + detalle);
    if (r.status >= 500) throw new Error('La IA no está respondiendo: ' + detalle);
    throw new Error('La IA rechazó el pedido: ' + detalle);
  }

  if (datos?.stop_reason === 'refusal') {
    throw new Error('La IA se negó a responder este paso' +
      (datos.stop_details?.explanation ? ': ' + datos.stop_details.explanation : '.'));
  }

  const texto = (datos?.content || [])
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('\n')
    .trim();

  if (!texto) throw new Error('La IA respondió vacío.');
  return { texto, tokens: datos?.usage?.output_tokens ?? null, modelo: datos?.model || cuerpo.model };
}

function mensaje(instruccion, contexto) {
  const datos = JSON.stringify(contexto, null, 2);
  return `Instrucción del paso:\n${instruccion}\n\n` +
    `Datos de la corrida (usalos si sirven, ignoralos si no):\n${datos}`;
}
