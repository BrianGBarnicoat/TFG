#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import os
import threading
import time
import json
from datetime import datetime, timedelta

import firebase_admin
from firebase_admin import credentials, db as rtdb, storage
from flask import Flask, render_template, request, session, redirect, url_for, send_from_directory, jsonify
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from werkzeug.utils import secure_filename
import functools

# Importar módulos auxiliares (estos archivos pueden mantenerse separados)
from auth import autorizar as google_autorizar, oauth2callback
from calendar_api import agregar_evento, get_calendar_events
from fitness import get_fitness_data, get_sleep_data

# --------------------------------------------------------------------
# Detectar entorno de ejecución
# --------------------------------------------------------------------
IS_PRODUCTION = os.getenv('RAILWAY_PUBLIC_DOMAIN') is not None
print(f"Ejecutando en entorno de {'producción' if IS_PRODUCTION else 'desarrollo'}")

# --------------------------------------------------------------------
# Configuración de Firebase
# --------------------------------------------------------------------

# En producción, forzar uso exclusivo de variables de entorno para mayor seguridad
if IS_PRODUCTION:
    print("Entorno de producción detectado: utilizando variables de entorno exclusivamente")
    firebase_credentials_json = os.getenv('FIREBASE_CREDENTIALS')
    FIREBASE_DB_URL = os.getenv('FIREBASE_DB_URL')
    FIREBASE_STORAGE_BUCKET = os.getenv('FIREBASE_STORAGE_BUCKET')
    
    # Verificación detallada de variables requeridas
    if not firebase_credentials_json:
        print("⚠️ ERROR CRÍTICO: La variable FIREBASE_CREDENTIALS no está configurada en Railway")
        print("Consulta la documentación para configurar correctamente esta variable")
        sys.exit(1)
        
    if not FIREBASE_DB_URL:
        print("⚠️ ERROR: FIREBASE_DB_URL no está configurada. Usando URL por defecto.")
        FIREBASE_DB_URL = 'https://tfgpb-448609-default-rtdb.firebaseio.com'
        
    if not FIREBASE_STORAGE_BUCKET:
        print("⚠️ ERROR: FIREBASE_STORAGE_BUCKET no está configurada. Usando bucket por defecto.")
        FIREBASE_STORAGE_BUCKET = 'tfgpb-448609.firebasestorage.app'
else:
    # En desarrollo, permitir fallback a archivos locales
    firebase_credentials_json = os.getenv('FIREBASE_CREDENTIALS')
    FIREBASE_DB_URL = os.getenv('FIREBASE_DB_URL', 'https://tfgpb-448609-default-rtdb.firebaseio.com')
    FIREBASE_STORAGE_BUCKET = os.getenv('FIREBASE_STORAGE_BUCKET', 'tfgpb-448609.firebasestorage.app')

print(f"URLs de Firebase: DB={FIREBASE_DB_URL}, Storage={FIREBASE_STORAGE_BUCKET}")

