// Referencias a elementos del DOM
let authorizeButton;

let appContainer;
let gmailInput;
let changeAccountBtn;
let destinationRadios;
let otroEmailInput;
let ccEmailInput;
let nombreInput;
let cedulaInput;
let telefonoInput;
let mensajeTipoRadios;
let mensajePredefinido;
let mensajePersonalizado;
let mensajeTexto;
let mensajeCustom;
let fileInput;
let selectedFilesContainer;
let previewContainer;
let pdfPreview;
let convertButton;
let savePdfButton;
let sendEmailButton;
let loadingOverlay;
let messageOverlay;
let messageText;
let messageCloseButton;

// Inicializar referencias a elementos del DOM
function initDOMReferences() {
  authorizeButton = document.getElementById('authorize-button');
  
  appContainer = document.getElementById('app-container');
  gmailInput = document.getElementById('gmail-email');
  // changeAccountBtn = document.getElementById('change-account'); // Comentado: Botón de cambiar cuenta
  destinationRadios = document.querySelectorAll('input[name="tipo"]');
  otroEmailInput = document.getElementById('otro-email');
  ccEmailInput = document.getElementById('cc-email');
  nombreInput = document.getElementById('nombre');
  cedulaInput = document.getElementById('cedula');
  telefonoInput = document.getElementById('telefono');
  mensajeTipoRadios = document.querySelectorAll('input[name="mensaje-tipo"]');
  mensajePredefinido = document.getElementById('mensaje-predefinido');
  mensajePersonalizado = document.getElementById('mensaje-personalizado');
  mensajeTexto = document.getElementById('mensaje-texto');
  mensajeCustom = document.getElementById('mensaje-custom');
  fileInput = document.getElementById('file-input');
  selectedFilesContainer = document.getElementById('selected-files');
  previewContainer = document.getElementById('preview-container');
  pdfPreview = document.getElementById('pdf-preview');
  convertButton = document.getElementById('convert-button');
  savePdfButton = document.getElementById('save-pdf');
  sendEmailButton = document.getElementById('send-email');
  loadingOverlay = document.getElementById('loading-overlay');
  messageOverlay = document.getElementById('message-overlay');
  messageText = document.getElementById('message-text');
  messageCloseButton = document.getElementById('message-close');
}

// Variables globales
let selectedFiles = [];
let pdfBlob = null;

const CLIENT_ID = '153822552005-9rgnskk4tvfoaakr4hcnlnssts0scq0r.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/gmail.send'; // Solo permiso para enviar correos

let tokenClient;
let accessToken = null;

let estadoAutorizacion = 0; // 0: no autorizado, 1: esperando, 2: autorizado

function actualizarBotonAutorizacion(estado) {
  authorizeButton.classList.remove('btn-red', 'btn-yellow', 'btn-green');
  switch (estado) {
    case 0:
      authorizeButton.textContent = 'Autorizar el envío';
      authorizeButton.classList.add('btn-red');
      authorizeButton.disabled = false;
      appContainer.classList.add('disabled');
      gmailInput.value = '';
      break;
    case 1:
      authorizeButton.textContent = 'Esperando autorización...';
      authorizeButton.classList.add('btn-yellow');
      authorizeButton.disabled = true;
      break;
    case 2:
      authorizeButton.textContent = 'Autorizado';
      authorizeButton.classList.add('btn-green');
      authorizeButton.disabled = true;
      appContainer.classList.remove('disabled');
      break;
  }
}

function handleCredentialResponse(response) {
  if (response.credential) {
    // Decodificar el token para obtener el email
    const decodedToken = JSON.parse(atob(response.credential.split('.')[1]));
    gmailInput.value = decodedToken.email;

    // Solicitar el token de acceso para la API de Gmail
    tokenClient.requestAccessToken();
  } else {
    estadoAutorizacion = 0;
    actualizarBotonAutorizacion(0);
  }
}

/**
 * Muestra un mensaje en el overlay
 */
function showMessage(text) {
  // Reemplazar saltos de línea con elementos <br>
  if (messageText) {
    messageText.innerHTML = text.replace(/\n/g, '<br>');
    messageOverlay.classList.remove('hidden');
  } else {
    console.error('Error: messageText element not found');
    alert(text);
  }
}

/**
 * Muestra el overlay de carga
 */
function showLoading() {
  loadingOverlay.classList.remove('hidden');
}

/**
 * Oculta el overlay de carga
 */
function hideLoading() {
  loadingOverlay.classList.add('hidden');
}

/**
 * Valida un correo electrónico
 */
function validarEmail(input) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(input.value);
}

/**
 * Actualiza el estilo de un campo de correo electrónico según su validez
 */
