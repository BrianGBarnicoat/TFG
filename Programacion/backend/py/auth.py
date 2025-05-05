import os
import firebase_admin
from firebase_admin import db as rtdb
from firebase_admin import credentials

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from flask import session, url_for, redirect, request, render_template
import json
import requests

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

# Corrección de ruta absoluta para encontrar los archivos de credenciales
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
CREDENTIALS_PATH = os.path.join(BASE_DIR, 'claves seguras', 'google_oauth_credentials.json')

print(f"BASE_DIR: {BASE_DIR}")
print(f"Buscando credenciales en: {os.path.join(BASE_DIR, 'claves seguras')}")

# Configuración de Firebase actualizada para producción
FIREBASE_DB_URL = 'https://tfgpb-448609-default-rtdb.firebaseio.com'
FIREBASE_STORAGE_BUCKET = 'tfgpb-448609.firebasestorage.app'

# Asegurarnos de tener referencia a la Realtime Database
if firebase_admin._apps:
    database = rtdb.reference("/")
else:
    # Configurar Firebase (si no está ya inicializado)
    # Usar el mismo nombre de archivo que en app.py
    firebase_creds_path = os.path.join(BASE_DIR, 'claves seguras', 'firebase_admin_credentials.json')
    
    # Verificar si el archivo existe
    if not os.path.exists(firebase_creds_path):
        print(f"ERROR: El archivo de credenciales no existe en: {firebase_creds_path}")
        print("Intenta especificar la ruta completa en lugar de una ruta relativa.")
        # Intentar buscar el archivo en otras ubicaciones comunes
        alt_paths = [
            os.path.join(BASE_DIR, 'Programacion', 'claves seguras', 'firebase_admin_credentials.json'),
            os.path.join(BASE_DIR, 'claves seguras', 'firebase_credentials.json'),
            os.path.join(os.path.dirname(os.path.dirname(__file__)), 'claves seguras', 'firebase_admin_credentials.json')
        ]
        for alt_path in alt_paths:
            if os.path.exists(alt_path):
                print(f"Archivo encontrado en ruta alternativa: {alt_path}")
                firebase_creds_path = alt_path
                break
    
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
        print("Verifique que las credenciales sean correctas y que tenga permisos para la base de datos.")
        database = None

# Cargar credenciales de Google
GOOGLE_CREDENTIALS_PATH = os.path.join(BASE_DIR, "claves seguras", "google_oauth_credentials.json")
if os.path.exists(GOOGLE_CREDENTIALS_PATH):
    with open(GOOGLE_CREDENTIALS_PATH, 'r') as f:
        google_creds = json.load(f)['web']
else:
    print(f"ERROR: Archivo de credenciales de Google no encontrado en: {GOOGLE_CREDENTIALS_PATH}")
    google_creds = {}

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
    flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_PATH, SCOPES)
    # Genera el redirect_uri que debe coincidir con google_oauth_credentials.json
    flow.redirect_uri = url_for('callback', _external=True)
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        prompt='consent'   # Forzar el consentimiento para obtener un nuevo código
    )
    session['state'] = state
    return redirect(authorization_url)

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

    # Usar redirect_uri generado de forma dinámica que coincida EXACTAMENTE
    redirect_uri = url_for('callback', _external=True)
    token_url = google_creds['token_uri']
    data = {
        'code': code,
        'client_id': google_creds['client_id'],
        'client_secret': google_creds['client_secret'],
        'redirect_uri': redirect_uri,
        'grant_type': 'authorization_code'
    }
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    r = requests.post(token_url, data=data, headers=headers)
    if r.status_code != 200:
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
        return f"Error al verificar el ID Token: {str(e)}", 400

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
        "foto": foto
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

# Nota: El código comentado (por ejemplo, las funciones login y dashboard) está inactivo y no se usa.