# Inicializar Firebase
database = None
if not firebase_admin._apps:
    try:
        # En producción, el código es más simple y directo
        if IS_PRODUCTION:
            try:
                print("Iniciando Firebase con credenciales desde variable de entorno...")
                # Parsear el JSON de las credenciales
                firebase_creds = json.loads(firebase_credentials_json)
                
                # Verificar que el JSON tiene la estructura esperada
                if 'type' not in firebase_creds or firebase_creds['type'] != 'service_account':
                    print("⚠️ ERROR: El JSON de FIREBASE_CREDENTIALS no es una cuenta de servicio válida")
                    sys.exit(1)
                    
                # Inicializar con las credenciales
                cred = credentials.Certificate(firebase_creds)
                firebase_admin.initialize_app(cred, {
                    'databaseURL': FIREBASE_DB_URL,
                    'storageBucket': FIREBASE_STORAGE_BUCKET
                })
                
                # Verificar que la conexión funciona
                database = rtdb.reference("/_railway_test")
                database.set({"test": True, "timestamp": str(datetime.now())})
                print("🔥 Firebase inicializado correctamente desde variable de entorno")
            except json.JSONDecodeError:
                print("⚠️ ERROR: El valor de FIREBASE_CREDENTIALS no es un JSON válido")
                print("Verifica que la variable esté correctamente formateada sin comillas adicionales")
                print("Usa el Raw Editor en Railway para configurar esta variable")
                sys.exit(1)
            except Exception as e:
                print(f"⚠️ ERROR al inicializar Firebase: {str(e)}")
                print("Verifica las credenciales y URLs de Firebase")
                sys.exit(1)
        else:
            # En desarrollo, mantener compatibilidad con archivo local
            if firebase_credentials_json:
                firebase_creds = json.loads(firebase_credentials_json)
                cred = credentials.Certificate(firebase_creds)
                print("Usando credenciales de Firebase desde variable de entorno en desarrollo")
            else:
                # Usar archivo físico como fallback
                print("Variable FIREBASE_CREDENTIALS no encontrada, intentando usar archivo físico")
                BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
                CREDENTIALS_PATH = os.path.join(BASE_DIR, "claves seguras", "firebase_admin_credentials.json")
                
                if not os.path.exists(CREDENTIALS_PATH):
                    print("⚠️ Error: El archivo de credenciales no existe en la ruta:", CREDENTIALS_PATH)
                    sys.exit(1)
                
                cred = credentials.Certificate(CREDENTIALS_PATH)
                print(f"Usando credenciales de Firebase desde archivo: {CREDENTIALS_PATH}")
            
            # Inicializar la aplicación con las URLs
            firebase_admin.initialize_app(cred, {
                'databaseURL': FIREBASE_DB_URL,
                'storageBucket': FIREBASE_STORAGE_BUCKET
            })
        
        # Verificar conexión a la base de datos
        database = rtdb.reference("/")
        test_value = database.get()
        print("🔥 Realtime Database inicializado correctamente")
        
        # Verificar storage
        bucket = storage.bucket()
        print(f"🔥 Firebase Storage inicializado. Bucket: {bucket.name}")
        
    except Exception as e:
        print(f"⚠️ Error general al inicializar Firebase: {e}")
        if IS_PRODUCTION:
            sys.exit(1)
        database = None
else:
    database = rtdb.reference("/")

# --------------------------------------------------------------------
# Configuración de rutas para archivos y directorios
# --------------------------------------------------------------------
# Ajustar rutas según el entorno (Railway vs. desarrollo local)
BASE_DIR = os.path.abspath(os.path.dirname(__file__))  # /app/Programacion/py o D:/TFG/Programacion/py
TEMPLATES_DIR = os.path.join(BASE_DIR, '..', 'templates')  # Sube un nivel y va a templates
STATIC_DIR = os.path.join(BASE_DIR, '..', 'static')  # Sube un nivel y va a static
LOGIN_DIR = os.path.join(BASE_DIR, '..', 'Login')  # Sube un nivel y va a Login
PROFILE_DIR = os.path.join(BASE_DIR, '..', 'profile')  # Sube un nivel y va a profile

print(f"Directorios de la aplicación:")
print(f"- BASE_DIR: {BASE_DIR}")
print(f"- TEMPLATES_DIR: {TEMPLATES_DIR}")
print(f"- STATIC_DIR: {STATIC_DIR}")
print(f"- LOGIN_DIR: {LOGIN_DIR}")
print(f"- PROFILE_DIR: {PROFILE_DIR}")

# Verificar que los directorios existen
dirs_to_check = [TEMPLATES_DIR, STATIC_DIR, LOGIN_DIR, PROFILE_DIR]
for dir_path in dirs_to_check:
    if not os.path.exists(dir_path):
        print(f"⚠️ Advertencia: El directorio no existe: {dir_path}")

# --------------------------------------------------------------------
# Configuración de Flask
# --------------------------------------------------------------------
# Configurar Flask con las rutas
app = Flask(__name__, 
           template_folder=TEMPLATES_DIR,
           static_folder=STATIC_DIR)

# En producción, obtener la clave secreta de las variables de entorno
if IS_PRODUCTION:
    app.secret_key = os.getenv('SECRET_KEY')
    if not app.secret_key:
        print("⚠️ Advertencia: La variable SECRET_KEY no está configurada. Usando clave por defecto.")
        app.secret_key = "clave_secreta_segura_temporal"
else:
    app.secret_key = os.getenv('SECRET_KEY', "clave_secreta_segura_desarrollo")
    
CORS(app)
bcrypt = Bcrypt(app)

# Agregar la carpeta Login al path de búsqueda de templates
app.jinja_loader.searchpath.extend([LOGIN_DIR, PROFILE_DIR])

# Verificar rutas de búsqueda
print(f"Searchpath de Jinja: {app.jinja_loader.searchpath}")

