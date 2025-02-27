# ...existing code...

# Importar Firebase Admin SDK
import firebase_admin
from firebase_admin import credentials, db
# Importar otras dependencias necesarias
# ...existing code...

# Inicializar Firebase Admin si no está inicializado ya
# (Asumimos que la inicialización de Firebase ya existe o se hace en otra parte)
# ...existing code...

@app.route('/configurar_foto')
@login_required
def configurar_foto():
    # Obtener el usuario actual y su email_key
    usuario = session.get('user', {})
    
    # Renderizar la plantilla
    return render_template(
        'configurar_foto.html',
        # ...existing arguments...
    )

# Ruta API para guardar tema (opcional si prefieres hacerlo desde el backend)
@app.route('/guardar_tema_usuario', methods=['POST'])
@login_required
def guardar_tema_usuario():
    # Verificar si el usuario está autenticado
    if 'user' not in session:
        return jsonify({"status": "error", "message": "No autenticado"}), 401
    
    # Obtener datos del request
    data = request.json
    tema = data.get('tema')
    
    if not tema:
        return jsonify({"status": "error", "message": "Tema no proporcionado"}), 400
    
    try:
        # Obtener email_key del usuario
        email_key = session['user'].get('email_key')
        
        # Guardar en Firebase
        ref = db.reference(f"usuarios/{email_key}/preferencias")
        ref.child('tema').set(tema)
        
        # Guardar en la sesión
        if 'preferencias' not in session['user']:
            session['user']['preferencias'] = {}
        session['user']['preferencias']['tema'] = tema
        session.modified = True
        
        return jsonify({"status": "success", "message": f"Tema {tema} guardado correctamente"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# Ruta API para guardar colores (opcional si prefieres hacerlo desde el backend)
@app.route('/guardar_colores_usuario', methods=['POST'])
@login_required
def guardar_colores_usuario():
    # Verificar si el usuario está autenticado
    if 'user' not in session:
        return jsonify({"status": "error", "message": "No autenticado"}), 401
    
    # Obtener datos del request
    data = request.json
    colores = data.get('colores', {})
    
    try:
        # Obtener email_key del usuario
        email_key = session['user'].get('email_key')
        
        # Guardar en Firebase
        ref = db.reference(f"usuarios/{email_key}/preferencias/colores")
        ref.update(colores)
        
        # Guardar en la sesión
        if 'preferencias' not in session['user']:
            session['user']['preferencias'] = {}
        if 'colores' not in session['user']['preferencias']:
            session['user']['preferencias']['colores'] = {}
            
        session['user']['preferencias']['colores'].update(colores)
        session.modified = True
        
        return jsonify({"status": "success", "message": "Colores guardados correctamente"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# ...existing code...
