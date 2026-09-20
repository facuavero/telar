// Telar · motor de ejecución. Recorre los pasos de una automatización y deja
// el resultado de cada uno en la fila de ejecuciones.
//
// Tipos que ya corren de verdad: aviso, condicion, ia y acción de Gmail.
// El resto queda marcado como "omitido" con el motivo, no simulado.

import { db } from './supabase.js';
import { pedirle } from './ia.js';
import * as gmail from './gmail.js';

const ahora = () => new Date().toISOString();

// ---------- plantillas: {{ruta.al.dato}} ----------

function buscar(ctx, ruta) {
  return ruta.split('.').reduce((v, k) => (v == null ? v : v[k]), ctx);
}

export function resolver(texto, ctx) {
  return String(texto ?? '').replace(/\{\{\s*([\w.$-]+)\s*\}\}/g, (todo, ruta) => {
    const v = buscar(ctx, ruta);
    if (v == null) return '';
    return typeof v === 'object' ? JSON.stringify(v) : String(v);
  });
}

// ---------- condiciones ----------

const OPERADORES = [
  ['no contiene', (a, b) => !a.toLowerCase().includes(b.toLowerCase())],
  ['contiene', (a, b) => a.toLowerCase().includes(b.toLowerCase())],
  ['empieza con', (a, b) => a.toLowerCase().startsWith(b.toLowerCase())],
  ['termina con', (a, b) => a.toLowerCase().endsWith(b.toLowerCase())],
  ['!=', (a, b) => a.trim() !== b.trim()],
  ['>=', (a, b) => Number(a) >= Number(b)],
  ['<=', (a, b) => Number(a) <= Number(b)],
  ['==', (a, b) => a.trim() === b.trim()],
  ['=', (a, b) => a.trim() === b.trim()],
  ['>', (a, b) => Number(a) > Number(b)],
  ['<', (a, b) => Number(a) < Number(b)]
];

const FALSOS = ['', 'no', 'false', '0', 'null', 'undefined', 'vacio', 'vacío'];

export function evaluar(expresion, ctx) {
  const crudo = String(expresion || '').trim();
  if (!crudo) return { vale: false, leida: '(condición vacía)' };

  for (const [simbolo, prueba] of OPERADORES) {
    const i = crudo.indexOf(simbolo);
    if (i <= 0) continue;
    const izq = resolver(crudo.slice(0, i), ctx).trim();
    const der = resolver(crudo.slice(i + simbolo.length), ctx).trim();
    return { vale: !!prueba(izq, der), leida: `"${izq}" ${simbolo} "${der}"` };
  }

  const valor = resolver(crudo, ctx).trim();
  return { vale: !FALSOS.includes(valor.toLowerCase()), leida: `"${valor}" tiene contenido` };
}

// ---------- pasos ----------

const URL_EN = t => (String(t || '').match(/https?:\/\/[^\s"'<>]+/) || [null])[0];

async function correrAviso(env, paso, ctx) {
  const texto = resolver(paso.detalle, ctx);
  const destino = URL_EN(texto);
  if (!destino) return { estado: 'ok', salida: texto };

  const r = await fetch(destino, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ texto: texto.replace(destino, '').trim() || texto, automatizacion: ctx.automatizacion, en: ahora() })
  });
  if (!r.ok) return { estado: 'error', salida: `El aviso a ${destino} devolvió HTTP ${r.status}.` };
  return { estado: 'ok', salida: `Aviso enviado a ${destino} (HTTP ${r.status}).` };
}

function parsearMail(texto) {
  const para = (texto.match(/[\w.+-]+@[\w-]+\.[\w.-]+/) || [null])[0];
  if (!para) return null;
  const partes = texto.split('|');
  const asunto = (partes[1] || '').trim() || 'Aviso de Telar';
  const cuerpo = partes.slice(2).join('|').trim() || asunto;
  return { para, asunto, cuerpo };
}

async function correrAccion(env, paso, ctx) {
  const texto = resolver(paso.detalle, ctx);
  if (!/^\s*(gmail|mail|correo)\b/i.test(texto)) {
    return { estado: 'omitido', nota: 'Solo Gmail está conectado. Escribí el paso como: gmail a alguien@dominio.com | asunto | cuerpo.' };
  }
  const mail = parsearMail(texto);
  if (!mail) return { estado: 'error', salida: 'No encontré a quién mandarle el mail. Formato: gmail a alguien@dominio.com | asunto | cuerpo.' };

  const enviado = await gmail.enviar(env, ctx.workspace_id, mail);
  return { estado: 'ok', salida: `Mail enviado a ${enviado.para} desde ${enviado.cuenta}.` };
}

