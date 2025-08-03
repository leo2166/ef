// Script para manejar el modo oscuro
;(() => {
  // Función para inicializar el toggle de tema
  function initThemeToggle() {
    const themeToggle = document.getElementById("theme-toggle")
    const themeIcon = document.querySelector(".theme-icon")
    const themeText = document.querySelector(".theme-text")

    if (!themeToggle) return

    // Obtener tema guardado o usar preferencia del sistema
    const savedTheme = localStorage.getItem("theme")
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const initialTheme = savedTheme || (systemPrefersDark ? "dark" : "light")

    // Aplicar tema inicial
    setTheme(initialTheme)

    // Event listener para el toggle
    themeToggle.addEventListener("click", () => {
      const currentTheme = document.documentElement.getAttribute("data-theme")
      const newTheme = currentTheme === "dark" ? "light" : "dark"
      setTheme(newTheme)
    })

    // Función para establecer el tema
    function setTheme(theme) {
      document.documentElement.setAttribute("data-theme", theme)
      localStorage.setItem("theme", theme)

      // Actualizar el contenido del toggle
      if (theme === "dark") {
        themeIcon.textContent = "☀️"
        themeText.textContent = "Modo Claro"
        themeToggle.setAttribute("aria-label", "Cambiar a modo claro")
      } else {
        themeIcon.textContent = "🌙"
        themeText.textContent = "Modo Oscuro"
        themeToggle.setAttribute("aria-label", "Cambiar a modo oscuro")
      }
    }

    // Escuchar cambios en la preferencia del sistema
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
      if (!localStorage.getItem("theme")) {
        setTheme(e.matches ? "dark" : "light")
      }
    })
  }

  // Inicializar cuando el DOM esté listo
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initThemeToggle)
  } else {
    initThemeToggle()
  }
})()
