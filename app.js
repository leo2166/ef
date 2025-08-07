// --- INICIO: app.js con depuración ---

console.log("DEBUG: app.js cargado y ejecutándose.");

// Variable global para almacenar el token de acceso
let accessToken = null;

// Esta es la función que Google llama después de que el usuario se autentica con el botón.
function handleCredentialResponse(response) {
  console.log("DEBUG: handleCredentialResponse FUE LLAMADA.");
  console.log("DEBUG: La respuesta completa de Google es:", response);

  if (!response || !response.credential) {
    console.error("DEBUG: ERROR: La respuesta de Google no contiene la credencial (ID Token).");
    document.getElementById('estado-autenticacion').innerText = 'Error: No se recibió la credencial de Google.';
    return;
  }

  console.log("DEBUG: Se recibió una credencial (ID Token). Ahora se solicitará el Access Token para la API de Gmail.");
  document.getElementById('estado-autenticacion').innerText = 'Credencial recibida. Solicitando permiso para Gmail...';

  // Ahora que tenemos el ID token, solicitamos el Access Token para la API de Gmail.
  const client = google.accounts.oauth2.initTokenClient({
    client_id: '153822552005-9rgnskk4tvfoaakr4hcnlnssts0scq0r.apps.googleusercontent.com',
    scope: 'https://www.googleapis.com/auth/gmail.send',
    callback: (tokenResponse) => {
      console.log("DEBUG: El callback de initTokenClient FUE LLAMADO.");
      console.log("DEBUG: La respuesta del token es:", tokenResponse);

      if (!tokenResponse || !tokenResponse.access_token) {
        console.error("DEBUG: ERROR: La respuesta del token no contiene el 'access_token'.");
        document.getElementById('estado-autenticacion').innerText = 'Error: No se pudo obtener el permiso para Gmail.';
        return;
      }

      accessToken = tokenResponse.access_token;
      console.log('DEBUG: ¡Access Token OBTENIDO con éxito!', accessToken);
      localStorage.setItem('gmail_access_token', accessToken);
      
      // Actualizar UI
      console.log("DEBUG: Actualizando la interfaz de usuario a 'Autenticado'.");
      document.getElementById('estado-autenticacion').innerText = '¡Autenticación exitosa!';
      document.getElementById('signout_button').style.display = 'block';
      document.querySelector('.g_id_signin').style.display = 'none';
      document.getElementById('btn-continuar').disabled = false;
      document.getElementById('btn-continuar').classList.add('btn-activo');
    },
    error_callback: (error) => {
        console.error("DEBUG: ERROR en initTokenClient (error_callback):", JSON.stringify(error, null, 2));
        document.getElementById('estado-autenticacion').innerText = `Error de autenticación: ${error.type || 'desconocido'}.`;
    }
  });

  console.log("DEBUG: Llamando a client.requestAccessToken()...");
  client.requestAccessToken();
  console.log("DEBUG: La llamada a client.requestAccessToken() ha sido ejecutada (esto no significa que ya se tenga el token).");
}

function checkAuth() {
  console.log("DEBUG: Ejecutando checkAuth() para verificar si ya existe un token.");
  accessToken = localStorage.getItem('gmail_access_token');
  
  if (accessToken) {
    console.log("DEBUG: Se encontró un token en localStorage:", accessToken);
    document.getElementById('estado-autenticacion').innerText = 'Ya estás autenticado.';
    document.getElementById('signout_button').style.display = 'block';
    document.querySelector('.g_id_signin').style.display = 'none';
    document.getElementById('btn-continuar').disabled = false;
    document.getElementById('btn-continuar').classList.add('btn-activo');
  } else {
    console.log("DEBUG: No se encontró un token en localStorage.");
    document.getElementById('estado-autenticacion').innerText = 'Esperando autenticación...';
    document.getElementById('btn-continuar').disabled = true;
    document.getElementById('btn-continuar').classList.remove('btn-activo');
  }
}

function signOut() {
  console.log("DEBUG: Ejecutando signOut().");
  const token = localStorage.getItem('gmail_access_token');
  if (token) {
      // Revocar el token es la forma correcta de cerrar sesión para que Google pida la cuenta de nuevo.
      google.accounts.oauth2.revoke(token, () => {
        console.log('DEBUG: El token de acceso ha sido revocado en Google.');
      });
  }

  localStorage.removeItem('gmail_access_token');
  accessToken = null;
  
  // Actualizar UI
  console.log("DEBUG: Actualizando la interfaz de usuario a 'Sesión cerrada'.");
  document.getElementById('estado-autenticacion').innerText = 'Sesión cerrada.';
  document.getElementById('signout_button').style.display = 'none';
  document.querySelector('.g_id_signin').style.display = 'block';
  document.getElementById('btn-continuar').disabled = true;
  document.getElementById('btn-continuar').classList.remove('btn-activo');
}


// Se ejecuta cuando toda la página (imágenes, etc.) ha cargado.
window.onload = function () {
  console.log("DEBUG: window.onload FUE LLAMADO.");
  
  // Comprobar estado de autenticación al cargar la página
  checkAuth();

  // Asignar evento al botón de cerrar sesión
  const signOutButton = document.getElementById('signout_button');
  if (signOutButton) {
    console.log("DEBUG: Asignando evento 'click' al botón de cerrar sesión.");
    signOutButton.onclick = signOut;
  } else {
    console.error("DEBUG: ERROR: No se encontró el botón de cerrar sesión (signout_button).");
  }

  // Evento para el botón Continuar
  const continueButton = document.getElementById('btn-continuar');
  if (continueButton) {
    console.log("DEBUG: Asignando evento 'click' al botón de continuar.");
    continueButton.addEventListener('click', () => {
      if (!continueButton.disabled) {
        console.log("DEBUG: Botón 'Continuar' presionado. Redirigiendo a pantalla2.html");
        window.location.href = 'pantalla2.html';
      } else {
        console.log("DEBUG: Botón 'Continuar' presionado, pero está deshabilitado.");
      }
    });
  } else {
    console.error("DEBUG: ERROR: No se encontró el botón de continuar (btn-continuar).");
  }
};

console.log("DEBUG: Fin del script app.js.");
// --- FIN: app.js con depuración ---