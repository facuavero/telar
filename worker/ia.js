// Telar · paso de IA. API de Gemini por HTTP directo: el repo no tiene build
// step ni dependencias, así que no entra el SDK.

const MODELO = 'gemini-3.5-flash-lite';

const SISTEMA = [
  'Sos un paso dentro de una automatización de Telar.',
  'Respondés en español rioplatense, directo y sin preámbulos.',
  'Devolvés solo el resultado del paso: nada de "acá tenés" ni explicaciones de lo que vas a hacer.',
  'Si te falta un dato para resolverlo, decilo en una línea que empiece con "FALTA:".'
].join(' ');

export async function pedirle(env, { instruccion, contexto }) {
  if (!env.CLAVE_GEMINI) {
    throw new Error('Falta el secreto CLAVE_GEMINI en el worker (clave de Google AI Studio).');
  }

  const modelo = env.MODELO_IA || MODELO;
  const cuerpo = {
    systemInstruction: { parts: [{ text: SISTEMA }] },
    contents: [{ role: 'user', parts: [{ text: mensaje(instruccion, contexto) }] }],
    generationConfig: { maxOutputTokens: 8192 }
  };

  const base = env.IA_BASE_URL || 'https://generativelanguage.googleapis.com';
  const url = `${base}/v1beta/models/${encodeURIComponent(modelo)}:generateContent`;
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-goog-api-key': env.CLAVE_GEMINI
    },
    body: JSON.stringify(cuerpo)
  });

  const datos = await r.json().catch(() => null);
  if (!r.ok) {
    const detalle = datos?.error?.message || ('HTTP ' + r.status);
    if (r.status === 400 || r.status === 401 || r.status === 403) throw new Error('La clave o configuración de Gemini no sirve: ' + detalle);
    if (r.status === 429) throw new Error('Gemini alcanzó el límite gratuito, probá de nuevo más tarde: ' + detalle);
    if (r.status >= 500) throw new Error('Gemini no está respondiendo: ' + detalle);
    throw new Error('Gemini rechazó el pedido: ' + detalle);
  }

  const candidato = datos?.candidates?.[0];
  const texto = (candidato?.content?.parts || [])
    .map(parte => parte.text || '')
    .join('\n')
    .trim();

  if (!texto) {
    const motivo = candidato?.finishReason || datos?.promptFeedback?.blockReason;
    throw new Error('Gemini respondió vacío' + (motivo ? ` (${motivo}).` : '.'));
  }

  return {
    texto,
    tokens: datos?.usageMetadata?.candidatesTokenCount ?? null,
    modelo: datos?.modelVersion || modelo
  };
}

function mensaje(instruccion, contexto) {
  const datos = JSON.stringify(contexto, null, 2);
  return `Instrucción del paso:\n${instruccion}\n\n` +
    `Datos de la corrida (usalos si sirven, ignoralos si no):\n${datos}`;
}
