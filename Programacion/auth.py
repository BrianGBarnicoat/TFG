"""
Módulo para autenticación con Google OAuth
"""
import os
import json
import requests
from flask import redirect, request, session, url_for
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials

# Cambiar la ruta para usar una ubicación relativa al proyecto
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CLIENT_SECRETS_FILE = os.path.join(BASE_DIR, "claves seguras", "google_oauth_credentials.json")
SCOPES = [
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/fitness.activity.read",
    "https://www.googleapis.com/auth/fitness.body.read",
    "https://www.googleapis.com/auth/fitness.sleep.read",
    "https://www.googleapis.com/auth/calendar"
]

# Comprobar si existe el archivo de credenciales
if not os.path.exists(CLIENT_SECRETS_FILE):
    print(f"⚠️ Advertencia: El archivo de credenciales OAuth no existe en: {CLIENT_SECRETS_FILE}")
    # Crear un directorio para las credenciales si no existe
    os.makedirs(os.path.dirname(CLIENT_SECRETS_FILE), exist_ok=True)
    
    # Crear un archivo de ejemplo
    example_credentials = {
        "web": {
            "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
            "project_id": "your-project-id",
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_secret": "YOUR_CLIENT_SECRET",
            "redirect_uris": ["http://127.0.0.1:8000/oauth2callback"],
            "javascript_origins": ["http://127.0.0.1:8000"]
        }
    }
    
    with open(CLIENT_SECRETS_FILE, "w") as f:
        json.dump(example_credentials, f, indent=2)
    
    print(f"✅ Archivo de ejemplo de credenciales OAuth creado en: {CLIENT_SECRETS_FILE}")
    print("⚠️ Por favor, actualiza este archivo con tus credenciales reales antes de continuar")

def autorizar():
    """
    Inicia el flujo de autorización OAuth con Google
    """
    try:
        # Comprobar si existe el archivo de credenciales
        if not os.path.exists(CLIENT_SECRETS_FILE):
            return "Error: No se encontraron credenciales de OAuth. Por favor, configura el archivo de credenciales."
            
        # Obtener las credenciales y configurar el flujo de OAuth
        flow = Flow.from_client_secrets_file(
            CLIENT_SECRETS_FILE, 
            scopes=SCOPES,
            redirect_uri=url_for('callback', _external=True)
        )
        
        # Generar URL de autorización para redirigir al usuario
        authorization_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true'
        )
        
        # Guardar el estado en la sesión para validación
        session['state'] = state
        
        return redirect(authorization_url)
    except Exception as e:
        print(f"Error en autorización OAuth: {str(e)}")
        return f"Error de OAuth: {str(e)}. Verifica el archivo de credenciales."

def oauth2callback():
    """
    Maneja la respuesta de Google después de la autorización
    """
    try:
        # Verificar el estado para protección contra CSRF
        state = session.get('state')
        if state is None or state != request.args.get('state'):
            return "Estado inválido. Posible ataque CSRF.", 403
        
        # Crear el objeto Flow
        flow = Flow.from_client_secrets_file(
            CLIENT_SECRETS_FILE,
            scopes=SCOPES,
            state=state,
            redirect_uri=url_for('callback', _external=True)
        )
        
        # Procesar la respuesta de autorización
        flow.fetch_token(authorization_response=request.url)
        
        # Guardar credenciales en la sesión de forma segura
        credentials = flow.credentials
        
        # Verificar que los atributos necesarios existan antes de usarlos
        session['credentials'] = {}
        
        # Solo guardar los atributos que existen
        if hasattr(credentials, 'token'):
            session['credentials']['token'] = credentials.token
        
        if hasattr(credentials, 'refresh_token') and credentials.refresh_token:
            session['credentials']['refresh_token'] = credentials.refresh_token
            
        if hasattr(credentials, 'token_uri') and credentials.token_uri:
            session['credentials']['token_uri'] = credentials.token_uri
        else:
            # Si no existe, usar el valor por defecto de Google
            session['credentials']['token_uri'] = "https://oauth2.googleapis.com/token"
            
        if hasattr(credentials, 'client_id') and credentials.client_id:
            session['credentials']['client_id'] = credentials.client_id
        
        if hasattr(credentials, 'client_secret') and credentials.client_secret:
            session['credentials']['client_secret'] = credentials.client_secret
            
        if hasattr(credentials, 'scopes') and credentials.scopes:
            session['credentials']['scopes'] = credentials.scopes
            
        # Imprimir un mensaje de diagnóstico
        print("Credenciales guardadas en sesión:", session['credentials'].keys())
        
        # Obtener información del usuario solo si se guardó el token
        userinfo = None
        if 'token' in session['credentials']:
            userinfo = get_user_info(credentials)
        
        if userinfo:
            session['user'] = {
                'id': userinfo.get('sub', ''),  # Google usa 'sub' como ID único
                'email': userinfo.get('email', ''),
                'nombre': userinfo.get('name', ''),
                'foto': userinfo.get('picture', ''),
                'login_method': 'google'
            }
            print(f"Usuario autenticado con Google: {userinfo.get('email', 'email no disponible')}")
        else:
            print("No se pudo obtener información del usuario de Google")
            
        # Asegurar que los cambios se guarden en la sesión
        session.modified = True
        
        return redirect(url_for('principal'))
    except Exception as e:
        print(f"Error en callback OAuth: {str(e)}")
        import traceback
        print(traceback.format_exc())  # Imprimir stack trace completo
        return f"Error al procesar la autenticación: {str(e)}"

def get_user_info(credentials):
    """
    Obtiene la información del usuario usando las credenciales OAuth
    """
    try:
        userinfo_endpoint = "https://www.googleapis.com/oauth2/v3/userinfo"
        
        # Verificar que credentials tiene un token
        if not hasattr(credentials, 'token') or not credentials.token:
            print("Error: Credenciales sin token válido")
            return None
            
        userinfo_response = requests.get(
            userinfo_endpoint,
            headers={'Authorization': f'Bearer {credentials.token}'}
        )
        
        if userinfo_response.status_code == 200:
            return userinfo_response.json()
        else:
            print(f"Error al obtener información de usuario: {userinfo_response.status_code}")
            print(f"Respuesta: {userinfo_response.text}")
            return None
    except Exception as e:
        print(f"Error al obtener información de usuario: {str(e)}")
        return None

# Función para cargar credenciales desde la sesión
def get_credentials_from_session():
    """
    Reconstruye las credenciales de OAuth desde la sesión
    """
    if 'credentials' not in session:
        print("No hay credenciales en la sesión")
        return None
        
    creds_data = session['credentials']
    
    # Verificar que todas las claves necesarias estén presentes
    required_keys = ['token', 'client_id', 'client_secret']
    if not all(key in creds_data for key in required_keys):
        missing_keys = [key for key in required_keys if key not in creds_data]
        print(f"Faltan claves en las credenciales: {missing_keys}")
        return None
        
    # Si falta token_uri, usar el valor por defecto
    if 'token_uri' not in creds_data:
        creds_data['token_uri'] = "https://oauth2.googleapis.com/token"
        
    # Si no hay scopes, usar los predeterminados
    if 'scopes' not in creds_data:
        creds_data['scopes'] = SCOPES
    
    try:
        credentials = Credentials(
            token=creds_data['token'],
            refresh_token=creds_data.get('refresh_token'),
            token_uri=creds_data['token_uri'],
            client_id=creds_data['client_id'],
            client_secret=creds_data['client_secret'],
            scopes=creds_data['scopes']
        )
        return credentials
    except Exception as e:
        print(f"Error al reconstruir credenciales: {str(e)}")
        return None
