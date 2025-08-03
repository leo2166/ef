// Versión Definitiva (Corregida) - 1 de Agosto 2025

let tokenClient; // Declarar tokenClient globalmente

document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DEL DOM (organizados) ---
    // Pestañas
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');

    // Campos Comunes
    const activarCC = document.getElementById("activarCC");
    const campoCC = document.getElementById("ccField");

    // Adjuntos y PDF
    const inputImagenes = document.getElementById("imagenes");
    const btnGenerarPDF = document.getElementById("btnGenerarPDF");
    const estadoPDF = document.getElementById("estadoPDF");
    const enlaceVerPDF = document.getElementById('enlaceVerPDF');

    // Acciones Finales
    const btnPrevisualizar = document.getElementById("btnPrevisualizar");
    const btnEnviar = document.getElementById("btnEnviar");
    const modalPrevisualizacion = document.getElementById("modalPrevisualizacion");
    const btnCerrarModal = document.getElementById("btnCerrarModal");

    // --- ESTADO DE LA APLICACIÓN ---
    let tipoDestinatario = 'reembolso'; // Default a la primera pestaña activa
    let emailDestinatario = '';
    let pdfBlob = null;
    let nombreArchivoPDF = '';

    // --- VERIFICACIÓN INICIAL Y REFRESH DE TOKEN ---
    const CLIENT_ID = "153822552005-9rgnskk4tvfoaakr4hcnlnssts0scq0r.apps.googleusercontent.com";
    const SCOPES = 'https://www.googleapis.com/auth/gmail.send';

    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (tokenResponse) => {
            if (tokenResponse && tokenResponse.access_token) {
                localStorage.setItem('gmail_access_token', tokenResponse.access_token);
                // Si el envío estaba pendiente, reintentar
                if (window.pendingSend) {
                    enviarCorreo(window.pendingSend.para, window.pendingSend.cc, window.pendingSend.asunto, window.pendingSend.cuerpo, tokenResponse.access_token, window.pendingSend.pdfBlob, window.pendingSend.nombreArchivoPDF);
                    window.pendingSend = null; // Limpiar la solicitud pendiente
                }
            } else {
                alert("No se pudo refrescar la autorización. Por favor, vuelve a iniciar sesión.");
                window.location.href = 'index.html';
            }
        },
    });

    // --- DEFINICIONES DE TEXTO ---
    const mensajesPredefinidos = {
        reembolso: "Anexo se remite documentación en un solo archivo en formato PDF, para la gestión de reembolso por gasto médico.",
        aval: "Anexo se remite documentación en un solo archivo en formato PDF, para el trámite de la carta aval.",
        cita: "Buenos días, anexo se remite la solicitud de cita médica. Espero su confirmación."
    };

    const correosPredefinidos = {
        reembolso: "reembolsogss@cantv.com.ve",
        aval: "cartaaval@cantv.com.ve",
        cita: "aps_aae@cantv.com.ve"
    };

    // --- FUNCIONES LÓGICAS ---
    function switchTab(tabId) {
        tabLinks.forEach(link => link.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));

        document.querySelector(`.tab-link[data-tab="${tabId}"]`).classList.add('active');
        document.getElementById(tabId).classList.add('active');

        tipoDestinatario = tabId;
        // emailDestinatario se construirá en construirPara

        // Limpiar validaciones de correo manual al cambiar de pestaña
        const validacionCorreoOtro = document.getElementById('validacionCorreoOtro');
        if (validacionCorreoOtro) validacionCorreoOtro.classList.add('hidden');
    }

    function construirAsunto() {
        let asunto = '';
        switch (tipoDestinatario) {
            case 'reembolso':
                const nombreReembolso = document.getElementById('nombreApellidoReembolso').value.trim();
                const cedulaReembolso = document.getElementById('cedulaReembolso').value.trim();
                const telefonoReembolso = document.getElementById('telefonoReembolso').value.trim();
                if (!nombreReembolso || !cedulaReembolso || !telefonoReembolso) return null;
                asunto = `Reembolso - ${nombreReembolso} - C.I. ${cedulaReembolso} - Tlf. ${telefonoReembolso}`;
                break;
            case 'aval':
                const nombreAval = document.getElementById('nombreApellidoAval').value.trim();
                const cedulaAval = document.getElementById('cedulaAval').value.trim();
                const telefonoAval = document.getElementById('telefonoAval').value.trim();
                if (!nombreAval || !cedulaAval || !telefonoAval) return null;
                asunto = `Carta Aval - ${nombreAval} - C.I. ${cedulaAval} - Tlf. ${telefonoAval}`;
                break;
            case 'cita':
                const especialidadCita = document.getElementById('especialidadCita').value.trim();
                if (!especialidadCita) return null;
                asunto = `Solicitud de Cita / Examen, especialidad: ${especialidadCita}`;
                break;
            case 'otro':
                asunto = document.getElementById('asuntoOtro').value.trim();
                if (!asunto) return null;
                break;
        }
        return asunto;
    }

    function construirCuerpo() {
        let cuerpo = '';
        switch (tipoDestinatario) {
            case 'reembolso':
                const selectCuerpoReembolso = document.getElementById('selectCuerpoReembolso').value;
                if (selectCuerpoReembolso === 'predefinido') {
                    cuerpo = mensajesPredefinidos.reembolso;
                } else {
                    cuerpo = document.getElementById('cuerpoReembolsoManual').value.trim();
                }
                break;
            case 'aval':
                const selectCuerpoAval = document.getElementById('selectCuerpoAval').value;
                if (selectCuerpoAval === 'predefinido') {
                    cuerpo = mensajesPredefinidos.aval;
                } else {
                    cuerpo = document.getElementById('cuerpoAvalManual').value.trim();
                }
                break;
            case 'cita':
                const estadoCita = document.getElementById('estadoCita').value.trim();
                const nombreTitularCita = document.getElementById('nombreTitularCita').value.trim();
                const cedulaTitularCita = document.getElementById('cedulaTitularCita').value.trim();
                const direccionCita = document.getElementById('direccionCita').value.trim();
                const nombreBeneficiarioCita = document.getElementById('nombreBeneficiarioCita').value.trim();
                const cedulaBeneficiarioCita = document.getElementById('cedulaBeneficiarioCita').value.trim();
                const tipoAseguradoCita = document.getElementById('tipoAseguradoCita').value;
                const telefonoContactoCita = document.getElementById('telefonoContactoCita').value.trim();
                const telefonoAdicionalCita = document.getElementById('telefonoAdicionalCita').value.trim();
                const diagnosticoCita = document.getElementById('diagnosticoCita').value.trim();
                const requerimientoCita = document.getElementById('requerimientoCita').value;
                const primeraConsultaCita = document.getElementById('primeraConsultaCita').value;
                const proveedorCita = document.getElementById('proveedorCita').value.trim();
                const observacionCita = document.getElementById('observacionCita').value.trim();

                cuerpo = `Estado: ${estadoCita}\n` +
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
                         `Observación: ${observacionCita}`;
                break;
            case 'otro':
                cuerpo = document.getElementById('cuerpoOtro').value.trim();
                break;
        }
        return cuerpo;
    }

    function construirPara() {
        if (tipoDestinatario === 'otro') {
            const correoOtro = document.getElementById('correoOtro').value.trim();
            const validacionCorreoOtro = document.getElementById('validacionCorreoOtro');
            const esValido = /^\S+@\S+\.\S+$/.test(correoOtro); // Regex más robusta
            validacionCorreoOtro.classList.toggle('hidden', esValido || correoOtro === '');
            return esValido ? correoOtro : null;
        } else {
            return correosPredefinidos[tipoDestinatario];
        }
    }

    // --- EVENTOS ---
    tabLinks.forEach(link => {
        link.addEventListener('click', () => {
            switchTab(link.dataset.tab);
        });
    });

    // Manejar el cambio de selección de cuerpo para Reembolso
    const selectCuerpoReembolso = document.getElementById('selectCuerpoReembolso');
    if (selectCuerpoReembolso) {
        selectCuerpoReembolso.addEventListener('change', (event) => {
            const predefinido = document.getElementById('cuerpoReembolsoPredefinido');
            const manual = document.getElementById('cuerpoReembolsoManual');
            if (event.target.value === 'manual') {
                predefinido.classList.add('hidden');
                manual.classList.remove('hidden');
            } else {
                predefinido.classList.remove('hidden');
                manual.classList.add('hidden');
            }
        });
    }

    // Manejar el cambio de selección de cuerpo para Aval
    const selectCuerpoAval = document.getElementById('selectCuerpoAval');
    if (selectCuerpoAval) {
        selectCuerpoAval.addEventListener('change', (event) => {
            const predefinido = document.getElementById('cuerpoAvalPredefinido');
            const manual = document.getElementById('cuerpoAvalManual');
            if (event.target.value === 'manual') {
                predefinido.classList.add('hidden');
                manual.classList.remove('hidden');
            } else {
                predefinido.classList.remove('hidden');
                manual.classList.add('hidden');
            }
        });
    }

    // Validación básica de correo para la pestaña 'Otro'
    const correoOtroInput = document.getElementById('correoOtro');
    if (correoOtroInput) {
        correoOtroInput.addEventListener('input', () => {
            const correo = correoOtroInput.value.trim();
            const esValido = /^\S+@\S+\.\S+$/.test(correo);
            document.getElementById('validacionCorreoOtro').classList.toggle('hidden', esValido || correo === '');
        });
    }

    // Activar campo CC si se marca el checkbox
    activarCC.addEventListener("change", () => {
        campoCC.classList.toggle("hidden", !activarCC.checked);
    });

    // Lógica de PDF
    btnGenerarPDF.addEventListener('click', () => {
        const input = document.getElementById("imagenes");
        if (!input.files.length) {
            estadoPDF.textContent = "Por favor selecciona al menos una imagen JPG.";
            return;
        }

        estadoPDF.textContent = "Generando PDF...";
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();
        let pendientes = input.files.length;
        let currentPage = 0;

        // Obtener nombre y apellido para el nombre del PDF
        let nombreParaPDF = '';
        if (tipoDestinatario === 'reembolso') {
            nombreParaPDF = document.getElementById('nombreApellidoReembolso').value.trim();
        } else if (tipoDestinatario === 'aval') {
            nombreParaPDF = document.getElementById('nombreApellidoAval').value.trim();
        }

        Array.from(input.files).forEach((file, i) => {
            const reader = new FileReader();
            reader.onload = function (e) {
                const img = new Image();
                img.src = e.target.result;
                img.onload = function () {
                    if (currentPage > 0) {
                        pdf.addPage();
                    }
                    currentPage++;

                    const imgWidth = img.width;
                    const imgHeight = img.height;
                    const pageWidth = pdf.internal.pageSize.getWidth();
                    const pageHeight = pdf.internal.pageSize.getHeight();

                    const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
                    const scaledWidth = imgWidth * ratio;
                    const scaledHeight = imgHeight * ratio;

                    const x = (pageWidth - scaledWidth) / 2;
                    const y = (pageHeight - scaledHeight) / 2;

                    pdf.addImage(img, 'JPEG', x, y, scaledWidth, scaledHeight);

                    pendientes--;
                    if (pendientes === 0) {
                        pdfBlob = pdf.output("blob");
                        
                        const now = new Date();
                        const fechaHora = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}_${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}`;
                        
                        if (nombreParaPDF) {
                            nombreArchivoPDF = `gastos_medicos_de_${nombreParaPDF.replace(/\s/g, '_')}_${fechaHora}.pdf`;
                        } else {
                            nombreArchivoPDF = `documento_${fechaHora}.pdf`;
                        }

                        estadoPDF.textContent = `PDF generado con éxito: ${nombreArchivoPDF}`;
                        enlaceVerPDF.href = URL.createObjectURL(pdfBlob);
                        enlaceVerPDF.classList.remove('hidden');
                        btnEnviar.disabled = false; // Habilitar botón de enviar una vez que el PDF esté listo
                    }
                };
            };
            reader.readAsDataURL(file);
        });
    });

    // Lógica de Previsualización y Envío
    btnPrevisualizar.addEventListener('click', () => {
        const para = construirPara();
        if (!para) {
            alert("Por favor, selecciona o introduce un destinatario válido.");
            return;
        }

        const asunto = construirAsunto();
        if (!asunto) {
            alert("Faltan datos para construir el asunto. Por favor, completa todos los campos requeridos en la pestaña actual.");
            return;
        }

        const cuerpo = construirCuerpo();
        if (!cuerpo) {
            alert("El cuerpo del mensaje no puede estar vacío.");
            return;
        }

        // Si todo es válido, poblamos el modal y activamos el envío
        document.getElementById('previewPara').textContent = para;
        document.getElementById('previewCC').textContent = activarCC.checked ? document.getElementById('cc').value.trim() : 'Ninguno';
        document.getElementById('previewAsunto').textContent = asunto;
        document.getElementById('previewCuerpo').textContent = cuerpo;
        document.getElementById('previewAdjunto').textContent = nombreArchivoPDF || 'Ninguno';
        
        modalPrevisualizacion.classList.remove('hidden');
        btnEnviar.disabled = false; // Habilitar botón de enviar
    });

    btnCerrarModal.addEventListener('click', () => {
        modalPrevisualizacion.classList.add('hidden');
    });

    btnEnviar.addEventListener('click', async () => {
        // La validación ya se hizo en la previsualización, aquí solo recolectamos y enviamos
        const para = document.getElementById('previewPara').textContent;
        const cc = document.getElementById('previewCC').textContent;
        const asunto = document.getElementById('previewAsunto').textContent;
        const cuerpo = document.getElementById('previewCuerpo').textContent;

        let currentAccessToken = localStorage.getItem('gmail_access_token');

        if (!currentAccessToken) {
            alert("No se encontró un token de acceso. Por favor, re-autoriza la aplicación.");
            window.location.href = 'index.html';
            return;
        }

        try {
            await enviarCorreo(para, (cc !== 'Ninguno' ? cc : ''), asunto, cuerpo, currentAccessToken, pdfBlob, nombreArchivoPDF);
        } catch (error) {
            console.error("Error durante el envío del correo:", error);
            if (error.message.includes("invalid_grant") || error.message.includes("Invalid Credentials")) {
                alert("Tu sesión ha expirado o las credenciales no son válidas. Por favor, re-autoriza la aplicación.");
                window.location.href = 'index.html';
            } else {
                alert("Ocurrió un error al intentar enviar el correo. Por favor, inténtalo de nuevo.");
            }
        }
    });

    async function enviarCorreo(para, cc, asunto, cuerpo, token, attachmentBlob, attachmentName) {
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
            ``
        ];

        if (cc) {
            message.splice(1, 0, `Cc: ${cc}`); // Add Cc header after To
        }

        if (attachmentBlob && attachmentName) {
            const reader = new FileReader();
            reader.readAsDataURL(attachmentBlob);
            reader.onloadend = async function () {
                const base64Attachment = reader.result.split(',')[1];
                message.push(
                    `--foo_bar_baz`,
                    `Content-Type: application/pdf; name="${attachmentName}"`,
                    `Content-Transfer-Encoding: base64`,
                    `Content-Disposition: attachment; filename="${attachmentName}"`,
                    ``,
                    `${base64Attachment}`,
                    `--foo_bar_baz--`
                );

                const rawMessage = message.join('\n');
                const encodedMessage = btoa(rawMessage).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

                try {
                    const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            'raw': encodedMessage
                        })
                    });

                    if (response.ok) {
                        alert('Correo enviado con éxito!');
                        // Opcional: Limpiar formulario o redirigir
                    } else {
                        const errorData = await response.json();
                        console.error('Error al enviar el correo:', errorData);
                        // Si el token es inválido, forzar re-autenticación
                        if (response.status === 401) {
                            alert('Tu sesión ha expirado o las credenciales no son válidas. Por favor, re-autoriza la aplicación.');
                            window.location.href = 'index.html';
                        } else {
                            alert('Error al enviar el correo: ' + (errorData.error ? errorData.error.message : 'Desconocido'));
                        }
                    }
                } catch (error) {
                    console.error('Error de red o inesperado:', error);
                    alert('Error de red o inesperado al enviar el correo.');
                }
            };
        } else {
            // No attachment
            message.push(`--foo_bar_baz--`);
            const rawMessage = message.join('\n');
            const encodedMessage = btoa(rawMessage).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

            try {
                const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        'raw': encodedMessage
                    })
                });

                if (response.ok) {
                    alert('Correo enviado con éxito!');
                    // Opcional: Limpiar formulario o redirigir
                } else {
                    const errorData = await response.json();
                    console.error('Error al enviar el correo:', errorData);
                    // Si el token es inválido, forzar re-autenticación
                    if (response.status === 401) {
                        alert('Tu sesión ha expirado o las credenciales no son válidas. Por favor, re-autoriza la aplicación.');
                        window.location.href = 'index.html';
                    } else {
                        alert('Error al enviar el correo: ' + (errorData.error ? errorData.error.message : 'Desconocido'));
                    }
                }
            } catch (error) {
                console.error('Error de red o inesperado:', error);
                alert('Error de red o inesperado al enviar el correo.');
            }
        }
    }

    // Inicializar la primera pestaña al cargar
    switchTab('reembolso');
});