function actualizarEstiloEmail(input) {
  const esValido = validarEmail(input) || input.value === '';
  input.style.borderColor = esValido ? '#ccc' : '#e53935';
  return esValido;
}

/**
 * Obtiene el correo de destino según la selección del usuario
 */
function obtenerCorreoDestino() {
  const tipoSeleccionado = document.querySelector('input[name="tipo"]:checked').value;
  
  if (tipoSeleccionado === 'reembolsos') {
    return document.getElementById('reembolsos-email').value;
  } else if (tipoSeleccionado === 'cartaaval') {
    return document.getElementById('cartaaval-email').value;
  } else {
    return otroEmailInput.value;
  }
}

/**
 * Actualiza el mensaje predefinido según el tipo de destinatario
 */
function actualizarMensajePredefinido() {
  const tipoSeleccionado = document.querySelector('input[name="tipo"]:checked').value;
  
  if (tipoSeleccionado === 'reembolsos') {
    mensajeTexto.textContent = 'Anexo se remite documentación en un solo archivo en formato PDF, para la gestión de reembolso por gasto médico.';
  } else if (tipoSeleccionado === 'cartaaval') {
    mensajeTexto.textContent = 'Anexo se remite documentación en un solo archivo en formato PDF, para el tramite de la carta aval.';
  }
}

/**
 * Obtiene el mensaje según la selección del usuario
 */
function obtenerMensaje() {
  const tipoMensaje = document.querySelector('input[name="mensaje-tipo"]:checked').value;
  
  if (tipoMensaje === 'predefinido') {
    return mensajeTexto.textContent;
  } else {
    return mensajeCustom.value;
  }
}

/**
 * Obtiene el asunto del correo
 */
function obtenerAsunto() {
  return `${nombreInput.value} - ${cedulaInput.value} - ${telefonoInput.value}`;
}

/**
 * Agrega un archivo a la lista de archivos seleccionados
 */
function agregarArchivo(file) {
  // Verificar que sea un archivo JPG
  if (!file.type.match('image/jpeg')) {
    showMessage('Solo se permiten archivos JPG');
    return;
  }
  
  // Agregar a la lista de archivos
  selectedFiles.push(file);
  
  // Crear elemento visual
  const fileItem = document.createElement('div');
  fileItem.className = 'file-item';
  fileItem.innerHTML = `
    <span>${file.name}</span>
    <button type="button" data-index="${selectedFiles.length - 1}">×</button>
  `;
  
  // Agregar evento para eliminar
  fileItem.querySelector('button').addEventListener('click', function() {
    const index = parseInt(this.getAttribute('data-index'));
    selectedFiles.splice(index, 1);
    this.parentElement.remove();
    
    // Actualizar índices
    const buttons = selectedFilesContainer.querySelectorAll('button');
    buttons.forEach((btn, i) => {
      btn.setAttribute('data-index', i);
    });
    
    // Mostrar/ocultar el contenedor de vista previa
    if (selectedFiles.length === 0) {
      previewContainer.classList.add('hidden');
    }
  });
  
  selectedFilesContainer.appendChild(fileItem);
  
  // Mostrar el contenedor de vista previa
  previewContainer.classList.remove('hidden');
}

/**
 * Convierte las imágenes seleccionadas a PDF
 */
async function convertirImagenesAPdf() {
  if (selectedFiles.length === 0) {
    showMessage('No hay imágenes seleccionadas');
    return;
  }
  
  showLoading();
  
  try {
    // Crear un nuevo documento PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Procesar cada imagen
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      
      // Convertir la imagen a base64
      const base64 = await convertFileToBase64(file);
      
      // Agregar una nueva página para cada imagen excepto la primera
      if (i > 0) {
        doc.addPage();
      }
      
      // Agregar la imagen al PDF
      const img = new Image();
      img.src = base64;
      
      await new Promise(resolve => {
        img.onload = () => {
          // Calcular dimensiones para ajustar la imagen a la página
          const pageWidth = doc.internal.pageSize.getWidth();
          const pageHeight = doc.internal.pageSize.getHeight();
          
          let imgWidth = img.width;
          let imgHeight = img.height;
          
          // Ajustar la imagen a la página manteniendo la proporción
          if (imgWidth > pageWidth) {
            const ratio = pageWidth / imgWidth;
            imgWidth = pageWidth;
            imgHeight = imgHeight * ratio;
          }
          
          if (imgHeight > pageHeight) {
            const ratio = pageHeight / imgHeight;
            imgHeight = pageHeight;
            imgWidth = imgWidth * ratio;
          }
          
          // Centrar la imagen en la página
          const x = (pageWidth - imgWidth) / 2;
          const y = (pageHeight - imgHeight) / 2;
          
          doc.addImage(base64, 'JPEG', x, y, imgWidth, imgHeight);
          resolve();
        };
      });
    }
    
    // Generar el PDF
    pdfBlob = doc.output('blob');
    
    // Mostrar vista previa
    const pdfUrl = URL.createObjectURL(pdfBlob);
    pdfPreview.innerHTML = `<iframe src="${pdfUrl}" width="100%" height="400px"></iframe>`;
    
    // Mostrar botón de guardar
    savePdfButton.classList.remove('hidden');
    
    hideLoading();
  } catch (error) {
    hideLoading();
    showMessage(`Error al convertir las imágenes: ${error.message}`);
  }
}

