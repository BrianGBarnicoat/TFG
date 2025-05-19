"""
Configuración centralizada para Firebase
Este archivo contiene todas las URL y configuración para acceder a Firebase
"""

# Configuración de Firebase
FIREBASE_CONFIG = {
    'databaseURL': 'https://tfgpb-448609-default-rtdb.firebaseio.com',
    'storageBucket': 'tfgpb-448609.firebasestorage.app',
    'projectId': 'tfgpb-448609',
    'authDomain': 'tfgpb-448609.firebaseapp.com'
}

# Rutas a los archivos de credenciales
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

FIREBASE_ADMIN_CREDENTIALS_PATH = os.path.join(
    BASE_DIR, 'claves seguras', 'firebase_admin_credentials.json'
)

GOOGLE_OAUTH_CREDENTIALS_PATH = os.path.join(
    BASE_DIR, 'claves seguras', 'google_oauth_credentials.json'
)

# Información adicional para depuración
DEBUG_INFO = {
    'webConfigJS': """
    const firebaseConfig = {
      apiKey: "AIzaSyA8uOWlr2Ll5lE_M0dhwvRncLbbk39-30o",
      authDomain: "tfgpb-448609.firebaseapp.com",
      databaseURL: "https://tfgpb-448609-default-rtdb.firebaseio.com",
      projectId: "tfgpb-448609",
      storageBucket: "tfgpb-448609.firebasestorage.app",
      messagingSenderId: "305857586617",
      appId: "1:305857586617:web:801c47d770061e585dc268",
      measurementId: "G-1S734R2E01"
    };
    """
}

def verificar_configuracion():
    """Verifica que los archivos de credenciales existen y son válidos"""
    import json
    
    errores = []
    
    # Verificar archivo de credenciales de administrador
    if not os.path.exists(FIREBASE_ADMIN_CREDENTIALS_PATH):
        errores.append(f"No se encontró el archivo de credenciales en {FIREBASE_ADMIN_CREDENTIALS_PATH}")
    else:
        try:
            with open(FIREBASE_ADMIN_CREDENTIALS_PATH, 'r') as f:
                creds = json.load(f)
                if 'type' not in creds or creds['type'] != 'service_account':
                    errores.append("El archivo de credenciales no parece ser de una cuenta de servicio válida")
                if 'project_id' not in creds or creds['project_id'] != FIREBASE_CONFIG['projectId']:
                    errores.append(f"El ID del proyecto en las credenciales no coincide: {creds.get('project_id', 'No encontrado')} vs {FIREBASE_CONFIG['projectId']}")
        except json.JSONDecodeError:
            errores.append("El archivo de credenciales no es un JSON válido")
        except Exception as e:
            errores.append(f"Error al verificar credenciales: {e}")
    
    # Verificar OAuth si aplica
    if os.path.exists(GOOGLE_OAUTH_CREDENTIALS_PATH):
        try:
            with open(GOOGLE_OAUTH_CREDENTIALS_PATH, 'r') as f:
                json.load(f)
        except Exception:
            errores.append("El archivo de credenciales OAuth no es un JSON válido")
    
    return {
        'ok': len(errores) == 0,
        'errores': errores
    }

if __name__ == "__main__":
    # Si ejecutamos este archivo directamente, verificamos la configuración
    resultado = verificar_configuracion()
    if resultado['ok']:
        print("✅ Configuración de Firebase correcta")
    else:
        print("❌ Se encontraron problemas en la configuración:")
        for error in resultado['errores']:
            print(f"  - {error}")
