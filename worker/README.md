# Motor de Telar (worker de Cloudflare)

El mismo worker sirve el sitio estático de `/diseno` y expone la API en `/api/*`.
Las claves viven acá como secrets: al navegador nunca le llega nada más que la
anon key de Supabase.

```
worker/
  index.js       rutas + disparador programado
  motor.js       recorre los pasos y escribe la corrida
  ia.js          API de Gemini
  gmail.js       OAuth de Google y envío de mails
  programado.js  "cada lunes 9:00" → ¿toca ahora?
  cripto.js      HMAC (webhook, state) y AES-GCM (refresh tokens)
  supabase.js    PostgREST con token de usuario o service role
```

## Endpoints

| Ruta | Quién entra | Qué hace |
|---|---|---|
| `POST /api/ejecutar` | usuario con sesión | corre la automatización y devuelve la fila de `ejecuciones` |
| `POST /api/ejecuciones/:id/aprobar` | usuario con sesión | aprueba y continúa una corrida pausada |
| `GET /api/disparador` | usuario con sesión | URL del webhook y próxima corrida programada |
| `POST /api/webhook/:id/:firma` | cualquiera con la URL | dispara la automatización (tiene que estar `activa`) |
| `POST /api/oauth/gmail/iniciar` | usuario con sesión | devuelve la URL de consentimiento de Google |
| `GET /api/oauth/gmail/callback` | Google | guarda el permiso y vuelve a la app |
| `POST /api/oauth/slack/iniciar` | usuario con sesión | devuelve la URL de autorización de Slack |
| `GET /api/oauth/slack/callback` | Slack | guarda el bot token cifrado y vuelve a la app |
| `GET /api/salud` | cualquiera | qué está configurado y qué falta |

Autorización: el front manda el access token de Supabase y el worker lee la
automatización **con ese token**. Si RLS no la deja ver, no es tuya y corta ahí.
La service role key solo se usa para escribir la corrida y leer los tokens de
las integraciones.

## Secrets y variables

`vars` (en `wrangler.jsonc`, públicas): `SUPABASE_URL`, `SUPABASE_ANON_KEY`.

Secrets (`npx wrangler secret put NOMBRE`):

| Secret | Para qué | De dónde sale |
|---|---|---|
| `SUPABASE_SERVICE_ROLE` | escribir corridas y leer tokens | Supabase → Settings → API → `service_role` |
| `CLAVE_FIRMA` | firmar la URL del webhook y el state del OAuth | inventala: `openssl rand -base64 32` |
| `CLAVE_CIFRADO` | cifrar los refresh tokens (AES-GCM, 32 bytes) | `openssl rand -base64 32` |
| `CLAVE_GEMINI` | paso de IA | Google AI Studio → API keys |
| `GOOGLE_CLIENT_ID` | OAuth de Gmail | Google Cloud (abajo) |
| `GOOGLE_CLIENT_SECRET` | OAuth de Gmail | Google Cloud (abajo) |
| `SLACK_CLIENT_ID` | OAuth de Slack | Slack API → Basic Information |
| `SLACK_CLIENT_SECRET` | OAuth de Slack | Slack API → Basic Information |

Si cambiás `CLAVE_FIRMA` se caen las URLs de webhook que ya repartiste. Si
cambiás `CLAVE_CIFRADO`, hay que volver a conectar Gmail.

## Qué hay que crear en Google Cloud

1. Proyecto nuevo en <https://console.cloud.google.com> (o uno que ya tengas).
2. **APIs y servicios → Biblioteca → Gmail API → Habilitar.**
3. **Pantalla de consentimiento de OAuth**: tipo *Externo*, nombre de la app
   "Telar", mail de soporte, dominio `telar.app`, mail del desarrollador.
   Mientras esté en *Testing* solo entran las cuentas que agregues como
   usuarios de prueba (hasta 100), y el refresh token se vence a los 7 días.
   Para que dure, hay que publicar la app.
4. **Permisos (scopes)**: `openid`, `email` y
   `https://www.googleapis.com/auth/gmail.send` y
   `https://www.googleapis.com/auth/gmail.readonly`. Son scopes
   sensible: si publicás, Google pide verificación.
5. **Credenciales → Crear credenciales → ID de cliente de OAuth → Aplicación web.**
   - URI de redireccionamiento autorizado: `https://telar.app/api/oauth/gmail/callback`
     (agregá también el dominio de `*.workers.dev` si probás ahí, y
     `http://localhost:8787/api/oauth/gmail/callback` para local).
   - No hace falta cargar orígenes de JavaScript autorizados.
6. Copiá el **Client ID** y el **Client secret** a los secrets de arriba.

Si Gmail estaba conectado antes de agregar el disparador por correo entrante,
hay que reconectarlo una vez para aceptar `gmail.readonly`.

## Deploy

```bash
npx wrangler deploy
```

El cron (`*/5 * * * *`) queda configurado en `wrangler.jsonc`: cada 5 minutos el
worker se fija qué automatización `activa` con disparador programado le toca.
Por eso una corrida puede salir hasta 5 minutos después de la hora pedida.
En el mismo cron, Gmail consulta `history.list` desde el último cursor guardado
en la conexión y dispara las automatizaciones de tipo `email` por cada correo
nuevo en la bandeja de entrada.

## Los pasos, en criollo

- **Avisar** — el texto queda en la corrida. Si hay una URL, le manda un POST.
- **Condición** — `{{pasos.1.salida}} contiene error`. Operadores: `contiene`,
  `no contiene`, `empieza con`, `termina con`, `==`, `!=`, `>`, `<`, `>=`, `<=`.
  Si no se cumple, corta ahí y el resto queda `omitido`.
- **Pedirle algo a la IA** — la instrucción va tal cual a Gemini, con el
  contexto de la corrida.
- **Acción** — Gmail: `gmail a alguien@dominio.com | asunto | cuerpo`; o Slack:
  `slack #canal | mensaje`. El resto de las herramientas queda `omitido` con el
  motivo, no simulado.
- **Esperar aprobación** — corta la corrida en `esperando_aprobacion`. Se aprueba
  desde el detalle de la corrida en Actividad y continúa por el paso siguiente.

En cualquier texto podés meter `{{disparador.entrada.loQueSea}}`,
`{{pasos.N.salida}}`, `{{automatizacion.nombre}}` y `{{ahora}}`.
