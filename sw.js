// Service Worker para Envío Fácil PWA
// Versión: 1.0.0

const CACHE_NAME = "envio-facil-v1.0.0"
const OFFLINE_URL = "/offline.html"

// Archivos esenciales para cachear
const ESSENTIAL_FILES = [
  "/",
  "/index.html",
  "/pantalla2.html",
  "/styles.css",
  "/pantalla2.css",
  "/app.js",
  "/pantalla2.js",
  "/theme-toggle.js",
  "/manifest.json",
  "/offline.html",
  "/images/ef.png",
]

// Archivos de iconos
const ICON_FILES = [
  "/icons/icon-72x72.png",
  "/icons/icon-96x96.png",
  "/icons/icon-128x128.png",
  "/icons/icon-144x144.png",
  "/icons/icon-152x152.png",
  "/icons/icon-192x192.png",
  "/icons/icon-384x384.png",
  "/icons/icon-512x512.png",
]

// URLs externas críticas
const EXTERNAL_RESOURCES = [
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
  "https://accounts.google.com/gsi/client",
  "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
]

const ALL_CACHE_FILES = [...ESSENTIAL_FILES, ...ICON_FILES]

// Instalación del Service Worker
self.addEventListener("install", (event) => {
  console.log("🔧 Service Worker: Instalando...")

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("📦 Service Worker: Cacheando archivos esenciales")
        return cache.addAll(ALL_CACHE_FILES)
      })
      .then(() => {
        console.log("✅ Service Worker: Instalación completada")
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error("❌ Service Worker: Error en instalación:", error)
      }),
  )
})

// Activación del Service Worker
self.addEventListener("activate", (event) => {
  console.log("🚀 Service Worker: Activando...")

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("🗑️ Service Worker: Eliminando cache antiguo:", cacheName)
              return caches.delete(cacheName)
            }
          }),
        )
      })
      .then(() => {
        console.log("✅ Service Worker: Activación completada")
        return self.clients.claim()
      }),
  )
})

// Estrategia de fetch
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Solo manejar requests HTTP/HTTPS
  if (!request.url.startsWith("http")) {
    return
  }

  // Estrategia especial para recursos externos críticos
  if (EXTERNAL_RESOURCES.some((resource) => request.url.includes(resource))) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Si la respuesta es exitosa, cachearla
          if (response.status === 200) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          // Si falla, intentar desde cache
          return caches.match(request)
        }),
    )
    return
  }

  // Estrategia Cache First para archivos estáticos
  if (
    request.method === "GET" &&
    (request.url.includes(".css") ||
      request.url.includes(".js") ||
      request.url.includes(".png") ||
      request.url.includes(".jpg") ||
      request.url.includes(".jpeg") ||
      request.url.includes(".svg") ||
      request.url.includes(".ico"))
  ) {
    event.respondWith(
      caches
        .match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse
          }

          return fetch(request).then((response) => {
            if (response.status === 200) {
              const responseClone = response.clone()
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone)
              })
            }
            return response
          })
        })
        .catch(() => {
          console.log("📱 Service Worker: Recurso no disponible offline:", request.url)
        }),
    )
    return
  }

  // Estrategia Network First para páginas HTML
  if (request.method === "GET" && request.headers.get("accept").includes("text/html")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cachear páginas exitosas
          if (response.status === 200) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          // Si falla la red, intentar desde cache
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse
            }
            // Si no hay cache, mostrar página offline
            return caches.match(OFFLINE_URL)
          })
        }),
    )
    return
  }

  // Para APIs y otros requests, intentar red primero
  if (request.method === "GET") {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match(request)
      }),
    )
  }
})

// Manejo de mensajes desde la aplicación
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }

  if (event.data && event.data.type === "GET_VERSION") {
    event.ports[0].postMessage({ version: CACHE_NAME })
  }
})

// Sincronización en segundo plano (para futuras funcionalidades)
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    console.log("🔄 Service Worker: Sincronización en segundo plano")
    // Aquí se pueden implementar tareas de sincronización
  }
})

// Notificaciones push (para futuras funcionalidades)
self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-72x72.png",
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey,
      },
      actions: [
        {
          action: "explore",
          title: "Abrir aplicación",
          icon: "/icons/icon-96x96.png",
        },
        {
          action: "close",
          title: "Cerrar",
          icon: "/icons/icon-96x96.png",
        },
      ],
    }

    event.waitUntil(self.registration.showNotification(data.title, options))
  }
})

// Manejo de clics en notificaciones
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  if (event.action === "explore") {
    event.waitUntil(clients.openWindow("/"))
  }
})
