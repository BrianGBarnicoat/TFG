from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from models.preferencias import guardar_preferencia, cargar_preferencias

app = Flask(__name__)
app.secret_key = 'your_secret_key'

@app.route('/')
def principal():
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        # Aquí iría la lógica de autenticación
        user = authenticate(username, password)
        
        if user:
            session['user'] = user
            login_exitoso = True
            
            # Si el login es exitoso y antes de redirigir:
            if login_exitoso:
                # Cargar preferencias del usuario
                preferencias = cargar_preferencias(user_id=user['id'])
                
                # Guardar en session para cargarlas en el cliente vía JavaScript
                session['user_preferences'] = preferencias
            
            return redirect(url_for('principal'))
        else:
            return 'Usuario o contraseña incorrectos'
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.pop('user', None)
    session.pop('user_preferences', None)
    return redirect(url_for('principal'))

@app.route('/guardar_preferencias', methods=['POST'])
def guardar_preferencias():
    """
    Guarda las preferencias de tema y colores en la BD para el usuario actual
    """
    if 'user' not in session:
        return jsonify({'status': 'error', 'message': 'Usuario no autenticado'})
    
    data = request.json
    tipo = data.get('tipo')
    
    if tipo == 'color':
        variable = data.get('variable')
        valor = data.get('valor')
        
        if not variable:
            return jsonify({'status': 'error', 'message': 'Variable CSS no especificada'})
        
        # Guardar color en la BD (valor null/None significa borrar)
        guardar_preferencia(
            user_id=session['user']['id'],
            tipo='color',
            clave=variable,
            valor=valor
        )
    
    elif tipo == 'tema':
        tema = data.get('valor', 'default')
        
        # Guardar tema en la BD
        guardar_preferencia(
            user_id=session['user']['id'],
            tipo='tema',
            clave='selected-theme',
            valor=tema
        )
    
    return jsonify({'status': 'success'})

if __name__ == '__main__':
    app.run(debug=True)
