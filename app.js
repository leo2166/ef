let accessToken = null;

// Función única para actualizar la UI basada en el estado de autenticación
const updateUi = () => {
  accessToken = localStorage.getItem('gmail_access_token');
  const estadoAuthEl = document.getElementById('estado-autenticacion');
  const btnContinuar = document.getElementById('btn-continuar');
  const signOutButton = document.getElementById('signout_button');
  const signInButton = document.querySelector('.g_id_signin');

  if (accessToken) {
    // Estado: Autenticado
    estadoAuthEl.innerText = '¡Autenticación exitosa!';
    estadoAuthEl.className = 'auth-status auth-success';
    btnContinuar.disabled = false; // Solo habilitar/deshabilitar
    signOutButton.style.display = 'block';
    signInButton.style.display = 'none';
  } else {
    // Estado: No autenticado
    estadoAuthEl.innerText = 'Esperando autenticación...';
    estadoAuthEl.className = 'auth-status auth-neutral';
    btnContinuar.disabled = true; // Solo habilitar/deshabilitar
    signOutButton.style.display = 'none';
    signInButton.style.display = 'block';
  }
};

// Google llama a esta función después de la autenticación
function handleCredentialResponse(response) {
  const estadoAuthEl = document.getElementById('estado-autenticacion');
  if (!response.credential) {
    estadoAuthEl.innerText = 'Error: No se recibió la credencial de Google.';
    estadoAuthEl.className = 'auth-status auth-error';
    return;
  }

  estadoAuthEl.innerText = 'Credencial recibida. Solicitando permiso para Gmail...';
  estadoAuthEl.className = 'auth-status auth-pending';

  const client = google.accounts.oauth2.initTokenClient({
    client_id: '153822552005-9rgnskk4tvfoaakr4hcnlnssts0scq0r.apps.googleusercontent.com',
    scope: 'https://www.googleapis.com/auth/gmail.send',
    callback: (tokenResponse) => {
      if (tokenResponse && tokenResponse.access_token) {
        localStorage.setItem('gmail_access_token', tokenResponse.access_token);
      } else {
        localStorage.removeItem('gmail_access_token');
        console.error("No se pudo obtener el token de acceso.");
      }
      // Actualizar la UI después de la operación
      updateUi();
    },
  });
  client.requestAccessToken();
}

// Función para cerrar sesión
function signOut() {
  const token = localStorage.getItem('gmail_access_token');
  if (token) {
    google.accounts.oauth2.revoke(token, () => {
      console.log('Token de acceso revocado.');
      localStorage.removeItem('gmail_access_token');
      // Actualizar la UI después de revocar
      updateUi();
    });
  } else {
    // Si no había token, solo actualizar la UI
    updateUi();
  }
}

// Se ejecuta cuando la página y los scripts de Google han cargado
window.onload = () => {
  // Configurar listeners de botones
  document.getElementById('signout_button').onclick = signOut;
  document.getElementById('btn-continuar').addEventListener('click', () => {
    if (!document.getElementById('btn-continuar').disabled) {
      window.location.href = 'pantalla2.html';
    }
  });

  // La primera actualización de la UI
  updateUi();
};