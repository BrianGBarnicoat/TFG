#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import os
import threading
import time
from datetime import datetime, timedelta

import firebase_admin
from firebase_admin import credentials, db as rtdb, storage
from flask import Flask, render_template, request, session, redirect, url_for, send_from_directory, jsonify
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from werkzeug.utils import secure_filename

# Importar módulos auxiliares (estos archivos pueden mantenerse separados)
from auth import autorizar as google_autorizar, oauth2callback
from calendar_api import agregar_evento, get_calendar_events
from fitness import get_fitness_data, get_sleep_data

# --------------------------------------------------------------------
# Configuración de Firebase
# --------------------------------------------------------------------
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CREDENTIALS_PATH = os.path.join(BASE_DIR, "claves seguras", "firebase_admin_credentials.json")

if not os.path.exists(CREDENTIALS_PATH):
    print("⚠️ Error: El archivo de credenciales no existe en la ruta:", CREDENTIALS_PATH)
    sys.exit(1)

if not firebase_admin._apps:
    try:
        cred = credentials.Certificate(CREDENTIALS_PATH)
        firebase_admin.initialize_app(cred, {
            'databaseURL': 'https://tfgbp-d9051-default-rtdb.europe-west1.firebasedatabase.app',
            'storageBucket': 'tfgbp-d9051.appspot.com'
        })
        database = rtdb.reference("/")
        test_value = database.get()
        print("🔥 Realtime Database inicializado correctamente.")
        print("Valor obtenido en la raíz de la BD:", test_value)
    except Exception as e:
        print("⚠️ Error al inicializar Firebase:", e)
        database = None
else:
    database = rtdb.reference("/")

# --------------------------------------------------------------------
# Configuración de Flask
# --------------------------------------------------------------------
# Actualizar las rutas base
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
TEMPLATES_DIR = os.path.join(BASE_DIR, 'templates')
STATIC_DIR = os.path.join(BASE_DIR, 'static')
LOGIN_DIR = os.path.join(BASE_DIR, 'Login')
PROFILE_DIR = os.path.join(BASE_DIR, 'profile')

# Configurar Flask con las rutas correctas
app = Flask(__name__, 
           template_folder=TEMPLATES_DIR,
           static_folder=STATIC_DIR)
app.secret_key = "clave_secreta_segura"  # Cambia en producción
CORS(app)
bcrypt = Bcrypt(app)

# Agregar la carpeta Login al path de búsqueda de templates
app.jinja_loader.searchpath.extend([LOGIN_DIR, PROFILE_DIR])

# Debug: Imprimir rutas para verificar
print("Templates Directory:", TEMPLATES_DIR)
print("Login Directory:", LOGIN_DIR)
print("Static Directory:", STATIC_DIR)
print("Searchpath:", app.jinja_loader.searchpath)

# --------------------------------------------------------------------
# Rutas de la Aplicación
# --------------------------------------------------------------------

# Página principal
@app.route('/')
def principal():
    # Obtén los productos y noticias desde Firebase. Ajusta las rutas según tu BD.
    productos_snapshot = database.child("productos").get()
    noticias_snapshot = database.child("noticias").get()

    # Convierte a lista si es necesario (puedes ajustar según cómo retorne Firebase)
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
    session.pop("user", None)
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
            session["user"] = {
                "nombre": usuario_data["nombre"],
                "email": usuario_data["email"],
                "foto": usuario_data.get("foto", ""),
                "login_method": "local"
            }
            return redirect(url_for('principal'))
        else:
            return "Contraseña incorrecta", 401
            
    except Exception as e:
        print(f"Error en inicio de sesión: {str(e)}")
        return f"Error en el servidor: {str(e)}", 500

# Otras páginas (puedes agregar más según sea necesario)
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

# Modificar el callback de OAuth para asegurar que se establece correctamente el método de login
@app.route('/oauth2callback')
def callback():
    # Obtener el resultado del callback de OAuth
    result = oauth2callback()
    
    # Asegurarse de que el usuario se haya autenticado correctamente
    if 'user' in session:
        # Establecer explícitamente el método de login como Google
        session['user']['login_method'] = 'google'
        # Asegurarse de que la sesión se guarde correctamente
        session.modified = True
        print("Usuario autenticado con Google:", session['user'])
    
    return redirect(url_for('principal'))

# Asegurarse de que configurar_foto permita acceso a usuarios de Google
@app.route('/configurar_foto')
def configurar_foto():
    if 'user' not in session:
        return redirect(url_for('login'))
    
    # Imprimimos información para depurar
    print("Usuario accediendo a configurar_foto:", session['user'])
    print("Método de login:", session['user'].get('login_method', 'no especificado'))
    
    # Permitir acceso a todos los usuarios independientemente del método de login
    return render_template('configurar_foto.html')

