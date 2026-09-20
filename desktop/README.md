# Telar · escritorio

Ventana de Electron que carga la app web. No duplica nada del producto: la UI
es la misma de `diseno/app/`.

## Correr en desarrollo

```bash
# 1) servir la web (desde la raíz del repo)
python -m http.server 5173 --directory diseno

# 2) en otra terminal
cd desktop
npm install
npm run dev          # abre http://localhost:5173/app/
```

Sin `TELAR_URL`, `npm start` carga producción (`https://telar.app/app/`).

## Instaladores

```bash
npm run dist:mac     # .dmg  (hay que correrlo en una Mac)
npm run dist:win     # .exe  (NSIS)
npm run dist         # lo que corresponda al sistema actual
```

Firmar la app (notarización en macOS, certificado en Windows) queda pendiente:
sin eso, el instalador tira advertencia al abrirse.

## OAuth desde el escritorio

Conectar Gmail abre `accounts.google.com` en el navegador del sistema (Electron
manda afuera todo lo que no sea del dominio de la app, y Google además bloquea
el login dentro de webviews embebidas). El permiso queda guardado del lado del
worker, así que cuando volvés a la ventana de Telar alcanza con el botón de
refrescar para verla conectada.