/**
 * Convierte un archivo a base64
 */
function convertFileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

/**
 * Guarda el PDF generado
 */
function guardarPdf() {
  if (!pdfBlob) {
    showMessage('No hay PDF para guardar');
    return;
  }
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(pdfBlob);
  link.download = 'documentos.pdf';
  link.click();
}

/**
 * Envía el correo electrónico
 */
async function enviarCorreo() {
  // Validar que el usuario esté autenticado
  if (estadoAutorizacion !== 2 || !accessToken) {
    showMessage('Debe autorizar el acceso a Gmail primero');
    return;
  }
  
  // Validar campos obligatorios
  if (!nombreInput.value || !cedulaInput.value || !telefonoInput.value) {
    showMessage('Debe completar los campos de nombre, cédula y teléfono');
    return;
  }
  
  // Validar correo de destino
  const tipoSeleccionado = document.querySelector('input[name="tipo"]:checked').value;
  if (tipoSeleccionado === 'otro' && !validarEmail(otroEmailInput)) {
    showMessage('Debe ingresar un correo de destino válido');
    return;
  }
  
  // Validar CC si está presente
  if (ccEmailInput.value && !validarEmail(ccEmailInput)) {
    showMessage('El correo CC no es válido');
    return;
  }
  
  // Validar mensaje personalizado si está seleccionado
  const tipoMensaje = document.querySelector('input[name="mensaje-tipo"]:checked').value;
  if (tipoMensaje === 'personalizado' && !mensajeCustom.value) {
    showMessage('Debe escribir un mensaje personalizado');
    return;
  }
  
  // Validar que haya un PDF generado
  if (!pdfBlob) {
    showMessage('Debe convertir las imágenes a PDF primero');
    return;
  }
  
  showLoading();
  
  try {
    // Obtener datos para el correo
    const destinatario = obtenerCorreoDestino();
    const cc = ccEmailInput.value;
    const asunto = obtenerAsunto();
    const mensaje = obtenerMensaje();
    
    // Convertir el PDF a base64
    const pdfBase64 = await convertFileToBase64(pdfBlob);
    const pdfBase64Clean = pdfBase64.split(',')[1]; // Eliminar el prefijo de datos
    
    // Crear el correo en formato MIME
    const boundary = 'enviofacil_boundary';
    let email = [
      'Content-Type: multipart/mixed; boundary="' + boundary + '"',
      'MIME-Version: 1.0',
      'To: ' + destinatario,
      cc ? 'Cc: ' + cc : '',
      'Subject: ' + asunto,
      '',
      '--' + boundary,
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: 7bit',
      '',
      mensaje,
      '',
      '--' + boundary,
      'Content-Type: application/pdf',
      'Content-Disposition: attachment; filename="documentos.pdf"',
      'Content-Transfer-Encoding: base64',
      '',
      pdfBase64Clean,
      '',
      '--' + boundary + '--'
    ].join('\n');
    
    // Codificar el correo en base64
    const encodedEmail = btoa(unescape(encodeURIComponent(email))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+\$/, '');
    
    // Enviar el correo usando fetch con el accessToken
    const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: encodedEmail
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error.message || 'Error al enviar el correo');
    }
    
    hideLoading();
    showMessage('Correo enviado exitosamente');
    
    // Limpiar formulario
    limpiarFormulario();
  } catch (error) {
    hideLoading();
    showMessage(`Error al enviar el correo: ${error.message}`);
  }
}

/**
 * Limpia el formulario después de enviar un correo
 */
function limpiarFormulario() {
  // Limpiar campos de texto
  nombreInput.value = '';
  cedulaInput.value = '';
  telefonoInput.value = '';
  ccEmailInput.value = '';
  mensajeCustom.value = '';
  
  // Restablecer selecciones
  document.querySelector('input[name="tipo"][value="reembolsos"]').checked = true;
  document.querySelector('input[name="mensaje-tipo"][value="predefinido"]').checked = true;
  actualizarMensajePredefinido();
  mostrarOcultarMensaje();
  
  // Limpiar archivos
  selectedFiles = [];
  selectedFilesContainer.innerHTML = '';
  pdfBlob = null;
  pdfPreview.innerHTML = '';
  previewContainer.classList.add('hidden');
  savePdfButton.classList.add('hidden');
  fileInput.value = '';
}