async function correrIa(env, paso, ctx) {
  const instruccion = resolver(paso.detalle, ctx);
  if (!instruccion.trim()) return { estado: 'error', salida: 'El paso de IA no dice qué pedirle.' };
  const r = await pedirle(env, {
    instruccion,
    contexto: { disparador: ctx.disparador, pasos: ctx.pasos, ahora: ctx.ahora }
  });
  return { estado: 'ok', salida: r.texto, modelo: r.modelo };
}

// ---------- corrida completa ----------

export async function ejecutar(env, automatizacion, disparador) {
  const ws = automatizacion.workspace_id;
  const definicion = automatizacion.definicion || {};
  const pasos = Array.isArray(definicion.pasos) ? definicion.pasos : [];

  const ctx = {
    ahora: ahora(),
    workspace_id: ws,
    automatizacion: { id: automatizacion.id, nombre: automatizacion.nombre, descripcion: automatizacion.descripcion },
    disparador: { tipo: disparador?.tipo || 'manual', detalle: disparador?.detalle || null, entrada: disparador?.entrada ?? null },
    pasos: {}
  };

  const fila = await db.insertar(env, 'ejecuciones', {
    workspace_id: ws,
    automatizacion_id: automatizacion.id,
    estado: 'corriendo',
    pasos: []
  });

  if (!pasos.length) {
    return db.actualizar(env, 'ejecuciones', `id=eq.${fila.id}`, {
      estado: 'error', error: 'La automatización no tiene pasos.', terminada_en: ahora(), pasos: []
    });
  }

  const registro = [];
  let estadoFinal = 'ok';
  let error = null;
  let cortada = false;

  for (let i = 0; i < pasos.length; i++) {
    const paso = pasos[i] || {};
    const base = { n: i + 1, tipo: paso.tipo || 'accion', detalle: paso.detalle || '', en: ahora() };

    if (cortada) { registro.push({ ...base, estado: 'omitido', nota: 'No se llegó a este paso.' }); continue; }

    try {
      let r;
      switch (base.tipo) {
        case 'aviso': r = await correrAviso(env, paso, ctx); break;
        case 'ia': r = await correrIa(env, paso, ctx); break;
        case 'accion': r = await correrAccion(env, paso, ctx); break;
        case 'condicion': {
          const { vale, leida } = evaluar(paso.detalle, ctx);
          r = vale
            ? { estado: 'ok', salida: 'Se cumple: ' + leida }
            : { estado: 'corto', salida: 'No se cumple: ' + leida };
          if (!vale) cortada = true;
          break;
        }
        case 'aprobacion':
          r = { estado: 'esperando', nota: resolver(paso.detalle, ctx) || 'Esperando que alguien apruebe.' };
          cortada = true;
          estadoFinal = 'esperando_aprobacion';
          break;
        default:
          r = { estado: 'omitido', nota: `Tipo de paso desconocido: ${base.tipo}.` };
      }
      registro.push({ ...base, ...r });
      ctx.pasos[String(i + 1)] = { tipo: base.tipo, detalle: base.detalle, salida: r.salida ?? null, estado: r.estado };
      if (r.estado === 'error') { estadoFinal = 'error'; error = r.salida || 'Falló el paso ' + (i + 1); cortada = true; }
    } catch (e) {
      const mensaje = e?.message || String(e);
      registro.push({ ...base, estado: 'error', salida: mensaje });
      ctx.pasos[String(i + 1)] = { tipo: base.tipo, detalle: base.detalle, salida: mensaje, estado: 'error' };
      estadoFinal = 'error';
      error = `Paso ${i + 1} (${base.tipo}): ${mensaje}`;
      cortada = true;
    }
  }

  return db.actualizar(env, 'ejecuciones', `id=eq.${fila.id}`, {
    estado: estadoFinal,
    error,
    terminada_en: estadoFinal === 'esperando_aprobacion' ? null : ahora(),
    pasos: registro
  });
}
