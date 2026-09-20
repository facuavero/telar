// Puente mínimo entre la app web y el escritorio. Se expande cuando haga falta
// (notificaciones nativas, autoarranque, deep links).
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('telarDesktop', {
  version: process.versions.electron,
  plataforma: process.platform
});
