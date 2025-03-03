"""
Script para verificar la estructura del proyecto y asegurar que todos los 
directorios necesarios existen antes de desplegar en Railway.
"""
import os
import sys

def check_directory(path, name, create=False):
    """Verifica si un directorio existe y opcionalmente lo crea"""
    print(f"Verificando {name}: {path}")
    if os.path.exists(path):
        if os.path.isdir(path):
            print(f"✅ {name} existe y es un directorio")
            return True
        else:
            print(f"⚠️ {name} existe pero NO es un directorio")
            return False
    else:
        print(f"❌ {name} no existe")
        if create:
            try:
                os.makedirs(path, exist_ok=True)
                print(f"✅ {name} ha sido creado")
                return True
            except Exception as e:
                print(f"❌ No se pudo crear {name}: {str(e)}")
                return False
        return False

def main():
    """Función principal que verifica la estructura del proyecto"""
    # Obtener directorio base
    base_dir = os.path.abspath(os.path.dirname(__file__))
    print(f"Directorio base del proyecto: {base_dir}\n")
    
    # Definir directorios requeridos
    required_dirs = [
        ("Programacion/py", "Directorio de código Python"),
        ("Programacion/templates", "Directorio de plantillas"),
        ("Programacion/static", "Directorio de archivos estáticos"),
        ("Programacion/Login", "Directorio de login"),
        ("Programacion/profile", "Directorio de perfil"),
    ]
    
    # Verificar cada directorio
    all_exist = True
    for rel_path, description in required_dirs:
        full_path = os.path.join(base_dir, rel_path)
        if not check_directory(full_path, description, create=True):
            all_exist = False
    
    # Resultado final
    print("\nResultado de la verificación:")
    if all_exist:
        print("✅ Todos los directorios necesarios existen o han sido creados.")
        print("La estructura del proyecto es correcta para desplegar en Railway.")
    else:
        print("❌ Faltan algunos directorios necesarios.")
        print("Revisa los mensajes anteriores y crea los directorios faltantes.")
    
    # Mensaje sobre variables de entorno
    print("\nRecuerda configurar estas variables de entorno en Railway:")
    print("- SECRET_KEY (clave secreta para Flask)")
    print("- FIREBASE_DB_URL (URL de tu base de datos Firebase)")
    print("- FIREBASE_STORAGE_BUCKET (nombre de tu bucket de Storage)")
    print("- FIREBASE_CREDENTIALS (JSON de credenciales de servicio de Firebase)")
    print("- GOOGLE_OAUTH_CREDENTIALS (JSON de credenciales de OAuth)")

if __name__ == "__main__":
    main()
