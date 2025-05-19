# 📌 TFG - Programa de Hospitalización en el Mundo del Desarrollo Web

## 🏥 Descripción del Proyecto
Nuestro Trabajo de Fin de Grado (TFG) consiste en el desarrollo de una **página web centrada en la salud y el bienestar**, con un enfoque especial en la **diabetes, la alimentación saludable y el ejercicio diario**.

### 🎯 Objetivos
1. **Promover una vida saludable** mediante planes de alimentación y entrenamiento personalizados.
2. **Facilitar el seguimiento de la salud** a través de herramientas digitales interactivas.
3. **Desarrollar una infraestructura robusta**, incluyendo un **servidor local** con acceso a través de **OpenVPN**.
4. **Integración con APIs de terceros** como **Google Fit y Samsung Health** para recopilar datos sobre la actividad física.

## 🛠️ Tecnologías Utilizadas
### 💻 Desarrollo Web
- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Python con Flask
- **Base de Datos**: Firebase Firestore

### 🔌 APIs Integradas
- **Google Fit API**: Para la obtención de datos de actividad física.
- **Samsung Health API**: Para la sincronización con dispositivos Samsung.
- **Google Calendar API**: Para programar eventos y recordatorios de salud.

### 🔒 Seguridad y Autenticación
- **Autenticación con Google OAuth** para el inicio de sesión.
- **Cifrado de contraseñas** con Flask-Bcrypt.

## 🔗 Estructura del Proyecto
```
TFG/
├── .venv/                           # Entorno virtual para gestionar las dependencias del proyecto
├── Documentos/
│   └── (Archivos relacionados como propuestas, documentación, etc.)
├── Librerias/
│   └── (Archivos de instalación, como `get-pip.py`, y otras librerías externas si las necesitas)
├── Programacion/
│   ├── claves seguras/
│   │   ├── credentials.json         # Credenciales para la API de Google
│   │   ├── SECRET_KEY.env           # Archivo para variables sensibles
│   │   ├── token.json               # Token de autorización de Google
│   │   └── .gitignore               # Ignorar archivos sensibles al subir al repositorio
│   ├── Login/
│   │   ├── loging.html              # Plantilla de login y registro
│   │   └── img/                     # Imágenes relacionadas con la página de login
│   │       ├── google.png
│   │       ├── twitter.png
│   │       ├── VytalGym logo pantas.jpg
│   │       ├── VytalGym Logo sin fondo.png
│   │       └── VytalGym Logo.png
│   ├── POST/
│   │   └── chat.py                  # Archivo relacionado con la funcionalidad POST o endpoints
│   ├── profile/
│   │   └── profile.html             # Página de perfil del usuario
│   ├── py/
│   │   ├── __pycache__/             # Caché de Python
│   │   ├── __init__.py              # Inicialización del módulo
│   │   ├── app.py                   # Archivo principal de la aplicación
│   │   ├── auth.py                  # Manejo de autenticación (Google OAuth)
│   │   ├── calendar_api.py          # Interacciones con Google Calendar
│   │   └── fitness.py               # API de datos relacionados con fitness
│   ├── static/
│   │   ├── css/
│   │   │   ├── loginstyle.css       # Estilo para la página de login
│   │   │   ├── pagina.css           # Estilo general de las páginas
│   │   │   └── style.css            # Otros estilos generales
│   │   ├── js/
│   │   │   ├── loginscript.js       # JS específico para login/registro
│   │   │   └── script.js            # Scripts generales
│   │   └── imagenes/                # Recursos gráficos utilizados en el proyecto
│   │       └── (Otras imágenes relevantes)
│   └── templates/
│       ├── Actividad.html           # Plantilla para la sección de actividad
│       ├── alimentacion.html        # Página relacionada con alimentación
│       ├── Botones.html             # Botones o componentes UI específicos
│       ├── configuracion.html       # Configuración del usuario o aplicación
│       ├── contacto.html            # Página de contacto
│       ├── fitness.html             # Página de estadísticas fitness
│       ├── Precios.html             # Sección de planes/precios
│       └── Principal.html           # Página principal de la aplicación
        └── salud.html               # Página reacionada con la salud
└── README.md                        # Archivo de documentación del proyecto
```

## ⚙️ Implementación del Servidor Local
Nuestro plan es montar un **servidor físico** con acceso a internet y configurarlo para que los usuarios puedan conectarse de forma remota. Este servidor incluirá:
- **Linux como sistema operativo**
- **8GB de RAM**
- **Red conectada directamente al router**
- **Configuración de una VPN (OpenVPN) para acceso seguro**

## 📅 Desarrollo Futuro
En el futuro, planeamos:
- Ampliar la página web con **más funcionalidades interactivas**.
- Implementar una **aplicación móvil** con React Native o Flutter.
- Mejorar la seguridad y escalabilidad del servidor.

## 🏫 Tutores del Proyecto
- **Don Ciro**: Experto en **HTML, JavaScript y CSS**.
- **Elizabeth**: Conocimiento en **diseño de interfaces web**.

---
**Autores**: Brian García Barnicoat y Pablo Ortega Fernández. 🚀

