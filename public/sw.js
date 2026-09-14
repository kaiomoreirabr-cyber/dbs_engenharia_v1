// Service worker simples: cacheia os arquivos estáticos do próprio app
// (HTML, JS, CSS, ícones) para abrir mais rápido quando instalado na tela
// inicial. NUNCA cacheia chamadas ao Supabase (dados sempre vêm da rede,
// para não mostrar frequência desatualizada).
const CACHE_NAME = "obra-frequencia-shell-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Só cacheia requisições GET do próprio domínio (app shell). Chamadas para
  // Supabase (outro domínio) e requisições que não sejam GET passam direto.
  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);
      const network = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            cache.put(request, response.clone());
          }
          return response;
        })
        .catch(() => cached);
      // stale-while-revalidate: responde rápido com o cache (se existir) e
      // atualiza em segundo plano.
      return cached || network;
    })
  );
});