# --------------------------------------------------------------------
# Funciones de preferencias para guardar en Firebase
# --------------------------------------------------------------------

def guardar_preferencia_firebase(email_key, tipo, clave, valor):
    """
    Guarda una preferencia en Firebase Realtime Database
    
    Args:
        email_key: Email del usuario con puntos reemplazados por guiones bajos
        tipo: 'tema', 'color', etc.
        clave: Identificador de la preferencia
        valor: Valor a guardar (None para eliminar)
    """
    try:
        # Referencia a la ubicación de las preferencias del usuario
        ref = rtdb.reference(f"/usuarios/{email_key}/preferencias")
        
        # Para colores, guardar en la subcategoría 'colores'
        if tipo == 'color':
            # Convertir nombre CSS a formato Firebase (--primary-color -> primary_color)
            firebase_key = clave.replace('--', '').replace('-', '_')
            color_ref = ref.child('colores')
            
            if valor is None:
                # Eliminar el color si el valor es None
                color_ref.child(firebase_key).delete()
            else:
                # Guardar o actualizar el color
                color_ref.child(firebase_key).set(valor)
                
        # Para temas, guardar directamente
        elif tipo == 'tema':
            ref.child('tema').set(valor)
            
        return True
        
    except Exception as e:
        print(f"Error al guardar preferencia: {str(e)}")
        return False

def cargar_preferencias_firebase(email_key):
    """
    Carga las preferencias de un usuario desde Firebase
    
    Args:
        email_key: Email del usuario con puntos reemplazados por guiones bajos
        
    Returns:
        Diccionario con las preferencias (tema y colores)
    """
    # Estructura por defecto
    preferencias = {'tema': 'default', 'colores': {}}
    
    try:
        # Obtener referencia a las preferencias del usuario
        ref = rtdb.reference(f"/usuarios/{email_key}/preferencias")
        pref_data = ref.get()
        
        if not pref_data:
            return preferencias
            
        # Cargar tema si existe
        if 'tema' in pref_data:
            preferencias['tema'] = pref_data['tema']
            
        # Cargar colores si existen
        if 'colores' in pref_data:
            for key, valor in pref_data['colores'].items():
                # Convertir formato Firebase a CSS (primary_color -> --primary-color)
                css_key = f"--{key.replace('_', '-')}"
                preferencias['colores'][css_key] = valor
                
        return preferencias
        
    except Exception as e:
        print(f"Error al cargar preferencias: {str(e)}")
        return preferencias

# --------------------------------------------------------------------
# Rutas de la Aplicación
# --------------------------------------------------------------------

# Definición del decorador login_required
def login_required(f):
    @functools.wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

# Página principal
@app.route('/')
def principal():
    # Obtén los productos y noticias desde Firebase. Ajusta las rutas según tu BD.
    productos_snapshot = database.child("productos").get() if database else None
    noticias_snapshot = database.child("noticias").get() if database else None

    # Convierte a lista si es necesario
    productos = list(productos_snapshot.values()) if productos_snapshot else None
    noticias = list(noticias_snapshot.values()) if noticias_snapshot else None

    return render_template('Principal.html', productos=productos, noticias=noticias)

# Página de login
@app.route('/login')
def login():
    try:
        return render_template('login.html')
    except Exception as e:
        print(f"Error rendering login template: {str(e)}")
        return str(e), 500

# Servicio para imágenes del login
@app.route('/login/img/<path:filename>')
def serve_login_images(filename):
    return send_from_directory(os.path.join(LOGIN_DIR, 'img'), filename)

# Cerrar sesión
@app.route('/logout')
def logout():
    # Limpiar todos los datos de sesión
    session.clear()
    return redirect(url_for('principal'))

# Registro de usuario (POST)
@app.route('/registrar_usuario', methods=['POST'])
def registrar_usuario():
    if database is None:
        return "No se pudo conectar a Realtime Database", 500
    data = request.form
    email = data.get('email')
    nombre = data.get('nombre')  # Asume que el valor ya es una cadena
    password = data.get('password')
    if not email or not nombre or not password:
        return "❌ Debes ingresar todos los campos obligatorios.", 400
    email_key = email.replace('.', '_')
    usuario_ref = database.child("usuarios").child(email_key)
    if usuario_ref.get():
        return "❌ El usuario ya está registrado.", 400
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    usuario_ref.set({
        "nombre": nombre,
        "email": email,
        "password": hashed_password,
        "foto": "https://via.placeholder.com/50"
    })
    return redirect(url_for('login'))

