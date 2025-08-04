// Nueva versión - 1 de Agosto 2025 (Autenticación Real OAuth 2.0)

const CLIENT_ID = "153822552005-9rgnskk4tvfoaakr4hcnlnssts0scq0r.apps.googleusercontent.com";
const SCOPES = 'https://www.googleapis.com/auth/gmail.send';

let accessToken = null;
let estaAutenticado = false;

window.onload = () => {
    const btnContinuar = document.getElementById("btn-continuar");
    const btnSignOut = document.getElementById("signout_button");
    const estadoAuth = document.getElementById("estado-autenticacion");
    const googleSignInDiv = document.querySelector('.g_id_signin');

    // Función para actualizar la UI
    const actualizarUI = (autenticado) => {
        if (autenticado) {
            estadoAuth.textContent = "¡Autorización exitosa!";
            estadoAuth.style.color = "green";
            googleSignInDiv.style.display = 'none'; // Ocultar el botón de Google
            btnContinuar.style.display = 'block'; // Mostrar botón Continuar
            btnContinuar.classList.add('btn-activo');
            btnSignOut.style.display = 'block';
        } else {
            estadoAuth.textContent = "Esperando autorización...";
            estadoAuth.style.color = "orange";
            googleSignInDiv.style.display = 'block'; // Mostrar el botón de Google
            btnContinuar.style.display = 'none'; // Ocultar botón Continuar
            btnContinuar.classList.remove('btn-activo');
            btnSignOut.style.display = 'none';
        }
    };

    // Callback para la respuesta de credenciales de Google
    window.handleCredentialResponse = (response) => {
        if (response && response.credential) {
            console.log("ID Token recibido:", response.credential);
            // Aquí puedes decodificar el ID token si necesitas información del usuario
            // const payload = JSON.parse(atob(response.credential.split('.')[1]));
            // console.log("Payload:", payload);

            // Para obtener el access token para la Gmail API, necesitamos el flujo de OAuth 2.0 completo
            // El ID token es para autenticación, no para autorización de APIs.
            // Necesitamos iniciar el flujo de OAuth 2.0 para obtener el access token.
            // Esto se hará a través de tokenClient.requestAccessToken

            // Almacenar el ID token si es necesario para alguna validación posterior
            localStorage.setItem('google_id_token', response.credential);

            // Iniciar el flujo para obtener el access token
            tokenClient.requestAccessToken({ prompt: 'consent' });

        } else {
            console.error("No se recibió el ID Token.");
            estaAutenticado = false;
            actualizarUI(false);
            estadoAuth.textContent = "Error en la autenticación.";
            estadoAuth.style.color = "red";
        }
    };

    // 1. Inicializar el cliente de Google OAuth para obtener el Access Token
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (tokenResponse) => {
            if (tokenResponse && tokenResponse.access_token) {
                console.log("Access Token obtenido!");
                accessToken = tokenResponse.access_token;
                estaAutenticado = true;
                localStorage.setItem('gmail_access_token', accessToken);
                actualizarUI(true);
            } else {
                console.error("No se pudo obtener el Access Token.");
                estaAutenticado = false;
                actualizarUI(false);
                estadoAuth.textContent = "Error en la autorización.";
                estadoAuth.style.color = "red";
            }
        },
    });

    // 2. Inicializar el botón de Google Sign-In (para el ID Token)
    google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: window.handleCredentialResponse, // Usar el callback definido globalmente
        auto_prompt: false
    });

    google.accounts.id.renderButton(
        googleSignInDiv,
        {
            type: "standard",
            size: "large",
            theme: "filled_blue",
            text: "authorize",
            shape: "pill",
            logo_alignment: "left"
        }
    );

    // Pequeña pausa para asegurar que el script de Google termine de renderizar
    setTimeout(() => {
        googleSignInDiv.style.visibility = 'visible';
    }, 250); // 250ms de espera

    // 3. Lógica del botón Continuar
    btnContinuar.addEventListener("click", () => {
        if (estaAutenticado) {
            window.location.href = "pantalla2.html";
        } 
    });
    
    // 4. Lógica del botón de cerrar sesión
    btnSignOut.addEventListener("click", () => {
        if(accessToken){
            google.accounts.oauth2.revoke(accessToken, () => {
                console.log('Token revocado.');
                accessToken = null;
                estaAutenticado = false;
                localStorage.removeItem('gmail_access_token');
                localStorage.removeItem('google_id_token'); // También remover el ID token
                actualizarUI(false);
            });
        }
    });

    // Estado inicial de la UI al cargar
    actualizarUI(false);
};