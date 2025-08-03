// Script para manejo de instalación PWA
;(() => {
  let deferredPrompt
  let installButton
  let gtag // Declare the gtag variable

  // Función para crear el botón de instalación
  function createInstallButton() {
    const container = document.createElement("div")
    container.className = "pwa-install-container"
    container.innerHTML = `
      <div class="pwa-install-banner">
        <div class="pwa-install-content">
          <div class="pwa-install-icon">📱</div>
          <div class="pwa-install-text">
            <h3>Instalar Envío Fácil</h3>
            <p>Accede más rápido desde tu pantalla de inicio</p>
          </div>
        </div>
        <div class="pwa-install-actions">
          <button id="pwa-install-btn" class="pwa-install-button">
            Instalar
          </button>
          <button id="pwa-dismiss-btn" class="pwa-dismiss-button">
            ✕
          </button>
        </div>
      </div>
    `

    // Estilos para el banner de instalación
    const styles = `
      <style>
        .pwa-install-container {
          position: fixed;
          bottom: 20px;
          left: 20px;
          right: 20px;
          z-index: 9999;
          animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .pwa-install-banner {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 16px;
          padding: 16px 20px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          display: flex;
          align-items: center;
          justify-content: space-between;
          backdrop-filter: blur(10px);
        }

        .pwa-install-content {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }

        .pwa-install-icon {
          font-size: 2rem;
        }

        .pwa-install-text h3 {
          margin: 0 0 4px 0;
          font-size: 1.125rem;
          font-weight: 600;
        }

        .pwa-install-text p {
          margin: 0;
          font-size: 0.9rem;
          opacity: 0.9;
        }

        .pwa-install-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .pwa-install-button {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 12px;
          padding: 8px 16px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          backdrop-filter: blur(10px);
        }

        .pwa-install-button:active {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(1px);
        }

        .pwa-dismiss-button {
          background: none;
          color: white;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          padding: 4px;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .pwa-dismiss-button:active {
          background: rgba(255, 255, 255, 0.2);
        }

        @media (max-width: 480px) {
          .pwa-install-container {
            left: 12px;
            right: 12px;
            bottom: 12px;
          }

          .pwa-install-banner {
            padding: 12px 16px;
          }

          .pwa-install-text h3 {
            font-size: 1rem;
          }

          .pwa-install-text p {
            font-size: 0.85rem;
          }

          .pwa-install-button {
            padding: 6px 12px;
            font-size: 0.85rem;
          }
        }
      </style>
    `

    document.head.insertAdjacentHTML("beforeend", styles)
    document.body.appendChild(container)

    installButton = document.getElementById("pwa-install-btn")
    const dismissButton = document.getElementById("pwa-dismiss-btn")

    // Event listeners
    installButton.addEventListener("click", installPWA)
    dismissButton.addEventListener("click", dismissInstallPrompt)

    return container
  }

  // Función para instalar la PWA
  async function installPWA() {
    if (!deferredPrompt) return

    // Mostrar el prompt de instalación
    deferredPrompt.prompt()

    // Esperar la respuesta del usuario
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === "accepted") {
      console.log("✅ PWA: Usuario aceptó la instalación")

      // Mostrar mensaje de éxito
      showInstallSuccess()
    } else {
      console.log("❌ PWA: Usuario rechazó la instalación")
    }

    // Limpiar el prompt
    deferredPrompt = null
    hideInstallPrompt()
  }

  // Función para mostrar mensaje de éxito
  function showInstallSuccess() {
    const successBanner = document.createElement("div")
    successBanner.className = "pwa-success-banner"
    successBanner.innerHTML = `
      <div class="pwa-success-content">
        <div class="pwa-success-icon">✅</div>
        <div class="pwa-success-text">
          <h3>¡Instalación Exitosa!</h3>
          <p>Envío Fácil se ha añadido a tu pantalla de inicio</p>
        </div>
      </div>
    `

    const successStyles = `
      <style>
        .pwa-success-banner {
          position: fixed;
          top: 20px;
          left: 20px;
          right: 20px;
          z-index: 10000;
          background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
          color: white;
          border-radius: 16px;
          padding: 16px 20px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          animation: slideDown 0.3s ease-out;
        }

        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .pwa-success-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .pwa-success-icon {
          font-size: 2rem;
        }

        .pwa-success-text h3 {
          margin: 0 0 4px 0;
          font-size: 1.125rem;
          font-weight: 600;
        }

        .pwa-success-text p {
          margin: 0;
          font-size: 0.9rem;
          opacity: 0.9;
        }
      </style>
    `

    document.head.insertAdjacentHTML("beforeend", successStyles)
    document.body.appendChild(successBanner)

    // Remover después de 4 segundos
    setTimeout(() => {
      successBanner.remove()
    }, 4000)
  }

  // Función para ocultar el prompt de instalación
  function dismissInstallPrompt() {
    hideInstallPrompt()

    // Guardar que el usuario rechazó la instalación
    localStorage.setItem("pwa-install-dismissed", Date.now().toString())
  }

  // Función para ocultar el banner
  function hideInstallPrompt() {
    const container = document.querySelector(".pwa-install-container")
    if (container) {
      container.style.animation = "slideDown 0.3s ease-out reverse"
      setTimeout(() => {
        container.remove()
      }, 300)
    }
  }

  // Verificar si debe mostrar el prompt
  function shouldShowInstallPrompt() {
    // No mostrar si ya está instalado
    if (window.matchMedia("(display-mode: standalone)").matches) {
      return false
    }

    // No mostrar si fue rechazado recientemente (24 horas)
    const dismissed = localStorage.getItem("pwa-install-dismissed")
    if (dismissed) {
      const dismissedTime = Number.parseInt(dismissed)
      const now = Date.now()
      const hoursSinceDismissed = (now - dismissedTime) / (1000 * 60 * 60)

      if (hoursSinceDismissed < 24) {
        return false
      }
    }

    return true
  }

  // Event listener para el evento beforeinstallprompt
  window.addEventListener("beforeinstallprompt", (e) => {
    console.log("📱 PWA: Prompt de instalación disponible")

    // Prevenir que Chrome muestre su propio banner
    e.preventDefault()

    // Guardar el evento para usarlo después
    deferredPrompt = e

    // Mostrar nuestro banner personalizado si es apropiado
    if (shouldShowInstallPrompt()) {
      setTimeout(() => {
        createInstallButton()
      }, 2000) // Esperar 2 segundos antes de mostrar
    }
  })

  // Detectar cuando la app se instala
  window.addEventListener("appinstalled", (e) => {
    console.log("✅ PWA: Aplicación instalada exitosamente")

    // Limpiar el prompt diferido
    deferredPrompt = null

    // Ocultar el banner si está visible
    hideInstallPrompt()

    // Opcional: Enviar analytics
    if (typeof gtag !== "undefined") {
      gtag("event", "pwa_install", {
        event_category: "PWA",
        event_label: "App Installed",
      })
    }
  })

  // Detectar si la app ya está instalada
  if (window.matchMedia("(display-mode: standalone)").matches) {
    console.log("📱 PWA: Aplicación ejecutándose en modo standalone")

    // Añadir clase CSS para estilos específicos de PWA
    document.documentElement.classList.add("pwa-installed")
  }

  // Manejar actualizaciones del Service Worker
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      console.log("🔄 PWA: Service Worker actualizado")

      // Mostrar notificación de actualización
      showUpdateNotification()
    })
  }

  // Función para mostrar notificación de actualización
  function showUpdateNotification() {
    const updateBanner = document.createElement("div")
    updateBanner.className = "pwa-update-banner"
    updateBanner.innerHTML = `
      <div class="pwa-update-content">
        <div class="pwa-update-icon">🔄</div>
        <div class="pwa-update-text">
          <h3>Actualización Disponible</h3>
          <p>Nueva versión de Envío Fácil disponible</p>
        </div>
        <button id="pwa-update-btn" class="pwa-update-button">
          Actualizar
        </button>
      </div>
    `

    const updateStyles = `
      <style>
        .pwa-update-banner {
          position: fixed;
          top: 20px;
          left: 20px;
          right: 20px;
          z-index: 10000;
          background: linear-gradient(135deg, #ed8936 0%, #c05621 100%);
          color: white;
          border-radius: 16px;
          padding: 16px 20px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          animation: slideDown 0.3s ease-out;
        }

        .pwa-update-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .pwa-update-icon {
          font-size: 1.5rem;
        }

        .pwa-update-text {
          flex: 1;
        }

        .pwa-update-text h3 {
          margin: 0 0 4px 0;
          font-size: 1rem;
          font-weight: 600;
        }

        .pwa-update-text p {
          margin: 0;
          font-size: 0.85rem;
          opacity: 0.9;
        }

        .pwa-update-button {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          padding: 6px 12px;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .pwa-update-button:active {
          background: rgba(255, 255, 255, 0.3);
        }
      </style>
    `

    document.head.insertAdjacentHTML("beforeend", updateStyles)
    document.body.appendChild(updateBanner)

    // Event listener para actualizar
    document.getElementById("pwa-update-btn").addEventListener("click", () => {
      window.location.reload()
    })

    // Auto-remover después de 10 segundos
    setTimeout(() => {
      updateBanner.remove()
    }, 10000)
  }
})()