# Inicio de sesión (POST)
@app.route('/iniciar_sesion', methods=['POST'])
def iniciar_sesion():
    """Inicia sesión y carga las preferencias del usuario desde Firebase"""
    try:
        if database is None:
            return "Error de conexión con la base de datos", 500
        
        data = request.form
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return "Email y contraseña son requeridos", 400
            
        email_key = email.replace('.', '_')
        usuario_ref = database.child("usuarios").child(email_key)
        usuario_data = usuario_ref.get()
        
        if not usuario_data:
            return "Usuario no encontrado", 404
            
        if bcrypt.check_password_hash(usuario_data["password"], password):
            # Crear objeto de usuario para la sesión
            session["user"] = {
                "nombre": usuario_data["nombre"],
                "email": usuario_data["email"],
                "foto": usuario_data.get("foto", ""),
                "login_method": "local",
                "id": email_key  # Usar email_key como ID
            }
            
            # Cargar preferencias desde Firebase con mensaje de diagnóstico
            try:
                print(f"Cargando preferencias de {email_key} desde Firebase...")
                preferencias = cargar_preferencias_firebase(email_key)
                
                # Si las preferencias están vacías, intentar crear una entrada básica
                if preferencias['tema'] == 'default' and not preferencias['colores']:
                    print(f"No se encontraron preferencias para {email_key}, creando entrada básica...")
                    # Crear una entrada mínima para verificar permisos de escritura
                    rtdb.reference(f"/usuarios/{email_key}/preferencias").set({
                        'tema': 'default',
                        'ultima_sincronizacion': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    })
                    print("Preferencias iniciales creadas correctamente")
                
                session['user_preferences'] = preferencias
                print(f"Preferencias cargadas: {preferencias}")
            except Exception as e:
                print(f"⚠️ Error al cargar preferencias: {str(e)}")
                # Asignar un valor por defecto si hay error
                session['user_preferences'] = {'tema': 'default', 'colores': {}}
                print("Se han asignado preferencias por defecto debido al error")
            
            # Asegurar de que los cambios se guarden en la sesión
            session.modified = True
            return redirect(url_for('principal'))
        else:
            return "Contraseña incorrecta", 401
            
    except Exception as e:
        print(f"Error en inicio de sesión: {str(e)}")
        return f"Error en el servidor: {str(e)}", 500

# Otras páginas
@app.route('/pagina')
def pagina():
    return render_template('Pagina.html')

@app.route('/salud')
def salud():
    return render_template('salud.html')

@app.route('/fitness')
def fitness():
    return render_template('fitness.html')

@app.route('/alimentacion')
def alimentacion():
    return render_template('alimentacion.html')

@app.route('/precios')
def precios():
    return render_template('Precios.html')

@app.route('/contacto')
def contacto():
    return render_template('contacto.html')

@app.route('/configuracion')
def configuracion():
    return render_template('configuracion.html')

@app.route('/ajustes')
def ajustes():
    return render_template('ajustes.html')

# OAuth: Autorización y callback de Google
@app.route('/autorizar')
def autorizar():
    """
    Redirige al usuario al flujo de autorización OAuth de Google.
    Esta función debe estar definida para que los enlaces a url_for('autorizar') funcionen.
    """
    return google_autorizar()

@app.route('/oauth2callback')
def callback():
    # Obtener el resultado del callback de OAuth
    result = oauth2callback()
    
    # Asegurarse de que el usuario se haya autenticado correctamente
    if 'user' in session:
        # Establecer explícitamente el método de login como Google
        session['user']['login_method'] = 'google'
        
        # Cargar preferencias si tenemos el email
        if 'email' in session['user']:
            email_key = session['user']['email'].replace('.', '_')
            preferencias = cargar_preferencias_firebase(email_key)
            session['user_preferences'] = preferencias
        
        # Guardar cambios en la sesión
        session.modified = True
        print("Usuario autenticado con Google, preferencias cargadas")
    
    return redirect(url_for('principal'))

# Configurar foto
@app.route('/configurar_foto')
@login_required
def configurar_foto():
    # Obtener el usuario actual y su email_key
    
    usuario = session.get('user', {})
    
    # Imprimimos información para depurar
    print("Usuario accediendo a configurar_foto:", session['user'])
    print("Método de login:", session['user'].get('login_method', 'no especificado'))
    
    # Renderizar la plantilla
    return render_template('configurar_foto.html')

