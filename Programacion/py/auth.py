import os
import firebase_admin
from firebase_admin import db as rtdb
from firebase_admin import credentials

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow, Flow
from google.auth.transport.requests import Request
from flask import session, url_for, redirect, request, render_template
import json
import requests

# Detectar entorno de ejecución
IS_PRODUCTION = os.getenv('RAILWAY_PUBLIC_DOMAIN') is not None
print(f"Auth ejecutando en entorno de {'producción' if IS_PRODUCTION else 'desarrollo'}")

# Definimos los alcances que necesitamos
SCOPES = [
    'https://www.googleapis.com/auth/fitness.activity.read',
    'https://www.googleapis.com/auth/fitness.sleep.read',
    'https://www.googleapis.com/auth/fitness.body.read',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
    'openid'
]

# Configuración de Firebase
FIREBASE_DB_URL = os.getenv('FIREBASE_DB_URL', 'https://tfgpb-448609-default-rtdb.firebaseio.com')
FIREBASE_STORAGE_BUCKET = os.getenv('FIREBASE_STORAGE_BUCKET', 'tfgpb-448609.firebasestorage.app')

# --------------------------------------------------------------------
# Inicialización de Firebase
# --------------------------------------------------------------------
# Asegurarnos de tener referencia a la Realtime Database
if firebase_admin._apps:
    database = rtdb.reference("/")
