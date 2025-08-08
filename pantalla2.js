// Script principal para pantalla2.html - Composición y envío de correos
;(() => {
  let currentTab = "reembolso"
  let pdfBlob = null
  let nombreArchivoPDF = ""
  let isEmailSending = false
  let tokenClient
  const google = window.google

  // --- ELEMENTOS DEL DOM (organizados) ---
  // Pestañas
  const tabLinks = document.querySelectorAll(".tab-link")
  const tabContents = document.querySelectorAll(".tab-content")

  // Campos Comunes
  const activarCC = document.getElementById("activarCC")
  const campoCC = document.getElementById("ccField")

  // Adjuntos y PDF
  const inputImagenes = document.getElementById("imagenes")
  const btnGenerarPDF = document.getElementById("btnGenerarPDF")
  const estadoPDF = document.getElementById("estadoPDF")
  const enlaceVerPDF = document.getElementById("enlaceVerPDF")

  // Acciones Finales
  const btnPrevisualizar = document.getElementById("btnPrevisualizar")
  const btnEnviar = document.getElementById("btnEnviar")
  const modalPrevisualizacion = document.getElementById("modalPrevisualizacion")
  const btnCerrarModal = document.getElementById("btnCerrarModal")

  // --- ESTADO DE LA APLICACIÓN ---
  const CLIENT_ID = "153822552005-9rgnskk4tvfoaakr4hcnlnssts0scq0r.apps.googleusercontent.com"
  const SCOPES = "https://www.googleapis.com/auth/gmail.send"

  // MODIFICADO: Lógica de refresco de token movida al callback
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (tokenResponse) => {
      if (tokenResponse && tokenResponse.access_token) {
        console.log("✅ Token de acceso nuevo/refrescado obtenido.")
        localStorage.setItem("gmail_access_token", tokenResponse.access_token)
        
        // Si el envío estaba pendiente por un token expirado, se reintenta ahora.
        if (window.pendingSend) {
          console.log("🔄 Reintentando envío con el nuevo token...")
          enviarCorreo(
            window.pendingSend.para,
            window.pendingSend.cc,
            window.pendingSend.asunto,
            window.pendingSend.cuerpo,
            tokenResponse.access_token, // Usar el token fresco
            window.pendingSend.pdfBlob,
            window.pendingSend.nombreArchivoPDF,
          )
          window.pendingSend = null // Limpiar la solicitud pendiente
        }
      } else {
        // Si el refresco falla, es un error serio.
        resetSendButton()
        alert("No se pudo refrescar la autorización. Por favor, vuelve a iniciar sesión.")
        window.location.href = "index.html"
      }
    },
  })

  // --- DEFINICIONES DE TEXTO ---
  const mensajesPredefinidos = {
    reembolso:
      "Anexo se remite documentación en un solo archivo en formato PDF, para la gestión de reembolso por gasto médico.",
    aval: "Anexo se remite documentación en un solo archivo en formato PDF, para el trámite de la carta aval.",
    cita: "Buenos días, anexo se remite la solicitud de cita médica. Espero su confirmación.",
  }

  const correosPredefinidos = {
    reembolso: "reembolsogss@cantv.com.ve",
    aval: "cartaaval@cantv.com.ve",
    cita: "aps_aae@cantv.com.ve",
  }

  // --- FUNCIONES LÓGICAS ---
  function switchTab(tabId) {
    tabLinks.forEach((link) => link.classList.remove("active"))
    tabContents.forEach((content) => content.classList.remove("active"))
    document.querySelector(`.tab-link[data-tab="${tabId}"]`).classList.add("active")
    document.getElementById(tabId).classList.add("active")
    currentTab = tabId

    // Limpiar validaciones de correo manual al cambiar de pestaña
    const validacionCorreoOtro = document.getElementById("validacionCorreoOtro")
    if (validacionCorreoOtro) validacionCorreoOtro.classList.add("hidden")
  }

  function construirAsunto() {
    let asunto = ""
    switch (currentTab) {
      case "reembolso":
        const nombreReembolso = document.getElementById("nombreApellidoReembolso").value.trim()
        const cedulaReembolso = document.getElementById("cedulaReembolso").value.trim()
        const telefonoReembolso = document.getElementById("telefonoReembolso").value.trim()
        if (!nombreReembolso || !cedulaReembolso || !telefonoReembolso) return null
        asunto = `Reembolso - ${nombreReembolso} - C.I. ${cedulaReembolso} - Tlf. ${telefonoReembolso}`
        break
      case "aval":
        const nombreAval = document.getElementById("nombreApellidoAval").value.trim()
        const cedulaAval = document.getElementById("cedulaAval").value.trim()
        const telefonoAval = document.getElementById("telefonoAval").value.trim()
        if (!nombreAval || !cedulaAval || !telefonoAval) return null
        asunto = `Carta Aval - ${nombreAval} - C.I. ${cedulaAval} - Tlf. ${telefonoAval}`
        break
      case "cita":
        const especialidadCita = document.getElementById("especialidadCita").value.trim()
        if (!especialidadCita) return null
        asunto = `Solicitud de Cita / Examen, especialidad: ${especialidadCita}`
        break
      case "otro":
        asunto = document.getElementById("asuntoOtro").value.trim()
        if (!asunto) return null
        break
    }
    return asunto
  }

  function construirCuerpo() {
    let cuerpo = ""
    switch (currentTab) {
      case "reembolso":
        const selectCuerpoReembolso = document.getElementById("selectCuerpoReembolso").value
        if (selectCuerpoReembolso === "predefinido") {
          cuerpo = mensajesPredefinidos.reembolso
        } else {
          cuerpo = document.getElementById("cuerpoReembolsoManual").value.trim()
        }
        break
      case "aval":
        const selectCuerpoAval = document.getElementById("selectCuerpoAval").value
        if (selectCuerpoAval === "predefinido") {
          cuerpo = mensajesPredefinidos.aval
        } else {
          cuerpo = document.getElementById("cuerpoAvalManual").value.trim()
        }
        break
      case "cita":
        const estadoCita = document.getElementById("estadoCita").value.trim()
        const nombreTitularCita = document.getElementById("nombreTitularCita").value.trim()
        const cedulaTitularCita = document.getElementById("cedulaTitularCita").value.trim()
        const direccionCita = document.getElementById("direccionCita").value.trim()
        const nombreBeneficiarioCita = document.getElementById("nombreBeneficiarioCita").value.trim()
        const cedulaBeneficiarioCita = document.getElementById("cedulaBeneficiarioCita").value.trim()
        const tipoAseguradoCita = document.getElementById("tipoAseguradoCita").value
        const telefonoContactoCita = document.getElementById("telefonoContactoCita").value.trim()
        const telefonoAdicionalCita = document.getElementById("telefonoAdicionalCita").value.trim()
        const diagnosticoCita = document.getElementById("diagnosticoCita").value.trim()
        const requerimientoCita = document.getElementById("requerimientoCita").value
        const primeraConsultaCita = document.getElementById("primeraConsultaCita").value
        const proveedorCita = document.getElementById("proveedorCita").value.trim()
        const observacionCita = document.getElementById("observacionCita").value.trim()

        cuerpo =
          `Estado: ${estadoCita}\n` +
          `Nombre del Titular: ${nombreTitularCita}\n` +
          `Cédula: ${cedulaTitularCita}\n` +
          `Dirección: ${direccionCita}\n` +
          `Nombre del Beneficiario: ${nombreBeneficiarioCita}\n` +
          `Cédula del Beneficiario: ${cedulaBeneficiarioCita}\n` +
          `Tipo de Asegurado: ${tipoAseguradoCita}\n` +
          `Número de Contacto: ${telefonoContactoCita}\n` +
          `Número de Contacto Adicional: ${telefonoAdicionalCita}\n` +
          `Diagnóstico: ${diagnosticoCita}\n` +
          `Requerimiento (Cita / Examen): ${requerimientoCita}\n` +
          `Primera Consulta (si/no): ${primeraConsultaCita}\n` +
          `Proveedor de servicios de Salud: ${proveedorCita}\n` +
          `Observación: ${observacionCita}`
        break
      case "otro":
        const cuerpoOtroElement = document.getElementById("cuerpoOtro")
        cuerpo = cuerpoOtroElement ? cuerpoOtroElement.value.trim() : ""
        break
    }
    return cuerpo
  }

  function construirPara() {
    if (currentTab === "otro") {
      const correoOtro = document.getElementById("correoOtro").value.trim()
      const validacionCorreoOtro = document.getElementById("validacionCorreoOtro")
      const esValido = /^\S+@\S+\.\S+$/.test(correoOtro) && correoOtro.length > 0

      if (validacionCorreoOtro) {
        validacionCorreoOtro.classList.toggle("hidden", esValido || correoOtro === "")
      }

      return esValido ? correoOtro : null
    } else {
      return correosPredefinidos[currentTab]
    }
  }

  function checkSendButtonState() {
    // Botones siempre activos
    if (btnEnviar) {
      btnEnviar.disabled = false
      btnEnviar.textContent = "Enviar"
    }
    if (btnPrevisualizar) {
      btnPrevisualizar.disabled = false
    }
  }

  function cerrarSesion() {
    const token = localStorage.getItem("gmail_access_token")
    if (token) {
      google.accounts.oauth2.revoke(token, () => {
        console.log("Token revocado.")
      })
    }
    localStorage.removeItem("gmail_access_token")
    localStorage.removeItem("google_id_token")
    window.location.href = "index.html"
  }

  // Inicializar sistema de pestañas
  function initTabs() {
    tabLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault()
        const tabId = link.getAttribute("data-tab")
        switchTab(tabId)
      })
    })
  }

  // Inicializar formularios
  function initForms() {
    const selectReembolso = document.getElementById("selectCuerpoReembolso")
    const selectAval = document.getElementById("selectCuerpoAval")

    if (selectReembolso) {
      selectReembolso.addEventListener("change", (event) => {
        const predefinido = document.getElementById("cuerpoReembolsoPredefinido")
        const manual = document.getElementById("cuerpoReembolsoManual")
        if (event.target.value === "manual") {
          predefinido.classList.add("hidden")
          manual.classList.remove("hidden")
        } else {
          predefinido.classList.remove("hidden")
          manual.classList.add("hidden")
        }
      })
    }

    if (selectAval) {
      selectAval.addEventListener("change", (event) => {
        const predefinido = document.getElementById("cuerpoAvalPredefinido")
        const manual = document.getElementById("cuerpoAvalManual")
        if (event.target.value === "manual") {
          predefinido.classList.add("hidden")
          manual.classList.remove("hidden")
        } else {
          predefinido.classList.remove("hidden")
          manual.classList.add("hidden")
        }
      })
    }

    if (activarCC) {
      activarCC.addEventListener("change", () => {
        campoCC.classList.toggle("hidden", !activarCC.checked)
      })
    }

    // Validación específica para correo "otro"
    const correoOtroInput = document.getElementById("correoOtro")
    if (correoOtroInput) {
      correoOtroInput.addEventListener("input", () => {
        setTimeout(() => {}, 100) // Pequeño delay para asegurar que el valor se actualice
      })
      correoOtroInput.addEventListener("blur", () => {})
    }

    // Listener para asunto "otro"
    const asuntoOtroInput = document.getElementById("asuntoOtro")
    if (asuntoOtroInput) {
      asuntoOtroInput.addEventListener("input", () => {})
    }

    // Listener para cuerpo "otro"
    const cuerpoOtroInput = document.getElementById("cuerpoOtro")
    if (cuerpoOtroInput) {
      cuerpoOtroInput.addEventListener("input", () => {})
    }

    // Agregar listeners a todos los inputs para verificar estado
    const inputs = document.querySelectorAll("input, textarea, select")
    inputs.forEach((input) => {
      input.addEventListener("input", () => {
        setTimeout(() => {}, 50)
      })
      input.addEventListener("change", () => {})
    })
  }

  // Inicializar generación de PDF
  function initPDFGeneration() {
    if (btnGenerarPDF) {
      btnGenerarPDF.addEventListener("click", () => {
        if (!inputImagenes.files.length) {
          estadoPDF.textContent = "Por favor selecciona al menos una imagen JPG."
          return
        }

        estadoPDF.textContent = "Generando PDF..."
        const { jsPDF } = window.jspdf
        const pdf = new jsPDF()
        let pendientes = inputImagenes.files.length
        let currentPage = 0

        let nombreParaPDF = ""
        if (currentTab === "reembolso") {
          nombreParaPDF = document.getElementById("nombreApellidoReembolso").value.trim()
        } else if (currentTab === "aval") {
          nombreParaPDF = document.getElementById("nombreApellidoAval").value.trim()
        }

        Array.from(inputImagenes.files).forEach((file, i) => {
          const reader = new FileReader()
          reader.onload = (e) => {
            const img = new Image()
            img.src = e.target.result
            img.onload = () => {
              if (currentPage > 0) {
                pdf.addPage()
              }
              currentPage++

              const imgWidth = img.width
              const imgHeight = img.height
              const pageWidth = pdf.internal.pageSize.getWidth()
              const pageHeight = pdf.internal.pageSize.getHeight()
              const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight)
              const scaledWidth = imgWidth * ratio
              const scaledHeight = imgHeight * ratio
              const x = (pageWidth - scaledWidth) / 2
              const y = (pageHeight - scaledHeight) / 2

              pdf.addImage(img, "JPEG", x, y, scaledWidth, scaledHeight)
              pendientes--

              if (pendientes === 0) {
                pdfBlob = pdf.output("blob")

                const now = new Date()
                const fechaHora = `${now.getDate().toString().padStart(2, "0")}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now.getFullYear()}_${now.getHours().toString().padStart(2, "0")}-${now.getMinutes().toString().padStart(2, "0")}`

                if (nombreParaPDF) {
                  nombreArchivoPDF = `gastos_medicos_de_${nombreParaPDF.replace(/\s/g, "_")}_${fechaHora}.pdf`
                } else {
                  nombreArchivoPDF = `documento_${fechaHora}.pdf`
                }

                estadoPDF.textContent = `PDF generado con éxito: ${nombreArchivoPDF}`
                enlaceVerPDF.href = URL.createObjectURL(pdfBlob)
                enlaceVerPDF.classList.remove("hidden")
              }
            }
          }
          reader.readAsDataURL(file)
        })
      })
    }
  }

  // Inicializar previsualización
  function initPreview() {
    if (btnPrevisualizar) {
      btnPrevisualizar.addEventListener("click", () => {
        const para = construirPara()
        if (!para) {
          alert("Por favor, selecciona o introduce un destinatario válido.")
          return
        }

        const asunto = construirAsunto()
        if (!asunto) {
          alert(
            "Faltan datos para construir el asunto. Por favor, completa todos los campos requeridos en la pestaña actual.",
          )
          return
        }

        const cuerpo = construirCuerpo()
        if (!cuerpo) {
          alert("El cuerpo del mensaje no puede estar vacío.")
          return
        }

        document.getElementById("previewPara").textContent = para
        document.getElementById("previewCC").textContent = activarCC.checked
          ? document.getElementById("cc").value.trim()
          : "Ninguno"
        document.getElementById("previewAsunto").textContent = asunto
        document.getElementById("previewCuerpo").textContent = cuerpo
        document.getElementById("previewAdjunto").textContent = nombreArchivoPDF || "Ninguno"

        modalPrevisualizacion.classList.remove("hidden")
      })
    }

    if (btnCerrarModal) {
      btnCerrarModal.addEventListener("click", () => {
        modalPrevisualizacion.classList.add("hidden")
      })
    }
  }

  // Manejar envío de correo
  async function handleEmailSend(event) {
    // PREVENIR MÚLTIPLES CLICS
    event.preventDefault()
    event.stopImmediatePropagation()

    if (isEmailSending) {
      console.log("⚠️ Envío ya en curso, ignorando clic")
      return false
    }

    console.log("📧 Iniciando envío de correo...")
    isEmailSending = true

    // DESHABILITAR BOTÓN INMEDIATAMENTE
    btnEnviar.disabled = true
    btnEnviar.textContent = "Enviando..."
    btnEnviar.style.pointerEvents = "none" // Prevenir clics adicionales

    const para = document.getElementById("previewPara").textContent
    const cc = document.getElementById("previewCC").textContent
    const asunto = document.getElementById("previewAsunto").textContent
    const cuerpo = document.getElementById("previewCuerpo").textContent

    const currentAccessToken = localStorage.getItem("gmail_access_token")
    if (!currentAccessToken) {
      resetSendButton()
      alert("No se encontró un token de acceso. Por favor, re-autoriza la aplicación.")
      window.location.href = "index.html"
      return false
    }

    try {
      await enviarCorreo(
        para,
        cc !== "Ninguno" ? cc : "",
        asunto,
        cuerpo,
        currentAccessToken,
        pdfBlob,
        nombreArchivoPDF,
      )
    } catch (error) {
      console.error("Error en handleEmailSend:", error)
      resetSendButton()
    }

    return false
  }

  // MODIFICADO: Lógica de envío con reintento automático
  async function enviarCorreo(para, cc, asunto, cuerpo, token, attachmentBlob, attachmentName) {
    console.log("📤 Preparando para enviar correo a:", para)

    const message = [
      `To: ${para}`,
      `Subject: ${asunto}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/mixed; boundary="foo_bar_baz"`,
      ``,
      `--foo_bar_baz`,
      `Content-Type: text/plain; charset="UTF-8"`,
      `Content-Transfer-Encoding: 7bit`,
      ``,
      `${cuerpo}`,
      ``,
    ]

    if (cc) {
      message.splice(1, 0, `Cc: ${cc}`)
    }

    const realizarEnvioFinal = async (encodedMessage) => {
      try {
        console.log("🚀 Realizando petición a Gmail API...")
        const response = await fetch("https://www.googleapis.com/gmail/v1/users/me/messages/send", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ raw: encodedMessage }),
        })

        if (response.ok) {
          console.log("✅ Correo enviado exitosamente")
          showSuccessModal()
        } else {
          const errorData = await response.json()
          console.error("❌ Error al enviar el correo:", errorData)

          // ¡NUEVA LÓGICA DE REINTENTO!
          if (response.status === 401) {
            console.log("🔑 Token de acceso expirado. Intentando refrescar automáticamente...")
            // Guardar los datos del correo para el reintento
            window.pendingSend = { para, cc, asunto, cuerpo, pdfBlob: attachmentBlob, nombreArchivoPDF: attachmentName }
            // Solicitar un nuevo token. El callback se encargará del reintento.
            tokenClient.requestAccessToken({ prompt: '' }) // prompt vacío para un intento silencioso
          } else {
            resetSendButton()
            alert("Error al enviar el correo: " + (errorData.error ? errorData.error.message : "Desconocido"))
          }
        }
      } catch (error) {
        console.error("❌ Error de red o inesperado:", error)
        resetSendButton()
        alert("Error de red o inesperado al enviar el correo.")
      }
    }

    if (attachmentBlob && attachmentName) {
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64Attachment = reader.result.split(",")[1]
        message.push(
          `--foo_bar_baz`,
          `Content-Type: application/pdf; name="${attachmentName}" `,
          `Content-Transfer-Encoding: base64`,
          `Content-Disposition: attachment; filename="${attachmentName}" `,
          ``,
          `${base64Attachment}`,
          `--foo_bar_baz--`,
        )
        const rawMessage = message.join("\n")
        const encodedMessage = btoa(unescape(encodeURIComponent(rawMessage))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
        await realizarEnvioFinal(encodedMessage)
      }
      reader.readAsDataURL(attachmentBlob)
    } else {
      message.push(`--foo_bar_baz--`)
      const rawMessage = message.join("\n")
      const encodedMessage = btoa(unescape(encodeURIComponent(rawMessage))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
      await realizarEnvioFinal(encodedMessage)
    }
  }
  
  function showSuccessModal() {
    console.log("🎉 Mostrando modal de éxito...")

    // Crear el modal de éxito directamente
    const successModal = document.createElement("div")
    successModal.id = "envio-success-modal"
    successModal.className = "envio-modal"
    successModal.innerHTML = `
      <div class="envio-modal-content success">
        <div class="success-icon">✅</div>
        <h3>Correo enviado con éxito</h3>
        <p>Tu correo ha sido archivado en la carpeta "Enviados" de tu Gmail.</p>
        <button class="modal-continue-btn" onclick="returnToHome()">Continuar</button>
      </div>
    `

    document.body.appendChild(successModal)
    document.body.style.overflow = "hidden"
    console.log("✅ Modal de éxito mostrado")
  }

  // Nueva función para resetear el botón
  function resetSendButton() {
    isEmailSending = false
    if (btnEnviar) {
      btnEnviar.disabled = false
      btnEnviar.textContent = "Enviar"
      btnEnviar.style.pointerEvents = "auto"
    }
  }

  window.returnToHome = () => {
    console.log("🏠 Regresando a pantalla inicial...")

    // RESETEAR ESTADO COMPLETAMENTE
    isEmailSending = false

    // Limpiar cualquier modal existente
    const successModal = document.getElementById("envio-success-modal")
    if (successModal) successModal.remove()

    document.body.style.overflow = ""

    cerrarSesion()
  }

  function initPantalla2() {
    console.log("🚀 Inicializando Pantalla2...")

    // PREVENIR MÚLTIPLES INICIALIZACIONES
    if (window.pantalla2Initialized) {
      console.log("⚠️ Pantalla2 ya inicializada, saltando...")
      return
    }
    window.pantalla2Initialized = true

    initTabs()
    initForms()
    initPDFGeneration()
    initPreview()

    // CONECTAR EL BOTÓN ENVIAR SOLO UNA VEZ
    if (btnEnviar && !btnEnviar.hasAttribute("data-listener-added")) {
      btnEnviar.addEventListener("click", handleEmailSend)
      btnEnviar.setAttribute("data-listener-added", "true")
      console.log("✅ Event listener agregado al botón enviar")
    }

    // Activar botones siempre
    if (btnEnviar) {
      btnEnviar.disabled = false
      btnEnviar.textContent = "Enviar"
    }
    if (btnPrevisualizar) {
      btnPrevisualizar.disabled = false
    }
    console.log("✅ Pantalla2 inicializada correctamente")
  }

  switchTab("reembolso")

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPantalla2)
  } else {
    initPantalla2()
  }
})()
