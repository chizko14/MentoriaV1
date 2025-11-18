// sw.js - Versión de Limpieza
self.addEventListener('install', (e) => {
  self.skipWaiting(); // Obliga a este SW a activarse de inmediato
});

self.addEventListener('activate', (e) => {
  // Borra todas las cachés antiguas para evitar conflictos
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => caches.delete(key)));
    })
  );
  return self.clients.claim(); // Toma control de la página inmediatamente
});

// No interceptamos fetch para dejar pasar todo directo a la red
self.addEventListener('fetch', (e) => {
  return; 
});