# Modificar el manejo de la subida de fotos para usuarios de Google
@app.route('/subir_foto', methods=['POST'])
def subir_foto():
    if "user" not in session:
        return redirect(url_for('login'))
    
    # Si es un usuario de Google, simplemente redirigir a configurar_foto en lugar de intentar subir
    if session["user"].get("login_method") == "google":
        return redirect(url_for('configurar_foto'))
    
    # Resto del código para subir fotos para usuarios locales
    file = request.files.get('foto')
    if not file or file.filename.strip() == "":
        print(">>> Archivo no recibido o vacío.")
        return redirect(url_for('principal'))
    print(f">>> Archivo recibido: {file.filename}")
    filename = secure_filename(file.filename)
    email_key = session["user"]["email"].replace('.', '_')
    # Cambiar a bucket terminado en .appspot.com
    bucket_name = "tfgbp-d9051.appspot.com"  
    bucket = firebase_admin.storage.bucket(bucket_name)
    folder_path = f"fotos/{email_key}/"
    # Crear placeholder para la carpeta virtual
    dummy_blob = bucket.blob(folder_path + ".folder_placeholder")
    if not dummy_blob.exists():
        dummy_blob.upload_from_string("")
        print(f"Carpeta {folder_path} creada con placeholder.")
    blob = bucket.blob(f"{folder_path}{filename}")
    try:
        file.seek(0)
        blob.upload_from_file(file, content_type=file.content_type)
        print("Foto subida correctamente.")
    except Exception as e:
        print("Error al subir la foto:", e)
        return redirect(url_for('principal'))
    try:
        blob.make_public()
        print("Foto hecha pública.")
    except Exception as e:
        print("Error al hacer la foto pública:", e)
    nueva_url = blob.public_url
    print("URL de la foto:", nueva_url)
    rtdb.reference("usuarios").child(email_key).update({"foto": nueva_url})
    session["user"]["foto"] = nueva_url
    if request.headers.get("X-Requested-With") == "XMLHttpRequest":
        return jsonify({"nueva_url": nueva_url})
    return redirect(url_for('principal'))

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

# Nuevo endpoint para obtener los eventos de Google Calendar
@app.route('/api/calendar/events')
def api_calendar_events():
    events = get_calendar_events()
    return jsonify(events)

# Añadir la ruta para cambiar contraseña
@app.route('/cambiar_password', methods=['GET', 'POST'])
def cambiar_password():
    if 'user' not in session:
        return redirect(url_for('login'))
    
    # No permitir cambio de contraseña para usuarios de Google
    if session['user'].get('login_method') == 'google':
        return redirect(url_for('configurar_foto'))
    
    if request.method == 'POST':
        # Obtener datos del formulario
        actual_password = request.form.get('actual_password')
        nueva_password = request.form.get('nueva_password')
        confirmar_password = request.form.get('confirmar_password')
        
        # Validaciones básicas
        if not actual_password or not nueva_password or not confirmar_password:
            return render_template('cambiar_password.html', error="Todos los campos son obligatorios")
        
        if nueva_password != confirmar_password:
            return render_template('cambiar_password.html', error="Las nuevas contraseñas no coinciden")
            
        # Verificar contraseña actual
        email_key = session["user"]["email"].replace('.', '_')
        usuario_ref = database.child("usuarios").child(email_key)
        usuario_data = usuario_ref.get()
        
        if not bcrypt.check_password_hash(usuario_data["password"], actual_password):
            return render_template('cambiar_password.html', error="Contraseña actual incorrecta")
            
        # Actualizar contraseña
        hashed_password = bcrypt.generate_password_hash(nueva_password).decode('utf-8')
        usuario_ref.update({"password": hashed_password})
        
        return render_template('cambiar_password.html', success="Contraseña actualizada correctamente")
    
    return render_template('cambiar_password.html')

# --------------------------------------------------------------------
# Funciones para iniciar el servidor en segundo plano (opcional)
# --------------------------------------------------------------------
server_thread = None

def iniciar_servidor_en_segundo_plano():
    global server_thread
    if server_thread and server_thread.is_alive():
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
<!-- * \ \ \/\ \/\ \\ \ \/  /'__`\  \ \ \ \ \ \L_L /\ \/\ \ /' __` __`\      * -->
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
    while True:
        mostrar_banner()
        opciones = menu_principal()
        if not opciones:
            print("No has seleccionado nada. Finalizando...\n")
            break
        ejecutar_configuracion(opciones)

# --------------------------------------------------------------------
# Punto de entrada
# --------------------------------------------------------------------
if __name__ == "__main__":
    # Si prefieres iniciar el asistente de menú, usa: python app.py --menu
    if "--menu" in sys.argv:
        iniciar_asistente()
    else:
        app.run(debug=True, port=8000)
