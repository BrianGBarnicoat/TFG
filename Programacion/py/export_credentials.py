"""
Script para exportar credenciales desde archivos a formato para variables de entorno.
Este script lee los archivos de credenciales y los convierte en strings que puedes
copiar directamente a tus variables de entorno en Railway.
"""
import os
import json
import base64

def read_file(file_path):
    """Lee un archivo y devuelve su contenido"""
    if not os.path.exists(file_path):
        print(f"El archivo {file_path} no existe")
        return None
    
    with open(file_path, 'r') as file:
        return file.read()

def main():
    # Ruta base a la carpeta de credenciales
    BASE_DIR = os.path.abspath(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
    CREDS_DIR = os.path.join(BASE_DIR, "claves seguras")
    
    # Firebase Admin SDK
    firebase_path = os.path.join(CREDS_DIR, "firebase_admin_credentials.json")
    firebase_content = read_file(firebase_path)
    if firebase_content:
        print("\n=== FIREBASE_CREDENTIALS ===")
        print(firebase_content.replace('\n', '\\n'))
    
    # Google OAuth
    oauth_path = os.path.join(CREDS_DIR, "google_oauth_credentials.json")
    oauth_content = read_file(oauth_path)
    if oauth_content:
        print("\n=== GOOGLE_OAUTH_CREDENTIALS ===")
        print(oauth_content.replace('\n', '\\n'))
    
    # Token JSON (para extract refresh_token)
    token_path = os.path.join(CREDS_DIR, "token.json")
    token_content = read_file(token_path)
    if token_content:
        try:
            token_data = json.loads(token_content)
            if 'refresh_token' in token_data:
                print("\n=== GOOGLE_REFRESH_TOKEN ===")
                print(token_data['refresh_token'])
        except json.JSONDecodeError:
            print("Error al decodificar token.json")
    
    # Secret Key
    secret_path = os.path.join(CREDS_DIR, "SECRET_KEY.env")
    secret_content = read_file(secret_path)
    if secret_content:
        try:
            secret_key = secret_content.split('=')[1].strip()
            print("\n=== SECRET_KEY ===")
            print(secret_key)
        except IndexError:
            print("Formato incorrecto en SECRET_KEY.env")

if __name__ == "__main__":
    main()
