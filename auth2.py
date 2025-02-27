from flask import Flask, request, session, redirect, url_for, render_template
import firebase_admin
from firebase_admin import credentials, db

app = Flask(__name__)
app.secret_key = 'your_secret_key'  # Reemplazar con tu clave secreta real

# Configurar Firebase (si no está ya inicializado)
if not firebase_admin._apps:
    cred = credentials.Certificate('path/to/your/firebase/credentials.json')  # Actualiza con la ruta real
    firebase_admin.initialize_app(cred, {
        'databaseURL': 'https://your-database-name.firebaseio.com/'  # Actualiza con tu URL real
    })

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        
        # Autenticar al usuario con Firebase
        # Reemplaza esto con la lógica de autenticación real
        user_authenticated = True  # Simulación de autenticación exitosa
        user_data = {'email': email, 'name': 'User Name'}  # Reemplazar con datos reales
        
        if user_authenticated:
            # Obtener el email_key para Firebase
            email = user_data['email']
            email_key = email.replace('.', '_').replace('@', '_')
            
            # Guardar datos básicos en la sesión
            session['user'] = {
                'email': email,
                'name': user_data.get('name', ''),
                'email_key': email_key,
                # Otros datos que necesites
            }
            
            # Cargar preferencias de tema desde Firebase
            try:
                ref = db.reference(f"usuarios/{email_key}/preferencias")
                prefs = ref.get()
                
                if prefs:
                    # Guardar preferencias en la sesión
                    if 'preferencias' not in session['user']:
                        session['user']['preferencias'] = {}
                    
                    # Si hay tema guardado, guardarlo en la sesión
                    if 'tema' in prefs:
                        session['user']['preferencias']['tema'] = prefs['tema']
                    
                    # Si hay colores personalizados, guardarlos en la sesión
                    if 'colores' in prefs and prefs['colores']:
                        session['user']['preferencias']['colores'] = prefs['colores']
                    
                    session.modified = True
            except Exception as e:
                print(f"Error al cargar las preferencias: {e}")
            
            return redirect(url_for('dashboard'))
    
    # Si es GET o la autenticación falla, mostrar formulario de login
    return render_template('login.html')

@app.route('/dashboard')
def dashboard():
    if 'user' in session:
        return f"Bienvenido {session['user']['name']}!"
    return redirect(url_for('login'))

if __name__ == '__main__':
    app.run(debug=True)