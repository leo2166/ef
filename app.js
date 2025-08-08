// --- INICIO: app.js corregido ---

console.log("DEBUG: app.js cargado y ejecutándose.");

// Variable global para almacenar el token de acceso
let accessToken = null;

// Esta es la función que Google llama después de que el usuario se autentica con el botón.
function handleCredentialResponse(response) {
  console.log("DEBUG: handleCredentialResponse FUE LLAMADA.");
  const estadoAuthEl = document.getElementById('estado-autenticacion');

  if (!response || !response.credential) {
    console.error("DEBUG: ERROR: La respuesta de Google no contiene la credencial (ID Token).");
    estadoAuthEl.innerText = 'Error: No se recibió la credencial de Google.';
    estadoAuthEl.className = 'auth-status auth-error';
    return;
  }

  console.log("DEBUG: Se recibió una credencial (ID Token). Ahora se solicitará el Access Token para la API de Gmail.");
  estadoAuthEl.innerText = 'Credencial recibida. Solicitando permiso para Gmail...';
  estadoAuthEl.className = 'auth-status auth-pending';

  const client = google.accounts.oauth2.initTokenClient({
    client_id: '153822552005-9rgnskk4tvfoaakr4hcnlnssts0scq0r.apps.googleusercontent.com',
    scope: 'https://www.googleapis.com/auth/gmail.send',
    callback: (tokenResponse) => {
      console.log("DEBUG: El callback de initTokenClient FUE LLAMADO.");

      if (!tokenResponse || !tokenResponse.access_token) {
        console.error("DEBUG: ERROR: La respuesta del token no contiene el 'access_token'.");
        estadoAuthEl.innerText = 'Error: No se pudo obtener el permiso para Gmail.';
        estadoAuthEl.className = 'auth-status auth-error';
        return;
      }

      accessToken = tokenResponse.access_token;
      console.log('DEBUG: ¡Access Token OBTENIDO con éxito!');
      localStorage.setItem('gmail_access_token', accessToken);
      
      estadoAuthEl.innerText = '¡Autenticación exitosa!';
      estadoAuthEl.className = 'auth-status auth-success';
      document.getElementById('signout_button').style.display = 'block';
      document.querySelector('.g_id_signin').style.display = 'none';
      
      const btnContinuar = document.getElementById('btn-continuar');
      btnContinuar.disabled = false; // Habilitar
    },
    error_callback: (error) => {
        console.error("DEBUG: ERROR en initTokenClient (error_callback):", JSON.stringify(error, null, 2));
        estadoAuthEl.innerText = `Error de autenticación: ${error.type || 'desconocido'}.`;
        estadoAuthEl.className = 'auth-status auth-error';
    }
  });

  console.log("DEBUG: Llamando a client.requestAccessToken()...");
  client.requestAccessToken();
}

async function checkAuth() {
  console.log("DEBUG: Ejecutando checkAuth() para verificar si ya existe un token.");
  const btnContinuar = document.getElementById('btn-continuar');
  const estadoAuthEl = document.getElementById('estado-autenticacion');
  let token = localStorage.getItem('gmail_access_token');

  if (token) {
    console.log("DEBUG: Token encontrado en localStorage. Verificando validez con Google...");
    try {
      const response = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${token}`);
      if (response.ok) {
        console.log("DEBUG: El token es válido. Activando la sesión.");
        accessToken = token;
        estadoAuthEl.innerText = 'Ya estás autenticado. ¡Listo para continuar!';
        estadoAuthEl.className = 'auth-status auth-success';
        document.getElementById('signout_button').style.display = 'block';
        document.querySelector('.g_id_signin').style.display = 'none';
        btnContinuar.disabled = false; // Habilitar
        return; // Salir de la función, todo está OK.
      } else {
        console.log("DEBUG: El token es inválido o ha expirado. Limpiando...");
        localStorage.removeItem('gmail_access_token');
      }
    } catch (error) {
      console.error("DEBUG: Error de red al verificar el token. Asumiendo que no hay sesión.", error);
      localStorage.removeItem('gmail_access_token');
    }
  }

  // Si no hay token o el token fue invalidado, se llega a este punto.
  console.log("DEBUG: No hay un token válido. Configurando para nueva autenticación.");
  accessToken = null;
  estadoAuthEl.innerText = 'Esperando autenticación...';
  estadoAuthEl.className = 'auth-status auth-neutral';
  document.getElementById('signout_button').style.display = 'none';
  document.querySelector('.g_id_signin').style.display = 'block';
  btnContinuar.disabled = true; // Deshabilitar
}

function signOut() {
  console.log("DEBUG: Ejecutando signOut().");
  const token = localStorage.getItem('gmail_access_token');
  const estadoAuthEl = document.getElementById('estado-autenticacion');

  if (token) {
      google.accounts.oauth2.revoke(token, () => {
        console.log('DEBUG: El token de acceso ha sido revocado en Google.');
      });
  }
  google.accounts.id.disableAutoSelect();

  localStorage.removeItem('gmail_access_token');
  accessToken = null;
  
  console.log("DEBUG: Actualizando la interfaz de usuario a 'Sesión cerrada'.");
  estadoAuthEl.innerText = 'Sesión cerrada.';
  estadoAuthEl.className = 'auth-status auth-neutral';
  document.getElementById('signout_button').style.display = 'none';
  document.querySelector('.g_id_signin').style.display = 'block';
  const btnContinuar = document.getElementById('btn-continuar');
  btnContinuar.disabled = true; // Deshabilitar
}

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
// --- FIN: app.js corregido ---