# Subir foto
@app.route('/subir_foto', methods=['POST'])
def subir_foto():
    if "user" not in session:
        return redirect(url_for('login'))
    
    # Si es un usuario de Google, redirigir
    if session["user"].get("login_method") == "google":
        return redirect(url_for('configurar_foto'))
    
    # Obtener archivo
    file = request.files.get('foto')
    if not file or file.filename.strip() == "":
        print(">>> Archivo no recibido o vacío.")
        return redirect(url_for('principal'))
    
    print(f">>> Archivo recibido: {file.filename}")
    filename = secure_filename(file.filename)
    email_key = session["user"]["email"].replace('.', '_')
    
    # Usar Firebase Storage
    try:
        bucket = storage.bucket()
        print(f">>> Usando bucket: {bucket.name}")
        
        folder_path = f"fotos/{email_key}/"
        # Crear placeholder para la carpeta virtual
        dummy_blob = bucket.blob(folder_path + ".folder_placeholder")
        if not dummy_blob.exists():
            dummy_blob.upload_from_string("")
            print(f"Carpeta {folder_path} creada.")
            
        # Subir el archivo
        blob = bucket.blob(f"{folder_path}{filename}")
        file.seek(0)
        blob.upload_from_file(file, content_type=file.content_type)
        print("Foto subida correctamente.")
        
        # Hacer pública la imagen
        blob.make_public()
        nueva_url = blob.public_url
        print("URL pública:", nueva_url)
        
        # Actualizar en Firebase y sesión
        database.child("usuarios").child(email_key).update({"foto": nueva_url})
        session["user"]["foto"] = nueva_url
        
        # Responder según el tipo de petición
        if request.headers.get("X-Requested-With") == "XMLHttpRequest":
            return jsonify({"nueva_url": nueva_url})
        return redirect(url_for('principal'))
        
    except Exception as e:
        print(f">>> ERROR al subir foto: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Actualizar datos de usuario
@app.route('/update_user', methods=['POST'])
def update_user():
    if "user" not in session:
        return redirect(url_for('login'))
    data = request.form
    nuevo_nombre = data.get('nombre')
    nueva_ubicacion = data.get('ubicacion')
    email_key = session["user"]["email"].replace('.', '_')
    usuario_ref = database.child("usuarios").child(email_key)
    updates = {}
    if nuevo_nombre:
        updates["nombre"] = nuevo_nombre
    if nueva_ubicacion:
        updates["ubicacion"] = nueva_ubicacion
    if updates:
        usuario_ref.update(updates)
        session["user"].update(updates)
    return redirect(url_for('configurar_foto'))

# Eventos de calendario
@app.route('/api/calendar/events')
def api_calendar_events():
    events = get_calendar_events()
    return jsonify(events)

# Cambiar contraseña
@app.route('/cambiar_password', methods=['GET', 'POST'])
def cambiar_password():
    if 'user' not in session:
        return redirect(url_for('login'))
    
    if session['user'].get('login_method') == 'google':
        return redirect(url_for('configurar_foto'))
    
    if request.method == 'POST':
        actual_password = request.form.get('actual_password')
        nueva_password = request.form.get('nueva_password')
        confirmar_password = request.form.get('confirmar_password')
        
        if not actual_password or not nueva_password or not confirmar_password:
            return render_template('cambiar_password.html', error="Todos los campos son obligatorios")
        
        if nueva_password != confirmar_password:
            return render_template('cambiar_password.html', error="Las contraseñas no coinciden")
        
        email_key = session["user"]["email"].replace('.', '_')
        usuario_ref = database.child("usuarios").child(email_key)
        usuario_data = usuario_ref.get()
        
        if not bcrypt.check_password_hash(usuario_data["password"], actual_password):
            return render_template('cambiar_password.html', error="Contraseña actual incorrecta")
        
        hashed_password = bcrypt.generate_password_hash(nueva_password).decode('utf-8')
        usuario_ref.update({"password": hashed_password})
        
        return render_template('cambiar_password.html', success="Contraseña actualizada correctamente")
    
    return render_template('cambiar_password.html')

# Guardar tema de usuario
@app.route('/guardar_tema_usuario', methods=['POST'])
@login_required
def guardar_tema_usuario():
    """Guarda el tema del usuario en Firebase Realtime Database"""
    data = request.json
    tema = data.get('tema', 'default')
    
    try:
        email_key = session['user']['email'].replace('.', '_')
        print(f"Guardando tema {tema} para usuario {email_key} en Firebase...")
        
        # Guardar en Firebase
        database.child("usuarios").child(email_key).child("preferencias").child("tema").set(tema)
        
        # Actualizar sesión
        if 'user_preferences' not in session:
            session['user_preferences'] = {'tema': tema, 'colores': {}}
        else:
            session['user_preferences']['tema'] = tema
            
        session.modified = True
        return jsonify({'status': 'success', 'message': f'Tema {tema} guardado correctamente'})
    
    except Exception as e:
        print(f"Error al guardar tema: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/guardar_color_usuario', methods=['POST'])
def guardar_color_usuario():
    """Guarda un color personalizado en Firebase Realtime Database"""
    if 'user' not in session:
        return jsonify({'status': 'error', 'message': 'No autenticado'})
    
    data = request.json
    variable = data.get('variable')  # --primary-color
    valor = data.get('valor')  # #FF0000
    
    if not variable:
        return jsonify({'status': 'error', 'message': 'Variable CSS no especificada'})
    
    try:
        email_key = session['user']['email'].replace('.', '_')
        
        # Convertir nombre CSS a formato Firebase (--primary-color -> primary_color)
        firebase_key = variable.replace('--', '').replace('-', '_')
        
        # Guardar en Firebase
        if valor is None:
            # Si valor es None, eliminar la preferencia
            database.child("usuarios").child(email_key).child("preferencias").child("colores").child(firebase_key).remove()
            print(f"Color {firebase_key} eliminado para usuario {email_key}")
        else:
            # Guardar/actualizar el color
            database.child("usuarios").child(email_key).child("preferencias").child("colores").child(firebase_key).set(valor)
            print(f"Color {firebase_key}={valor} guardado para usuario {email_key}")
        
        # Actualizar sesión
        if 'user_preferences' not in session:
            session['user_preferences'] = {'tema': 'default', 'colores': {}}
        
        if valor is None:
            if variable in session['user_preferences']['colores']:
                del session['user_preferences']['colores'][variable]
        else:
            session['user_preferences']['colores'][variable] = valor
            
        session.modified = True
        return jsonify({
            'status': 'success', 
            'message': f'Color {variable} guardado correctamente',
            'variable': variable,
            'valor': valor
        })
        
    except Exception as e:
        print(f"Error al guardar color: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)})

# Nueva ruta para guardar múltiples colores a la vez
@app.route('/guardar_colores_usuario', methods=['POST'])
@login_required
def guardar_colores_usuario():
    """Guarda múltiples colores personalizados en Firebase Realtime Database"""
    data = request.json
    colores = data.get('colores', {})
    
    if not colores:
        return jsonify({"status": "error", "message": "No se proporcionaron colores"}), 400
    
    try:
        email_key = session['user']['email'].replace('.', '_')
        
        # Preparar datos para Firebase (convertir nombres CSS)
        firebase_colores = {}
        for variable, valor in colores.items():
            # Convertir nombre CSS a formato Firebase (--primary-color -> primary_color)
            firebase_key = variable.replace('--', '').replace('-', '_')
            firebase_colores[firebase_key] = valor
        
        # Guardar en Firebase
        colores_ref = database.child("usuarios").child(email_key).child("preferencias").child("colores")
        colores_ref.update(firebase_colores)
        
        # Actualizar sesión
        if 'user_preferences' not in session:
            session['user_preferences'] = {'tema': 'default', 'colores': {}}
            
        # Actualizar colores en la sesión
        session['user_preferences']['colores'].update(colores)
        session.modified = True
        
        return jsonify({"status": "success", "message": "Colores guardados correctamente"})
    except Exception as e:
        print(f"Error al guardar colores: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/sincronizar_preferencias', methods=['POST'])
def sincronizar_preferencias():
    """Sincroniza preferencias del usuario desde Firebase a la sesión"""
    if 'user' not in session:
        return jsonify({'status': 'error', 'message': 'No autenticado'})
        
    try:
        email_key = session['user']['email'].replace('.', '_')
        
        # Obtener preferencias directamente desde Firebase
        preferencias_ref = database.child("usuarios").child(email_key).child("preferencias").get()
        
        # Crear estructura para almacenar las preferencias
        preferencias = {'tema': 'default', 'colores': {}}
        
        # Si hay preferencias en Firebase, procesarlas
        if preferencias_ref:
            # Cargar tema si existe
            if 'tema' in preferencias_ref:
                preferencias['tema'] = preferencias_ref['tema']
                
            # Cargar colores si existen
            if 'colores' in preferencias_ref:
                colores = preferencias_ref['colores']
                for key, value in colores.items():
                    # Arreglado: Añadida comilla de cierre que faltaba
                    css_var = f"--{key.replace('_', '-')}" 
                    preferencias['colores'][css_var] = value
                    
        # Actualizar la sesión con las preferencias sincronizadas
        session['user_preferences'] = preferencias
        session.modified = True
        
        print(f"Preferencias sincronizadas para {email_key}: {preferencias}")
        return jsonify({
            'status': 'success',
            'message': 'Preferencias sincronizadas correctamente',
            'data': preferencias
        })
        
    except Exception as e:
        print(f"Error al sincronizar preferencias: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)})

# Añadir ruta de diagnóstico para probar Firebase
@app.route('/diagnostico_firebase')
def diagnostico_firebase():
    """Ruta para probar la conexión con Firebase"""
    if 'user' not in session:
        return jsonify({'status': 'error', 'message': 'No autenticado'})
    
    try:
        email_key = session['user']['email'].replace('.', '_')
        
        # Test de conexión
        test_ref = database.child("_test_connection").child(email_key)
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Intentar escribir un valor
        test_ref.set({
            'timestamp': timestamp,
            'message': 'Test de conexión',
            'user_agent': request.headers.get('User-Agent', 'Unknown')
        })
        
        # Leer el valor recién escrito
        test_data = test_ref.get()
        
        return jsonify({
            'status': 'success',
            'message': 'Conexión con Firebase OK',
            'write_test': True,
            'read_test': bool(test_data),
            'data': test_data
        })
        
    except Exception as e:
        print(f"Error en diagnóstico Firebase: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Error: {str(e)}',
            'recommendation': 'Verifica credenciales y permisos de Firebase'
        })

@app.route('/resetear_colores_usuario', methods=['POST'])
@login_required
def resetear_colores_usuario():
    """Elimina todos los colores personalizados del usuario en Firebase"""
    try:
        # Obtener email del usuario
        email_key = session['user']['email'].replace('.', '_')
        
        # Eliminar colores en Firebase
        ref = database.child("usuarios").child(email_key).child("preferencias").child("colores")
        ref.delete()
        
        # Actualizar sesión
        if 'user_preferences' in session and 'colores' in session['user_preferences']:
            session['user_preferences']['colores'] = {}
            session.modified = True
        
        print(f"Colores restablecidos para usuario {email_key}")
        return jsonify({"status": "success", "message": "Colores restablecidos correctamente"})
        
    except Exception as e:
        print(f"Error al restablecer colores: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

# Rutas específicas para la API de calendario
@app.route('/api/calendar/events')
@login_required
def api_calendar_events():
    """
    Obtiene los eventos del calendario del usuario
    """
    events_data = get_calendar_events()
    return jsonify(events_data)

@app.route('/api/calendar/event/create', methods=['POST'])
@login_required
def api_calendar_event_create():
    """
    Crea un nuevo evento en el calendario
    """
    return agregar_evento()

@app.route('/api/calendar/event/delete', methods=['POST'])
@login_required
def api_calendar_event_delete():
    """
    Elimina un evento del calendario
    """
    return borrar_evento()

# ----------------s----------------------------------------------------
# Funciones para iniciar el servidor
# --------------------------------------------------------------------
server_thread = None

def iniciar_servidor_en_segundo_plano():
    global server_thread
    if (server_thread and server_thread.is_alive()):
        print("⚠️ El servidor Flask ya está corriendo.\n")
        return
    print("\n🚀🔥 ¡El servidor Flask se está iniciando en segundo plano! 🔥🚀")
    server_thread = threading.Thread(target=lambda: app.run(debug=True, use_reloader=False, port=8000), daemon=True)
    server_thread.start()
    print("   Accede a http://127.0.0.1:8000/ para ver la aplicación.\n")

def submenu_servidor():
    import questionary
    while True:
        choice = questionary.select(
            "El servidor Flask está corriendo en segundo plano. ¿Qué deseas hacer ahora?",
            choices=["🔙 Volver al menú principal", "❌ Salir (detener servidor)"]
        ).ask()
        if choice == "🔙 Volver al menú principal":
            return
        elif choice == "❌ Salir (detener servidor)":
            print("Saliendo... El servidor se cerrará al terminar el proceso.")
            sys.exit(0)

def mostrar_banner():
    banner = r"""
 <!-- ************************************************************************* -->
<!-- * __  __           __             ___    ____                           * -->
<!-- */\ \/\ \         /\ \__         /\_ \  /\  _`\                         * -->
<!-- *\ \ \ \ \  __  __\ \ ,_\    __  \//\ \ \ \ \L\_\  __  __    ___ ___    * -->
<!-- * \ \ \/\ \/\ \\ \ \/  /'__`\  \ \ \ \ \L_L /\ \/\ \ /' __` __`\      * -->
<!-- *  \ \ \_/ \ \ \_\ \\ \ \_/\ \L\.\_ \_\ \_\ \ \/, \ \ \_\ \/\ \/\ \/\ \ * -->
<!-- *   \ `\___/\/`____ \\ \__\ \__/.\_\/\____\\ \____/\/`____ \ \_\ \_\ \_\* -->
<!-- *    `\/__/  `/___/> \\/__/\/__/\/_/\/____/ \/___/  `/___/> \/_/\/_/\/_/* -->
<!-- *               /\___/                                 /\___/           * -->
<!-- *               \/__/                                  \/__/            * -->
<!-- ************************************************************************* -->
    """
    print(banner)
    print("Bienvenido al asistente de configuración de VytalGym\nHecho por Brian y Pablo\n")

def iniciar_firebase():
    print("\n🔥 Ejecutando 'firebase init'...\n")
    os.system("firebase init")
    print("\n✅ Firebase se ha inicializado.\n")

def vincular_google():
    print("\n🌐 Vinculando la página con Google OAuth...\n")
    print("🔗 Llamando a la ruta /autorizar (ejemplo)...")
    print("✅ Vinculación con Google completada (ejemplo).\n")

def menu_principal():
    import questionary
    opciones = [
        questionary.Choice(title="🚀 Iniciar servidor", value="iniciar_servidor"),
        questionary.Choice(title="🔥 Iniciar Firebase", value="firebase_init"),
        questionary.Choice(title="🌐 Vincular la página con Google (OAuth)", value="vincular_google"),
        questionary.Choice(title="❌ Salir", value="salir"),
    ]
    seleccionadas = questionary.checkbox(
        "¿Qué deseas hacer?\n(Flechas ↑↓ para moverte, Espacio para seleccionar, Enter para continuar):",
        choices=opciones
    ).ask()
    return seleccionadas or []

def ejecutar_configuracion(opciones_seleccionadas):
    if not opciones_seleccionadas:
        print("No se ha seleccionado ninguna opción. Finalizando...\n")
        return
    print("Procesando las opciones seleccionadas...\n")
    for opcion in opciones_seleccionadas:
        if opcion == "iniciar_servidor":
            iniciar_servidor_en_segundo_plano()
            submenu_servidor()
        elif opcion == "firebase_init":
            iniciar_firebase()
        elif opcion == "vincular_google":
            vincular_google()
        elif opcion == "salir":
            print("Saliendo del asistente...")
            sys.exit(0)
    print("¡Operaciones completadas!\n")

def iniciar_asistente():
    mostrar_banner()
    while True:
        opciones = menu_principal()
        if not opciones:
            print("No has seleccionado nada. Finalizando...\n")
            break
        ejecutar_configuracion(opciones)

# --------------------------------------------------------------------
# Punto de entrada
# --------------------------------------------------------------------
if __name__ == "__main__":
    # Determinar host y puerto según el entorno
    if IS_PRODUCTION:
        # En Railway, vincula a 0.0.0.0 y usa el puerto proporcionado por la variable de entorno
        port = int(os.getenv('PORT', 8000))
        print(f"Iniciando servidor en producción: 0.0.0.0:{port}")
        app.run(host='0.0.0.0', port=port, debug=False)
    else:
        # En desarrollo local
        if "--menu" in sys.argv:
            iniciar_asistente()
        else:
            # Usar puerto 8000 para desarrollo local
            print("Iniciando servidor en desarrollo: localhost:8000")
            app.run(debug=True, port=8000)