/**
 * Muestra u oculta el campo de mensaje personalizado
 */
function mostrarOcultarMensaje() {
  const tipoMensaje = document.querySelector('input[name="mensaje-tipo"]:checked').value;
  
  if (tipoMensaje === 'predefinido') {
    mensajePredefinido.classList.remove('hidden');
    mensajePersonalizado.classList.add('hidden');
  } else {
    mensajePredefinido.classList.add('hidden');
    mensajePersonalizado.classList.remove('hidden');
  }
}

/**
 * Habilita o deshabilita el campo de correo "otro"
 */
function habilitarDeshabilitarOtro() {
  const tipoSeleccionado = document.querySelector('input[name="tipo"]:checked').value;
  otroEmailInput.disabled = tipoSeleccionado !== 'otro';
  
  if (tipoSeleccionado === 'otro') {
    otroEmailInput.focus();
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar referencias a elementos del DOM
  initDOMReferences();
  
  // Verificar si los elementos necesarios están disponibles
  if (!authorizeButton || !destinationRadios || !otroEmailInput || !mensajeTipoRadios ||
      !mensajePredefinido || !mensajePersonalizado || !mensajeTexto || !mensajeCustom ||
      !fileInput || !convertButton || !savePdfButton || !sendEmailButton || !messageCloseButton) {
    console.error('Error: No se pudieron encontrar todos los elementos DOM necesarios');
    return;
  }
  
  // Inicializar Google Identity Services
  google.accounts.id.initialize({
    client_id: CLIENT_ID,
    callback: handleCredentialResponse
  });

  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (tokenResponse) => {
      console.log('Token Response:', tokenResponse);
      if (tokenResponse.access_token) {
        accessToken = tokenResponse.access_token;
        estadoAutorizacion = 2;
        actualizarBotonAutorizacion(2);
      } else {
        estadoAutorizacion = 0;
        actualizarBotonAutorizacion(0);
        showMessage('Error al obtener el token de acceso.');
      }
    },
  });

  // Configurar el botón de autorización para iniciar la autenticación cuando se haga clic
  authorizeButton.addEventListener('click', () => {
    if (estadoAutorizacion === 0) {
      actualizarBotonAutorizacion(1);
      google.accounts.id.prompt();
    }
  });
  
  // // Cambiar cuenta (Comentado: Botón de cambiar cuenta)
  // changeAccountBtn.addEventListener('click', () => {
  //   // Revocar el token actual y luego solicitar uno nuevo
  //   if (accessToken) {
  //     google.accounts.oauth2.revoke(accessToken, () => {
  //       accessToken = null;
  //       estadoAutorizacion = 0;
  //       actualizarBotonAutorizacion(0);
  //       gmailInput.value = '';
  //       // Después de revocar, iniciar el flujo de autenticación nuevamente
  //       google.accounts.id.prompt();
  //     });
  //   } else {
  //     google.accounts.id.prompt();
  //   }
  // });
  
  // Validar correos
  otroEmailInput.addEventListener('input', () => actualizarEstiloEmail(otroEmailInput));
  ccEmailInput.addEventListener('input', () => actualizarEstiloEmail(ccEmailInput));
  
  // Cambiar tipo de destinatario
  destinationRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      habilitarDeshabilitarOtro();
      actualizarMensajePredefinido();
    });
  });
  
  // Cambiar tipo de mensaje
  mensajeTipoRadios.forEach(radio => {
    radio.addEventListener('change', mostrarOcultarMensaje);
  });
  
  // Seleccionar archivos
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      Array.from(fileInput.files).forEach(file => agregarArchivo(file));
      fileInput.value = ''; // Limpiar para permitir seleccionar el mismo archivo nuevamente
    }
  });
  
  // Convertir a PDF
  convertButton.addEventListener('click', convertirImagenesAPdf);
  
  // Guardar PDF
  savePdfButton.addEventListener('click', guardarPdf);
  
  // Enviar correo
  sendEmailButton.addEventListener('click', enviarCorreo);
  
  // Cerrar mensaje
  messageCloseButton.addEventListener('click', () => {
    messageOverlay.classList.add('hidden');
  });
  
  // Inicializar estados
  habilitarDeshabilitarOtro();
  actualizarMensajePredefinido();
  mostrarOcultarMensaje();
});