else:
    # En producción, usar exclusivamente variables de entorno
    if IS_PRODUCTION:
        firebase_credentials_json = os.getenv('FIREBASE_CREDENTIALS')
        if not firebase_credentials_json:
            print("⚠️ Error: La variable FIREBASE_CREDENTIALS no está configurada.")
            database = None
        else:
            try:
                firebase_creds = json.loads(firebase_credentials_json)
                cred = credentials.Certificate(firebase_creds)
                firebase_admin.initialize_app(cred, {
                    'databaseURL': FIREBASE_DB_URL,
                    'storageBucket': FIREBASE_STORAGE_BUCKET
                })
                database = rtdb.reference("/")
                print("Firebase inicializado correctamente con credenciales desde variable de entorno")
            except Exception as e:
                print(f"ERROR al inicializar Firebase desde variable de entorno: {e}")
                database = None
    else:
        # En desarrollo, comprobar primero variable de entorno, luego archivo
        firebase_credentials_json = os.getenv('FIREBASE_CREDENTIALS')
        if firebase_credentials_json:
            try:
                firebase_creds = json.loads(firebase_credentials_json)
                cred = credentials.Certificate(firebase_creds)
                firebase_admin.initialize_app(cred, {
                    'databaseURL': FIREBASE_DB_URL,
                    'storageBucket': FIREBASE_STORAGE_BUCKET
                })
                database = rtdb.reference("/")
                print("Firebase inicializado correctamente con credenciales desde variable de entorno")
            except Exception as e:
                print(f"ERROR al inicializar Firebase desde variable de entorno: {e}")
                database = None
        else:
            # Si no hay variable de entorno, usar el archivo de credenciales
            BASE_DIR = os.path.abspath(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
            firebase_creds_path = os.path.join(BASE_DIR, 'claves seguras', 'firebase_admin_credentials.json')
            
            # Verificar si el archivo existe
            if not os.path.exists(firebase_creds_path):
                print(f"ERROR: El archivo de credenciales no existe en: {firebase_creds_path}")
                database = None
            else:
                try:
                    cred = credentials.Certificate(firebase_creds_path)
                    firebase_admin.initialize_app(cred, {
                        'databaseURL': FIREBASE_DB_URL,
                        'storageBucket': FIREBASE_STORAGE_BUCKET
                    })
                    database = rtdb.reference("/")
                    print(f"Firebase inicializado correctamente con credenciales desde: {firebase_creds_path}")
                except Exception as e:
                    print(f"ERROR al inicializar Firebase: {e}")
                    database = None

# --------------------------------------------------------------------
# Cargar credenciales de Google OAuth
# --------------------------------------------------------------------
google_creds = {}
google_credentials_json = os.getenv('GOOGLE_OAUTH_CREDENTIALS')

# En producción, usar exclusivamente variables de entorno
if IS_PRODUCTION:
    if not google_credentials_json:
        print("⚠️ Error: La variable GOOGLE_OAUTH_CREDENTIALS no está configurada.")
    else:
        try:
            google_creds = json.loads(google_credentials_json)['web']
            print("Credenciales de Google OAuth cargadas desde variable de entorno")
        except Exception as e:
            print(f"ERROR al cargar credenciales de Google OAuth: {e}")
else:
    # En desarrollo, comprobar primero variable de entorno, luego archivo
    if google_credentials_json:
        try:
            google_creds = json.loads(google_credentials_json)['web']
            print("Credenciales de Google OAuth cargadas desde variable de entorno en desarrollo")
        except Exception as e:
            print(f"ERROR al cargar credenciales de Google OAuth desde variable de entorno: {e}")
            
    # Si no se pudieron cargar desde la variable de entorno, intentar con archivo
    if not google_creds:
        BASE_DIR = os.path.abspath(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
        GOOGLE_CREDENTIALS_PATH = os.path.join(BASE_DIR, "claves seguras", "google_oauth_credentials.json")
        if os.path.exists(GOOGLE_CREDENTIALS_PATH):
            try:
                with open(GOOGLE_CREDENTIALS_PATH, 'r') as f:
                    google_creds = json.load(f)['web']
                print(f"Credenciales de Google OAuth cargadas desde: {GOOGLE_CREDENTIALS_PATH}")
            except Exception as e:
                print(f"ERROR al cargar archivo de credenciales de Google: {e}")
        else:
            print(f"ERROR: Archivo de credenciales de Google no encontrado en: {GOOGLE_CREDENTIALS_PATH}")

# --------------------------------------------------------------------
# Funciones de autenticación OAuth
# --------------------------------------------------------------------
def get_credentials():
    """
    Devuelve las credenciales (token) de Google guardadas en la sesión.
    Si no se encuentra 'refresh_token', retorna None para forzar la reautorización.
    """
    creds = None
    if 'credentials' in session:
        creds_data = session['credentials']
        if 'refresh_token' not in creds_data or not creds_data['refresh_token']:
            # El refresh_token es esencial para refrescar el acceso; forzamos reautorización.
            return None
        creds = Credentials(**creds_data)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:  # Corregido: && por and
            try:
                creds.refresh(Request())
            except Exception:
                del session['credentials']
                return None
        else:
            return None
        session['credentials'] = creds_to_dict(creds)
    return creds

def creds_to_dict(creds):
    return {
        'token': creds.token,
        'refresh_token': creds.refresh_token,
        'token_uri': creds.token_uri,
        'client_id': creds.client_id,
        'client_secret': creds.client_secret,
        'scopes': creds.scopes
    }

def autorizar():
    """
    Redirige al usuario a la pantalla de consentimiento de Google
    """
    # Verificar si tenemos credenciales de Google
    if not google_creds:
        print("ERROR: No se encontraron credenciales de Google OAuth")
        return "No se encontraron credenciales de Google OAuth. Contacte al administrador.", 500

    # Determinar el redirect_uri basado en el entorno
    redirect_uri = None
    
    # Si estamos en Railway o producción, usar el dominio público
    if IS_PRODUCTION:
        if os.getenv("RAILWAY_PUBLIC_DOMAIN"):
            redirect_uri = f"https://{os.getenv('RAILWAY_PUBLIC_DOMAIN')}/oauth2callback"
        # Si se ha configurado un dominio personalizado
        elif os.getenv("CUSTOM_DOMAIN"):
            redirect_uri = f"https://{os.getenv('CUSTOM_DOMAIN')}/oauth2callback"
        else:
            # Usar un fallback si no hay ningún dominio configurado
            redirect_uri = url_for('callback', _external=True)
        
        print(f"Usando redirect_uri para producción: {redirect_uri}")
    else:
        # En desarrollo, usar el redirect_uri generado por Flask
        redirect_uri = url_for('callback', _external=True)
        print(f"Usando redirect_uri para desarrollo: {redirect_uri}")
    
    # Crear flujo desde configuración
    try:
        # En producción, crear flujo directamente desde las credenciales en memoria
        client_config = {
            "web": google_creds
        }
        flow = Flow.from_client_config(client_config, SCOPES, redirect_uri=redirect_uri)
        
        authorization_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='consent'   # Forzar el consentimiento para obtener un nuevo código
        )
        session['state'] = state
        return redirect(authorization_url)
    except Exception as e:
        print(f"ERROR en autorizar(): {e}")
        return f"Error al iniciar la autorización: {str(e)}", 500

def oauth2callback():
    """
    Recibe la respuesta de Google, intercambia el 'code' por el token
    y registra/actualiza al usuario en Realtime Database.
    """
    code = request.args.get('code')
    state = request.args.get('state')
    # Validar que el estado concuerde
    if state != session.get('state'):
        return "Estado no coincide", 400
    if not code:
        return "Falta el parámetro 'code'", 400

    # Determinar el redirect_uri correcto basado en el entorno
    if os.getenv("RAILWAY_PUBLIC_DOMAIN"):
        redirect_uri = f"https://{os.getenv('RAILWAY_PUBLIC_DOMAIN')}/oauth2callback"
    else:
        redirect_uri = url_for('callback', _external=True)

    # Obtener el token
    token_url = google_creds['token_uri']
    data = {
        'code': code,
        'client_id': google_creds['client_id'],
        'client_secret': google_creds['client_secret'],
        'redirect_uri': redirect_uri,
        'grant_type': 'authorization_code'
    }
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    
    try:
        r = requests.post(token_url, data=data, headers=headers)
        if r.status_code != 200:
            print(f"Error al obtener token: {r.text}")
            return f"Error al obtener token: {r.text}", r.status_code

        token_response = r.json()
        session['google_token'] = token_response

        # Verificar el ID Token con tolerancia al desfase (clock skew)
        from google.oauth2 import id_token
        from google.auth.transport import requests as g_requests

        try:
            user_info = id_token.verify_oauth2_token(
                token_response['id_token'],
                g_requests.Request(),
                google_creds['client_id'],
                clock_skew_in_seconds=300  # Permite un desfase de 5 minutos
            )
        except ValueError as e:
            print(f"Error al verificar ID Token: {str(e)}")
            return f"Error al verificar el ID Token: {str(e)}", 400

        # Procesar información del usuario y guardarla en la sesión/DB
        # Extraer datos del usuario
        email = user_info.get("email")
        nombre = user_info.get("name", "")
        foto = user_info.get("picture", "")

        # Registrar o actualizar en la Realtime Database
        if database is not None and email:
            email_key = email.replace('.', '_')
            usuario_ref = database.child("usuarios").child(email_key)
            usuario_data = usuario_ref.get()

            if not usuario_data:
                usuario_ref.set({
                    "nombre": nombre,
                    "email": email,
                    "foto": foto,
                    "creado_via": "google_oauth"
                })
            else:
                usuario_ref.update({
                    "nombre": nombre,
                    "foto": foto
                })

        # Guardar información del usuario en la sesión
        session["user"] = {
            "nombre": nombre,
            "email": email,
            "foto": foto,
            "login_method": "google" # Añadir método de login explícitamente
        }

        # Guardar las credenciales en la sesión
        session['credentials'] = {
            'token': token_response['access_token'],
            'refresh_token': token_response.get('refresh_token'),
            'token_uri': google_creds['token_uri'],
            'client_id': google_creds['client_id'],
            'client_secret': google_creds['client_secret'],
            'scopes': SCOPES
        }

        # Redirigir a la página de alimentación (en lugar de a la principal)
        return redirect(url_for('alimentacion'))
    
    except Exception as e:
        print(f"ERROR en oauth2callback(): {e}")
        return f"Error durante el callback: {str(e)}", 500

# Eliminado (o comentado) código no referenciado:
# def login():
#     """
#     Maneja el inicio de sesión con email/password y carga preferencias de tema desde Firebase
#     """
#     # ...existing code...
#     return render_template('login.html')
#
# def dashboard():
#     """
#     Muestra el panel de control después de iniciar sesión
#     """
#     if 'user' in session:
#         return render_template('dashboard.html')
#     return redirect(url_for('login'))
