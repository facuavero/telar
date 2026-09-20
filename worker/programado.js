// Telar · disparador "programado". El detalle lo escribe una persona, así que
// aceptamos castellano suelto ("cada lunes 9:00") y también cron de 5 campos.
// Castellano → se interpreta en hora de Argentina. Cron crudo → UTC.

const ZONA = 'America/Argentina/Buenos_Aires';
const DIAS = { domingo: 0, lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6 };

const sinTildes = t => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

// ---- texto → spec ----
// spec: { min, hora, dia, dow, zona } donde cada campo es null (= cualquiera)
// o una lista de números.

export function interpretar(detalle) {
  const t = sinTildes(detalle);
  if (!t) return { spec: campos('0', '*', '*', '*'), zona: ZONA, texto: 'cada hora en punto' };

  // cron de 5 campos: min hora dia mes dow
  const partes = t.split(/\s+/);
  if (partes.length === 5 && partes.every(p => /^[\d*/,\-]+$/.test(p))) {
    return { spec: campos(partes[0], partes[1], partes[2], partes[4]), zona: 'UTC', texto: t + ' (UTC)' };
  }

  let m;
  if ((m = t.match(/cada\s+(\d+)\s*min/))) {
    const n = Math.max(1, Math.min(59, Number(m[1])));
    return { spec: campos('*/' + n, '*', '*', '*'), zona: ZONA, texto: `cada ${n} minutos` };
  }
  if ((m = t.match(/cada\s+(\d+)\s*h/))) {
    const n = Math.max(1, Math.min(23, Number(m[1])));
    return { spec: campos('0', '*/' + n, '*', '*'), zona: ZONA, texto: `cada ${n} horas` };
  }
  if (/cada\s+hora|por\s+hora/.test(t)) {
    return { spec: campos('0', '*', '*', '*'), zona: ZONA, texto: 'cada hora en punto' };
  }

  const reloj = t.match(/(\d{1,2})[:.](\d{2})/);
  const hora = reloj ? Number(reloj[1]) : 9;
  const min = reloj ? Number(reloj[2]) : 0;

  for (const [nombre, n] of Object.entries(DIAS)) {
    if (new RegExp(nombre + 's?\\b').test(t)) {
      return { spec: campos(String(min), String(hora), '*', String(n)), zona: ZONA,
               texto: `cada ${nombre} a las ${dosDigitos(hora)}:${dosDigitos(min)}` };
    }
  }
  if (/dia|diario|jornada/.test(t)) {
    return { spec: campos(String(min), String(hora), '*', '*'), zona: ZONA,
             texto: `todos los días a las ${dosDigitos(hora)}:${dosDigitos(min)}` };
  }
  if ((m = t.match(/(\d{1,2})\s+de\s+cada\s+mes/))) {
    return { spec: campos(String(min), String(hora), m[1], '*'), zona: ZONA,
             texto: `el ${m[1]} de cada mes a las ${dosDigitos(hora)}:${dosDigitos(min)}` };
  }
  if (reloj) {
    return { spec: campos(String(min), String(hora), '*', '*'), zona: ZONA,
             texto: `todos los días a las ${dosDigitos(hora)}:${dosDigitos(min)}` };
  }
  // No lo entendimos: cada hora, y que se vea en la corrida.
  return { spec: campos('0', '*', '*', '*'), zona: ZONA, texto: 'cada hora en punto (no entendí el detalle)' };
}

const dosDigitos = n => String(n).padStart(2, '0');

function campos(min, hora, dia, dow) {
  return { min: lista(min, 0, 59), hora: lista(hora, 0, 23), dia: lista(dia, 1, 31), dow: lista(dow, 0, 6) };
}

function lista(campo, desde, hasta) {
  if (campo === '*') return null;
  const out = new Set();
  for (const trozo of campo.split(',')) {
    const paso = trozo.match(/^(.+)\/(\d+)$/);
    const cuerpo = paso ? paso[1] : trozo;
    const salto = paso ? Number(paso[2]) : 1;
    let a = desde, b = hasta;
    if (cuerpo !== '*') {
      const rango = cuerpo.match(/^(\d+)-(\d+)$/);
      if (rango) { a = Number(rango[1]); b = Number(rango[2]); }
      else { a = b = Number(cuerpo); }
    }
    for (let i = a; i <= b; i += salto) if (i >= desde && i <= hasta) out.add(i);
  }
  return out.size ? [...out] : null;
}

// ---- ¿toca ahora? ----

function partes(fecha, zona) {
  const f = new Intl.DateTimeFormat('en-GB', {
    timeZone: zona, hour12: false,
    minute: '2-digit', hour: '2-digit', day: '2-digit', weekday: 'short'
  }).formatToParts(fecha);
  const g = tipo => f.find(p => p.type === tipo)?.value;
  const semana = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return { min: Number(g('minute')), hora: Number(g('hour')), dia: Number(g('day')), dow: semana[g('weekday')] };
}

function coincide(spec, fecha, zona) {
  const p = partes(fecha, zona);
  const ok = (lista, valor) => !lista || lista.includes(valor);
  return ok(spec.min, p.min) && ok(spec.hora, p.hora) && ok(spec.dia, p.dia) && ok(spec.dow, p.dow);
}

// Devuelve el último minuto que correspondía, si quedó sin correr. null = no toca.
// Sin corridas previas mira una hora para atrás; así una automatización recién
// activada no dispara todos los horarios perdidos de la semana.
export function toca(detalle, ultimaCorrida, ahora = new Date()) {
  const { spec, zona, texto } = interpretar(detalle);
  const piso = ultimaCorrida
    ? new Date(ultimaCorrida).getTime()
    : ahora.getTime() - 60 * 60 * 1000;
  const tope = Math.max(piso, ahora.getTime() - 24 * 60 * 60 * 1000);

  let t = Math.floor(ahora.getTime() / 60000) * 60000;
  while (t > tope) {
    if (coincide(spec, new Date(t), zona)) return { cuando: new Date(t).toISOString(), texto };
    t -= 60000;
  }
  return null;
}

// Para mostrarle al usuario cuándo sería la próxima.
export function proxima(detalle, ahora = new Date()) {
  const { spec, zona, texto } = interpretar(detalle);
  let t = Math.floor(ahora.getTime() / 60000) * 60000 + 60000;
  const limite = t + 40 * 24 * 60 * 60 * 1000;
  while (t < limite) {
    if (coincide(spec, new Date(t), zona)) return { cuando: new Date(t).toISOString(), texto };
    t += 60000;
  }
  return { cuando: null, texto };
}
