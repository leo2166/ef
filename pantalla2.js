document.addEventListener('DOMContentLoaded', () => {
  // Script principal para pantalla2.html - Composición y envío de correos
  let currentTab = "reembolso";
  let pdfBlob = null;
  let nombreArchivoPDF = "";
  let isEmailSending = false;
  let tokenClient;
  const google = window.google;

  // --- ELEMENTOS DEL DOM (organizados) ---
  const tabLinks = document.querySelectorAll(".tab-link");
  const tabContents = document.querySelectorAll(".tab-content");
  const activarCC = document.getElementById("activarCC");
  const campoCC = document.getElementById("ccField");
  const inputImagenes = document.getElementById("imagenes");
  const btnGenerarPDF = document.getElementById("btnGenerarPDF");
  const estadoPDF = document.getElementById("estadoPDF");
  const enlaceVerPDF = document.getElementById("enlaceVerPDF");
  const btnPrevisualizar = document.getElementById("btnPrevisualizar");
  const btnEnviar = document.getElementById("btnEnviar");
  const modalPrevisualizacion = document.getElementById("modalPrevisualizacion");
  const btnCerrarModal = document.getElementById("btnCerrarModal");

  // --- ESTADO DE LA APLICACIÓN ---
  const CLIENT_ID = "153822552005-9rgnskk4tvfoaakr4hcnlnssts0scq0r.apps.googleusercontent.com";
  const SCOPES = "https://www.googleapis.com/auth/gmail.send";

  if (google && google.accounts && google.accounts.oauth2) {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (tokenResponse) => {
        if (tokenResponse && tokenResponse.access_token) {
          console.log("✅ Token de acceso nuevo/refrescado obtenido.");
          localStorage.setItem("gmail_access_token", tokenResponse.access_token);
          if (window.pendingSend) {
            console.log("🔄 Reintentando envío con el nuevo token...");
            enviarCorreo(
              window.pendingSend.para,
              window.pendingSend.cc,
              window.pendingSend.asunto,
              window.pendingSend.cuerpo,
              tokenResponse.access_token,
              window.pendingSend.pdfBlob,
              window.pendingSend.nombreArchivoPDF
            );
            window.pendingSend = null;
          }
        } else {
          resetSendButton();
          alert("No se pudo refrescar la autorización. Por favor, vuelve a iniciar sesión.");
          window.location.href = "index.html";
        }
      },
    });
  }

  // --- DEFINICIONES DE TEXTO ---
  const mensajesPredefinidos = {
    reembolso: "Anexo se remite documentación en un solo archivo en formato PDF, para la gestión de reembolso por gasto médico.",
    aval: "Anexo se remite documentación en un solo archivo en formato PDF, para el trámite de la carta aval.",
    cita: "Buenos días, anexo se remite la solicitud de cita médica. Espero su confirmación.",
  };
  const correosPredefinidos = {
    reembolso: "reembolsogss@cantv.com.ve",
    aval: "cartaaval@cantv.com.ve",
    cita: "aps_aae@cantv.com.ve",
  };

  // --- FUNCIONES LÓGICAS ---
  function switchTab(tabId) {
    currentTab = tabId;
    tabLinks.forEach((link) => {
      if (link.getAttribute('data-tab') === tabId) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });
    tabContents.forEach((content) => {
      if (content.id === tabId) {
        content.classList.add("active");
      } else {
        content.classList.remove("active");
      }
    });
    const validacionCorreoOtro = document.getElementById("validacionCorreoOtro");
    if (validacionCorreoOtro) validacionCorreoOtro.classList.add("hidden");
  }

  function construirAsunto() {
    let asunto = "";
    switch (currentTab) {
      case "reembolso":
        const nombreReembolso = document.getElementById("nombreApellidoReembolso").value.trim();
        const cedulaReembolso = document.getElementById("cedulaReembolso").value.trim();
        const telefonoReembolso = document.getElementById("telefonoReembolso").value.trim();
        if (!nombreReembolso || !cedulaReembolso || !telefonoReembolso) return null;
        asunto = `Reembolso - ${nombreReembolso} - C.I. ${cedulaReembolso} - Tlf. ${telefonoReembolso}`;
        break;
      case "aval":
        const nombreAval = document.getElementById("nombreApellidoAval").value.trim();
        const cedulaAval = document.getElementById("cedulaAval").value.trim();
        const telefonoAval = document.getElementById("telefonoAval").value.trim();
        if (!nombreAval || !cedulaAval || !telefonoAval) return null;
        asunto = `Carta Aval - ${nombreAval} - C.I. ${cedulaAval} - Tlf. ${telefonoAval}`;
        break;
      case "cita":
        const especialidadCita = document.getElementById("especialidadCita").value.trim();
        if (!especialidadCita) return null;
        asunto = `Solicitud de Cita / Examen, especialidad: ${especialidadCita}`;
        break;
      case "otro":
        asunto = document.getElementById("asuntoOtro").value.trim();
        if (!asunto) return null;
        break;
    }
    return asunto;
  }

  function construirCuerpo() {
    let cuerpo = "";
    switch (currentTab) {
      case "reembolso":
        cuerpo = document.getElementById("selectCuerpoReembolso").value === "predefinido"
          ? mensajesPredefinidos.reembolso
          : document.getElementById("cuerpoReembolsoManual").value.trim();
        break;
      case "aval":
        cuerpo = document.getElementById("selectCuerpoAval").value === "predefinido"
          ? mensajesPredefinidos.aval
          : document.getElementById("cuerpoAvalManual").value.trim();
        break;
      case "cita":
        cuerpo = [
          `Estado: ${document.getElementById("estadoCita").value.trim()}`,
          `Nombre del Titular: ${document.getElementById("nombreTitularCita").value.trim()}`,
          `Cédula: ${document.getElementById("cedulaTitularCita").value.trim()}`,
          `Dirección: ${document.getElementById("direccionCita").value.trim()}`,
          `Nombre del Beneficiario: ${document.getElementById("nombreBeneficiarioCita").value.trim()}`,
          `Cédula del Beneficiario: ${document.getElementById("cedulaBeneficiarioCita").value.trim()}`,
          `Tipo de Asegurado: ${document.getElementById("tipoAseguradoCita").value}`,
          `Número de Contacto: ${document.getElementById("telefonoContactoCita").value.trim()}`,
          `Número de Contacto Adicional: ${document.getElementById("telefonoAdicionalCita").value.trim()}`,
          `Diagnóstico: ${document.getElementById("diagnosticoCita").value.trim()}`,
          `Requerimiento (Cita / Examen): ${document.getElementById("requerimientoCita").value}`,
          `Primera Consulta (si/no): ${document.getElementById("primeraConsultaCita").value}`,
          `Proveedor de servicios de Salud: ${document.getElementById("proveedorCita").value.trim()}`,
          `Observación: ${document.getElementById("observacionCita").value.trim()}`
        ].join('\n');
        break;
      case "otro":
        cuerpo = document.getElementById("cuerpoOtro")?.value.trim() || "";
        break;
    }
    return cuerpo;
  }

  function construirPara() {
    if (currentTab === "otro") {
      const correoOtro = document.getElementById("correoOtro").value.trim();
      const validacionCorreoOtro = document.getElementById("validacionCorreoOtro");
      const esValido = /^\S+@\S+\.\S+$/.test(correoOtro);
      if (validacionCorreoOtro) validacionCorreoOtro.classList.toggle("hidden", esValido || correoOtro === "");
      return esValido ? correoOtro : null;
    }
    return correosPredefinidos[currentTab];
  }

  function cerrarSesion() {
    const token = localStorage.getItem("gmail_access_token");
    if (token && google && google.accounts && google.accounts.oauth2) {
      google.accounts.oauth2.revoke(token, () => console.log("Token revocado."));
    }
    localStorage.removeItem("gmail_access_token");
    window.location.href = "index.html";
  }

  function initTabs() {
    tabLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        switchTab(link.getAttribute("data-tab"));
      });
    });
  }

  function initForms() {
    const toggleVisibility = (selectId, predefinidoId, manualId) => {
      const select = document.getElementById(selectId);
      const predefinido = document.getElementById(predefinidoId);
      const manual = document.getElementById(manualId);
      if (select && predefinido && manual) {
        select.addEventListener("change", (e) => {
          const isManual = e.target.value === "manual";
          predefinido.classList.toggle("hidden", isManual);
          manual.classList.toggle("hidden", !isManual);
        });
      }
    };
    toggleVisibility("selectCuerpoReembolso", "cuerpoReembolsoPredefinido", "cuerpoReembolsoManual");
    toggleVisibility("selectCuerpoAval", "cuerpoAvalPredefinido", "cuerpoAvalManual");
    if (activarCC) {
      activarCC.addEventListener("change", () => campoCC.classList.toggle("hidden", !activarCC.checked));
    }
  }

  function initPDFGeneration() {
    if (btnGenerarPDF) {
      btnGenerarPDF.addEventListener("click", async () => {
        if (!inputImagenes.files.length) {
          estadoPDF.textContent = "Por favor selecciona al menos una imagen JPG.";
          return;
        }
        estadoPDF.textContent = "Generando PDF...";
        enlaceVerPDF.classList.add("hidden");

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();
        
        for (let i = 0; i < inputImagenes.files.length; i++) {
          const file = inputImagenes.files[i];
          const reader = new FileReader();
          const promise = new Promise((resolve, reject) => {
            reader.onload = (e) => {
              const img = new Image();
              img.src = e.target.result;
              img.onload = () => {
                if (i > 0) pdf.addPage();
                const { width, height } = pdf.internal.pageSize;
                const ratio = Math.min(width / img.width, height / img.height);
                const w = img.width * ratio;
                const h = img.height * ratio;
                pdf.addImage(img, "JPEG", (width - w) / 2, (height - h) / 2, w, h);
                resolve();
              };
              img.onerror = reject;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          await promise;
        }

        pdfBlob = pdf.output("blob");
        const now = new Date();
        const fechaHora = `${now.getDate().toString().padStart(2, "0")}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now.getFullYear()}_${now.getHours().toString().padStart(2, "0")}-${now.getMinutes().toString().padStart(2, "0")}`;
        let nombreParaPDF = document.getElementById("nombreApellidoReembolso").value.trim() || document.getElementById("nombreApellidoAval").value.trim();
        nombreArchivoPDF = nombreParaPDF ? `gastos_medicos_de_${nombreParaPDF.replace(/\s/g, "_")}_${fechaHora}.pdf` : `documento_${fechaHora}.pdf`;
        
        estadoPDF.textContent = `PDF generado: ${nombreArchivoPDF}`;
        enlaceVerPDF.href = URL.createObjectURL(pdfBlob);
        enlaceVerPDF.classList.remove("hidden");
      });
    }
  }

  function initPreview() {
    if (btnPrevisualizar) {
      btnPrevisualizar.addEventListener("click", () => {
        const para = construirPara();
        const asunto = construirAsunto();
        const cuerpo = construirCuerpo();
        if (!para || !asunto || !cuerpo) {
          alert("Por favor, completa todos los campos requeridos antes de previsualizar.");
          return;
        }
        document.getElementById("previewPara").textContent = para;
        document.getElementById("previewCC").textContent = activarCC.checked ? document.getElementById("cc").value.trim() : "Ninguno";
        document.getElementById("previewAsunto").textContent = asunto;
        document.getElementById("previewCuerpo").textContent = cuerpo;
        document.getElementById("previewAdjunto").textContent = nombreArchivoPDF || "Ninguno";
        modalPrevisualizacion.classList.remove("hidden");
      });
    }
    if (btnCerrarModal) {
      btnCerrarModal.addEventListener("click", () => modalPrevisualizacion.classList.add("hidden"));
    }
  }

  async function handleEmailSend(event) {
    event.preventDefault();
    if (isEmailSending) return;
    isEmailSending = true;
    showLoadingModal("Preparando y enviando su correo...");
    btnEnviar.disabled = true;
    btnEnviar.textContent = "Enviando...";

    const para = document.getElementById("previewPara").textContent;
    const cc = document.getElementById("previewCC").textContent;
    const asunto = document.getElementById("previewAsunto").textContent;
    const cuerpo = document.getElementById("previewCuerpo").textContent;
    const token = localStorage.getItem("gmail_access_token");

    if (!token) {
      resetSendButton();
      alert("No se encontró un token de acceso. Por favor, re-autoriza la aplicación.");
      window.location.href = "index.html";
      return;
    }

    try {
      await enviarCorreo(para, cc !== "Ninguno" ? cc : "", asunto, cuerpo, token, pdfBlob, nombreArchivoPDF);
    } catch (error) {
      console.error("Error en handleEmailSend:", error);
      resetSendButton();
    }
  }

  async function enviarCorreo(para, cc, asunto, cuerpo, token, attachmentBlob, attachmentName) {
    const message = [
      `To: ${para}`,
      cc ? `Cc: ${cc}` : null,
      `Subject: ${asunto}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/mixed; boundary="foo_bar_baz"`,
      ``,
      `--foo_bar_baz`,
      `Content-Type: text/plain; charset="UTF-8"`,
      ``,
      cuerpo,
      ``,
    ].filter(Boolean).join('\n');

    const finalMessage = [message];

    if (attachmentBlob) {
      updateLoadingMessage("Codificando y adjuntando el archivo PDF...");
      const reader = new FileReader();
      const promise = new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result.split(",")[1]);
        reader.readAsDataURL(attachmentBlob);
      });
      const base64Attachment = await promise;
      finalMessage.push(
        `--foo_bar_baz`,
        `Content-Type: application/pdf; name="${attachmentName}"`,
        `Content-Transfer-Encoding: base64`,
        `Content-Disposition: attachment; filename="${attachmentName}"`,
        ``,
        base64Attachment,
      );
    }
    finalMessage.push(`--foo_bar_baz--`);
    
    const rawMessage = finalMessage.join('\n');
    const encodedMessage = btoa(unescape(encodeURIComponent(rawMessage))).replace(/\+/g, "-").replace(/\//g, "_");

    const response = await fetch("https://www.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ raw: encodedMessage }),
    });

    if (response.ok) {
      showSuccessModal();
    } else {
      const errorData = await response.json();
      if (response.status === 401) {
        console.log("Token expirado. Intentando refrescar...");
        window.pendingSend = { para, cc, asunto, cuerpo, pdfBlob, nombreArchivoPDF };
        tokenClient.requestAccessToken({ prompt: '' });
      } else {
        resetSendButton();
        alert(`Error al enviar: ${errorData.error?.message || 'Desconocido'}`);
      }
    }
  }

  function showLoadingModal(message) {
    hideLoadingModal();
    const modal = document.createElement("div");
    modal.id = "loading-modal";
    modal.className = "envio-modal";
    modal.innerHTML = `
      <div class="envio-modal-content loading">
        <div class="loading-animation">⏳</div>
        <h3 id="loading-title">Procesando...</h3>
        <p id="loading-message">${message}</p>
      </div>`;
    document.body.appendChild(modal);
    document.body.style.overflow = "hidden";
  }

  function hideLoadingModal() {
    const modal = document.getElementById("loading-modal");
    if (modal) modal.remove();
    document.body.style.overflow = "";
  }
  
  function updateLoadingMessage(newMessage) {
      const messageEl = document.getElementById("loading-message");
      if(messageEl) messageEl.textContent = newMessage;
  }

  function showSuccessModal() {
    hideLoadingModal();
    const successModal = document.createElement("div");
    successModal.id = "envio-success-modal";
    successModal.className = "envio-modal";
    successModal.innerHTML = `
      <div class="envio-modal-content success">
        <div class="success-icon">✅</div>
        <h3>Correo enviado con éxito</h3>
        <p>Tu correo ha sido archivado en la carpeta "Enviados" de tu Gmail.</p>
        <button class="modal-continue-btn" onclick="window.location.href='index.html'">Volver al Inicio</button>
      </div>`;
    document.body.appendChild(successModal);
    document.body.style.overflow = "hidden";
  }

  function resetSendButton() {
    hideLoadingModal();
    isEmailSending = false;
    if (btnEnviar) {
      btnEnviar.disabled = false;
      btnEnviar.textContent = "Enviar";
    }
  }

  // --- INICIALIZACIÓN ---
  initTabs();
  initForms();
  initPDFGeneration();
  initPreview();
  if (btnEnviar) {
    btnEnviar.addEventListener("click", handleEmailSend);
  }
  // Activar la primera pestaña por defecto
  switchTab('reembolso');
});