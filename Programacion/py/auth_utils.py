"""
Utilidades de autenticación y manejo de preferencias con Firebase
"""
import firebase_admin
from firebase_admin import db
from flask import session

def guardar_preferencia_firebase(email_key, tipo, clave, valor):
    """
    Guarda una preferencia en Firebase Realtime Database
    
    Args:
        email_key: Email del usuario con puntos reemplazados por guiones bajos
        tipo: 'tema', 'color', etc.
        clave: Identificador de la preferencia
        valor: Valor a guardar (None para eliminar)
    """
    try:
        # Referencia a la ubicación de las preferencias del usuario
        ref = db.reference(f"/usuarios/{email_key}/preferencias")
        
        # Para colores, guardar en la subcategoría 'colores'
        if tipo == 'color':
            # Convertir nombre CSS a formato Firebase (--primary-color -> primary_color)
            firebase_key = clave.replace('--', '').replace('-', '_')
            color_ref = ref.child('colores')
            
            if valor is None:
                # Eliminar el color si el valor es None
                color_ref.child(firebase_key).delete()
            else:
                # Guardar o actualizar el color
                color_ref.child(firebase_key).set(valor)
                
        # Para temas, guardar directamente
        elif tipo == 'tema':
            ref.child('tema').set(valor)
            
        return True
        
    except Exception as e:
        print(f"Error al guardar preferencia: {str(e)}")
        return False

def cargar_preferencias_firebase(email_key):
    """
    Carga las preferencias de un usuario desde Firebase
    
    Args:
        email_key: Email del usuario con puntos reemplazados por guiones bajos
        
    Returns:
        Diccionario con las preferencias (tema y colores)
    """
    # Estructura por defecto
    preferencias = {'tema': 'default', 'colores': {}}
    
    try:
        # Obtener referencia a las preferencias del usuario
        ref = db.reference(f"/usuarios/{email_key}/preferencias")
        pref_data = ref.get()
        
        if not pref_data:
            return preferencias
            
        # Cargar tema si existe
        if 'tema' in pref_data:
            preferencias['tema'] = pref_data['tema']
            
        # Cargar colores si existen
        if 'colores' in pref_data:
            for key, valor in pref_data['colores'].items():
                # Convertir formato Firebase a CSS (primary_color -> --primary-color)
                css_key = f"--{key.replace('_', '-')}"
                preferencias['colores'][css_key] = valor
                
        return preferencias
        
    except Exception as e:
        print(f"Error al cargar preferencias: {str(e)}")
        return preferencias

def actualizar_sesion_preferencias(email_key):
    """
    Actualiza las preferencias del usuario en la sesión
    
    Args:
        email_key: Email del usuario con puntos reemplazados por guiones bajos
    """
    if 'user' not in session:
        return False
        
    try:
        # Cargar preferencias desde Firebase
        preferencias = cargar_preferencias_firebase(email_key)
        
        # Actualizar la sesión
        session['user_preferences'] = preferencias
        session.modified = True
        
        return True
    
    except Exception as e:
        print(f"Error al actualizar sesión: {str(e)}")
        return False
