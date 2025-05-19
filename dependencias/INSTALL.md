
Este proyecto utiliza **Google OAuth** para la autenticación de usuarios y **Firebase Admin** para interactuar con Firebase. La siguiente guía detalla paso a paso cómo obtener las credenciales necesarias e instalar las dependencias para poner en marcha el proyecto.

## Requisitos Previos

- **Python 3.x**  
  Asegúrate de tener Python instalado. Descárgalo desde [python.org](https://www.python.org/).

- **Cuenta de Google**  
  Necesaria para acceder a Google Cloud Console y Firebase Console.

## Instalación de Dependencias

Ejecuta los siguientes comandos en tu terminal para instalar todas las librerías necesarias:

```bash
pip install firebase-admin
```
```bash
pip install flask
```
```bash
pip install flask-cors
```
```bash
pip install flask-bcrypt
```
```bash
pip install google-auth-oauthlib
```
## Obtención de Credenciales

El proyecto requiere dos tipos de credenciales:

1. **Credenciales de Google OAuth (google_oauth_credentials)**  
   Estas credenciales gestionan la autenticación con Google.

   - Accede a Google Cloud Console  
     Visita Google Cloud Console.
   - Crea o Selecciona un Proyecto  
     Selecciona un proyecto existente o crea uno nuevo.
   - Configura la Pantalla de Consentimiento (OAuth Consent Screen)  
     Navega a APIs y servicios > Pantalla de consentimiento OAuth. Completa los datos requeridos (nombre de la aplicación, correo electrónico, etc.).
   - Crea las Credenciales  
     Dirígete a APIs y servicios > Credenciales. Haz clic en Crear credenciales y selecciona ID de cliente de OAuth. Escoge el tipo de aplicación (por ejemplo, aplicación de escritorio o web) y configura los datos solicitados.
   - Descarga el Archivo JSON  
     Descarga el archivo JSON con las credenciales. Almacena este archivo en tu proyecto, por ejemplo, en `credentials/google/`.

2. **Credenciales de Firebase Admin (firebase_admin_credentials)**  
   Estas credenciales permiten interactuar de forma segura con Firebase.

   - Accede a Firebase Console  
     Visita Firebase Console.
   - Crea o Selecciona un Proyecto  
     Selecciona un proyecto existente o crea uno nuevo.
   - Accede a la Configuración del Proyecto  
     Haz clic en el ícono de configuración (rueda dentada) y selecciona Configuración del proyecto.
   - Genera una Nueva Clave Privada  
     Ve a la pestaña Cuentas de servicio. Haz clic en Generar nueva clave privada y descarga el archivo JSON.
   - Almacena el Archivo de Forma Segura  
     Coloca este archivo en tu proyecto, por ejemplo, en `credentials/claves seguras/`.

## Configuración y Uso del Token

El flujo general es el siguiente:

### Autenticación con Google
Utiliza el archivo JSON de Google OAuth para iniciar el proceso de autenticación. El usuario se autentica y se obtiene un token de acceso.

### Inicialización de Firebase Admin
Importa la librería y carga las credenciales:

```python
import firebase_admin
from firebase_admin import credentials

cred = credentials.Certificate('credentials/firebase/tu_firebase_admin_credentials.json')
firebase_admin.initialize_app(cred)
```

### Generación y Validación del Token
Utiliza las funciones de Firebase Admin para crear y verificar tokens de usuario. Consulta la documentación oficial de Firebase Admin para más detalles.

## Ejemplo Básico de Aplicación con Flask

Este es un ejemplo básico de cómo estructurar tu aplicación:

```python
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_bcrypt import Bcrypt
import firebase_admin
from firebase_admin import credentials, auth
import google_auth_oauthlib.flow

app = Flask(__name__)
CORS(app)
bcrypt = Bcrypt(app)

# Inicializar Firebase Admin
cred = credentials.Certificate('credentials/firebase/tu_firebase_admin_credentials.json')
firebase_admin.initialize_app(cred)

@app.route('/login', methods=['POST'])
def login():
    # 1. Redirige al usuario a la URL de autenticación de Google.
    # 2. Recibe el código de autorización y lo intercambia por un token.
    # 3. Valida el token y, opcionalmente, crea una sesión en Firebase.
    return jsonify({"mensaje": "Implementar autenticación"})

if __name__ == '__main__':
    app.run(debug=True)
```

## Notas de Seguridad y Buenas Prácticas

- **No Compartir las Credenciales:**  
  No subas los archivos JSON de credenciales a repositorios públicos. Usa un archivo `.gitignore` para excluirlos.

- **Consulta la Documentación:**  
  Revisa la documentación de Google OAuth y la documentación de Firebase Admin para más detalles.

- **Manejo de Errores:**  
  Implementa un manejo adecuado de errores para mejorar la experiencia del usuario.
