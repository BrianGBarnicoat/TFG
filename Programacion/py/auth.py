import os
import firebase_admin
from firebase_admin import db as rtdb

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from flask import session, url_for, redirect, request
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

# Ruta absoluta al archivo google_oauth_credentials.json
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CREDENTIALS_PATH = os.path.join(BASE_DIR, 'claves seguras', 'google_oauth_credentials.json')

# Asegurarnos de tener referencia a la Realtime Database
if firebase_admin._apps:
    database = rtdb.reference("/")
else:
    database = None

# Cargar credenciales de Google
GOOGLE_CREDENTIALS_PATH = os.path.join(BASE_DIR, "claves seguras", "google_oauth_credentials.json")
with open(GOOGLE_CREDENTIALS_PATH, 'r') as f:
    google_creds = json.load(f)['web']

def get_credentials():
    """
    Devuelve las credenciales (token) de Google guardadas en la sesión
    """
    creds = None
    if 'credentials' in session:  # Busca credenciales en la sesión
        creds = Credentials(**session['credentials'])
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
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

    # Redirigir a la página principal
    return redirect(url_for('principal'))
