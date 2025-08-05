// Aplicación principal - Envío Fácil
;(() => {
  // Variables globales
  let isAuthenticated = false
  let currentAccessToken = null
  const google = window.google

  // Elementos del DOM
  const btnContinuar = document.getElementById("btn-continuar")
  const estadoAuth = document.getElementById("estado-autenticacion")
  const signoutButton = document.getElementById("signout_button")
  const googleSigninDiv = document.querySelector(".g_id_signin")

  // Función para manejar la respuesta de credenciales de Google
  window.handleCredentialResponse = (response) => {
    console.log("📧 Respuesta de credencial recibida")

    if (response.credential) {
      // Decodificar el JWT para obtener información del usuario
      const payload = JSON.parse(atob(response.credential.split(".")[1]))
      console.log("👤 Usuario autenticado:", payload.name)

      // Guardar el token ID
      localStorage.setItem("google_id_token", response.credential)

      // Actualizar estado de autenticación
      updateAuthenticationState(true, payload.name, payload.email)

      // Solicitar token de acceso para Gmail
      requestGmailAccess()
    }
  }

  // Función para solicitar acceso a Gmail
  function requestGmailAccess() {
    console.log("📬 Solicitando acceso a Gmail...")

    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: "153822552005-9rgnskk4tvfoaakr4hcnlnssts0scq0r.apps.googleusercontent.com",
      scope: "https://www.googleapis.com/auth/gmail.send",
      callback: (tokenResponse) => {
        if (tokenResponse && tokenResponse.access_token) {
          console.log("✅ Token de acceso obtenido")
          currentAccessToken = tokenResponse.access_token
          localStorage.setItem("gmail_access_token", tokenResponse.access_token)

          // Actualizar estado final
          updateAuthenticationState(true, null, null, true)
        } else {
          console.error("❌ Error obteniendo token de acceso")
          updateAuthenticationState(false)
        }
      },
    })

    tokenClient.requestAccessToken()
  }

  // Función para actualizar el estado de autenticación
  function updateAuthenticationState(authenticated, userName = null, userEmail = null, gmailAccess = false) {
    isAuthenticated = authenticated

    if (authenticated) {
      if (gmailAccess) {
        estadoAuth.textContent = `✅ Autenticado y listo para enviar correos`
        estadoAuth.style.color = "green"
        btnContinuar.classList.add("btn-activo")
        btnContinuar.textContent = "Ir a Composición de Correo"
      } else if (userName) {
        estadoAuth.textContent = `🔄 Hola ${userName}, configurando acceso a Gmail...`
        estadoAuth.style.color = "orange"
      }

      // Mostrar botón de cerrar sesión
      signoutButton.style.display = "block"

      // Ocultar botón de Google
      if (googleSigninDiv) {
        googleSigninDiv.style.display = "none"
      }
    } else {
      estadoAuth.textContent = "❌ No autenticado"
      estadoAuth.style.color = "red"
      btnContinuar.classList.remove("btn-activo")
      btnContinuar.textContent = "Continuar"
      signoutButton.style.display = "none"

      // Mostrar botón de Google
      if (googleSigninDiv) {
        googleSigninDiv.style.display = "flex"
      }
    }
  }

  // Función para cerrar sesión
  function signOut() {
    console.log("🚪 Cerrando sesión...")

    // Revocar tokens si existen
    const accessToken = localStorage.getItem("gmail_access_token")
    if (accessToken && google.accounts.oauth2) {
      google.accounts.oauth2.revoke(accessToken, () => {
        console.log("🔓 Token de acceso revocado")
      })
    }

    // Limpiar almacenamiento local
    localStorage.removeItem("google_id_token")
    localStorage.removeItem("gmail_access_token")
    currentAccessToken = null

    // Actualizar interfaz
    updateAuthenticationState(false)
  }

  // Función para continuar a la siguiente pantalla
  function continuar() {
    if (isAuthenticated && currentAccessToken) {
      console.log("➡️ Navegando a pantalla de composición")
      window.location.href = "pantalla2.html"
    } else {
      console.log("⚠️ Usuario no autenticado completamente")
      alert("Por favor, completa la autenticación con Google primero.")
    }
  }

  // Función para verificar autenticación existente
  function checkExistingAuth() {
    const idToken = localStorage.getItem("google_id_token")
    const accessToken = localStorage.getItem("gmail_access_token")

    if (idToken && accessToken) {
      console.log("🔄 Verificando tokens existentes...")

      try {
        // Decodificar el token ID para obtener información del usuario
        const payload = JSON.parse(atob(idToken.split(".")[1]))

        // Verificar si el token no ha expirado
        const now = Date.now() / 1000
        if (payload.exp > now) {
          console.log("✅ Sesión válida encontrada")
          currentAccessToken = accessToken
          updateAuthenticationState(true, payload.name, payload.email, true)
          return true
        } else {
          console.log("⏰ Token expirado, limpiando...")
          localStorage.removeItem("google_id_token")
          localStorage.removeItem("gmail_access_token")
        }
      } catch (error) {
        console.error("❌ Error verificando token:", error)
        localStorage.removeItem("google_id_token")
        localStorage.removeItem("gmail_access_token")
      }
    }

    return false
  }

  // Función de inicialización
  function initApp() {
    console.log("🚀 Inicializando aplicación...")

    // Verificar autenticación existente
    checkExistingAuth()

    // Event listeners
    if (btnContinuar) {
      btnContinuar.addEventListener("click", continuar)
    }

    if (signoutButton) {
      signoutButton.addEventListener("click", signOut)
    }

    console.log("✅ Aplicación inicializada")
  }

  // Inicializar cuando el DOM esté listo
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp)
  } else {
    initApp()
  }
})()
