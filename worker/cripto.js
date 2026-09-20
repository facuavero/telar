// Telar · firmas y cifrado del worker. Todo con WebCrypto, sin dependencias.

const txt = new TextEncoder();

export function base64url(bytes) {
  let s = '';
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function deBase64url(s) {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// ---- firma (HMAC-SHA256) ----
// Se usa para el token del webhook y para el "state" del OAuth: así no hace
// falta guardar nada en la base para validar que algo lo emitimos nosotros.

async function claveHmac(secreto) {
  return crypto.subtle.importKey('raw', txt.encode(secreto), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function firmar(secreto, mensaje) {
  const k = await claveHmac(secreto);
  return base64url(await crypto.subtle.sign('HMAC', k, txt.encode(mensaje)));
}

export async function firmaValida(secreto, mensaje, firma) {
  const k = await claveHmac(secreto);
  try {
    return await crypto.subtle.verify('HMAC', k, deBase64url(firma), txt.encode(mensaje));
  } catch {
    return false;
  }
}

// Sobre firmado: {datos} + vencimiento. Devuelve "payload.firma".
export async function sellar(secreto, datos, segundos = 600) {
  const cuerpo = base64url(txt.encode(JSON.stringify({ ...datos, vence: Date.now() + segundos * 1000 })));
  return cuerpo + '.' + (await firmar(secreto, cuerpo));
}

export async function abrirSello(secreto, sello) {
  const [cuerpo, firma] = String(sello || '').split('.');
  if (!cuerpo || !firma) return null;
  if (!(await firmaValida(secreto, cuerpo, firma))) return null;
  let datos;
  try { datos = JSON.parse(new TextDecoder().decode(deBase64url(cuerpo))); } catch { return null; }
  if (!datos.vence || datos.vence < Date.now()) return null;
  return datos;
}

// ---- cifrado (AES-GCM 256) ----
// Los refresh tokens se guardan cifrados: la clave vive solo en el worker,
// así la fila de conexiones no sirve de nada sin él.

async function claveAes(secretoB64) {
  const bruta = deBase64url(secretoB64.replace(/\+/g, '-').replace(/\//g, '_'));
  if (bruta.length !== 32) throw new Error('CLAVE_CIFRADO tiene que ser 32 bytes en base64.');
  return crypto.subtle.importKey('raw', bruta, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

export async function cifrar(secretoB64, texto) {
  const k = await claveAes(secretoB64);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const dato = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, k, txt.encode(texto));
  return { v: 1, iv: base64url(iv), dato: base64url(dato) };
}

export async function descifrar(secretoB64, sobre) {
  if (!sobre || !sobre.iv || !sobre.dato) return null;
  const k = await claveAes(secretoB64);
  const abierto = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: deBase64url(sobre.iv) }, k, deBase64url(sobre.dato));
  return new TextDecoder().decode(abierto);
}
