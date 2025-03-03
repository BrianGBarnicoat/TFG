# Guía de configuración para Railway

## Variables de entorno requeridas

Para que la aplicación funcione correctamente en Railway, es necesario configurar las siguientes variables de entorno:

### 1. FIREBASE_CREDENTIALS

Contiene el JSON completo con las credenciales de Firebase Admin SDK.

**Cómo configurar:**
1. Ve a tu proyecto en Railway > Variables
2. Haz clic en "+ New Variable"
3. Selecciona "Raw Editor" 
4. Nombre: `FIREBASE_CREDENTIALS`
5. Valor: Pega el contenido completo del archivo `firebase_admin_credentials.json`
6. Asegúrate de que es un JSON válido sin comillas adicionales
7. Guarda la variable

El JSON debe tener este aspecto:
