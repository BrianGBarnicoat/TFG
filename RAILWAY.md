# Instrucciones para desplegar en Railway

Este documento contiene instrucciones específicas para desplegar la aplicación en Railway correctamente.

## Estructura del proyecto

La aplicación espera encontrar la siguiente estructura de directorios:

```
Programacion/
├── py/          # Código Python
├── templates/   # Plantillas HTML
├── static/      # Archivos estáticos
├── Login/       # Archivos de login
└── profile/     # Configuración de perfil
```

Puedes verificar y crear los directorios faltantes con el script `verify_structure.py`.

## Variables de entorno requeridas

Para que la aplicación funcione correctamente en Railway, debes configurar las siguientes variables de entorno:

### Variables críticas

- `SECRET_KEY`: Clave secreta para Flask (usar una generada aleatoriamente)
  ```bash
  python -c "import os; print(os.urandom(24).hex())"
  ```

- `FIREBASE_DB_URL`: URL de tu base de datos Firebase
  ```
  https://tfgpb-448609-default-rtdb.firebaseio.com
  ```

- `FIREBASE_STORAGE_BUCKET`: Bucket de Firebase Storage
  ```
  tfgpb-448609.appspot.com
  ```

### Credenciales

- `FIREBASE_CREDENTIALS`: Contenido del archivo JSON de credenciales de servicio de Firebase
  - Usa el script `export_credentials.py` para obtener este valor formateado

- `GOOGLE_OAUTH_CREDENTIALS`: Contenido del archivo JSON de credenciales OAuth de Google
  - Usa el script `export_credentials.py` para obtener este valor formateado

- `GOOGLE_REFRESH_TOKEN`: Token de actualización para la API de Google
  - Extraído automáticamente por `export_credentials.py`

## Pasos para desplegar

1. **Preparar tu código**:
   - Asegúrate de que todos los directorios necesarios existen
   - Ejecuta `verify_structure.py` para crear los directorios faltantes
   - Asegúrate de que `requirements.txt` incluya todas las dependencias
   - Confirma que `Procfile` está configurado correctamente

2. **Configurar Railway**:
   - Inicia sesión en [Railway](https://railway.app/)
   - Conecta tu repositorio de GitHub
   - Establece las variables de entorno mencionadas arriba
   - Despliega la aplicación

3. **Verificar logs**:
   - Después del despliegue, revisa los logs para cualquier error
   - Asegúrate de que la aplicación esté escuchando en el puerto correcto
   - Verifica que se están cargando correctamente las credenciales

4. **Actualizar URLs de redirección**:
   - En la consola de Google Cloud, actualiza las URLs de redirección autorizadas:
     - `https://YOUR-RAILWAY-DOMAIN.railway.app/oauth2callback`
   - En la variable `GOOGLE_OAUTH_CREDENTIALS`, asegúrate que las `redirect_uris` incluyan la URL de Railway

## Solución de problemas comunes

### "Application failed to respond"
- Verifica que estás usando `gunicorn` en el `Procfile`
- Asegúrate de que la aplicación use el puerto `$PORT` proporcionado por Railway
- Confirma que todas las variables de entorno estén configuradas

### Errores de autenticación
- Revisa los logs para ver mensajes específicos de error
- Asegúrate de que las credenciales JSON estén correctamente formateadas
- Verifica que las URLs de redirección estén actualizadas

### Problemas con rutas de archivos
- La aplicación usa rutas relativas, asegúrate de que la estructura de directorios sea correcta
- Si faltan directorios, créalos manualmente o usa el script `verify_structure.py`
