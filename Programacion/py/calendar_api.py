"""
Módulo para gestionar la integración con Google Calendar.
Este archivo contiene las funciones necesarias para obtener, crear y borrar eventos en Google Calendar.
"""

from googleapiclient.discovery import build
from flask import request, jsonify, session
from datetime import datetime, timedelta
import os

# Importar la función get_credentials de auth.py
from auth import get_credentials

def create_calendar_event(service, title, start_time, duration=60, description=""):
    """
    Crea un evento en Google Calendar
    
    Args:
        service: Servicio de Google Calendar
        title: Título del evento
        start_time: Fecha y hora de inicio (objeto datetime)
        duration: Duración en minutos (por defecto: 60)
        description: Descripción del evento (opcional)
        
    Returns:
        URL del evento creado
    """
    event = {
        'summary': title,
        'description': description,
        'start': {
            'dateTime': start_time.isoformat(),
            'timeZone': 'Europe/Madrid',  # Usar zona horaria de España
        },
        'end': {
            'dateTime': (start_time + timedelta(minutes=duration)).isoformat(),
            'timeZone': 'Europe/Madrid',  # Usar zona horaria de España
        },
    }
    
    # Insertar el evento en el calendario principal del usuario
    created_event = service.events().insert(calendarId='primary', body=event).execute()
    return created_event

def agregar_evento():
    """
    Endpoint para crear un evento en el calendario del usuario
    
    Espera un JSON con los siguientes campos:
    - titulo: Título del evento
    - fecha: Fecha y hora del evento (formato ISO: YYYY-MM-DDTHH:MM:SS)
    - duracion: Duración en minutos (opcional, por defecto 60)
    - descripcion: Descripción del evento (opcional)
    
    Returns:
        Respuesta JSON con el estado de la operación
    """
    # Verificar si el usuario está autenticado
    if 'user' not in session:
        return jsonify({"status": "error", "message": "Usuario no autenticado"}), 401
    
    # Obtener credenciales de Google
    creds = get_credentials()
    if not creds:
        return jsonify({"status": "error", "message": "No autorizado o credenciales expiradas"}), 401
    
    try:
        # Crear el servicio de Google Calendar
        service = build('calendar', 'v3', credentials=creds)
        
        # Obtener datos del evento desde la petición
        datos = request.json
        titulo = datos.get('titulo', 'Evento sin título')
        
        # Convertir la fecha de string a objeto datetime
        try:
            fecha_str = datos.get('fecha')
            fecha = datetime.fromisoformat(fecha_str.replace('Z', '+00:00'))
        except (ValueError, AttributeError):
            return jsonify({
                "status": "error", 
                "message": "Formato de fecha inválido. Use YYYY-MM-DDTHH:MM:SS"
            }), 400
            
        duracion = int(datos.get('duracion', 60))
        descripcion = datos.get('descripcion', '')
        
        # Crear el evento en el calendario
        evento = create_calendar_event(service, titulo, fecha, duracion, descripcion)
        
        # Registrar en logs para depuración
        print(f"Evento creado: {titulo} el {fecha} ({evento.get('id')})")
        
        # Retornar respuesta exitosa
        return jsonify({
            "status": "success", 
            "message": "Evento creado correctamente",
            "evento": {
                "id": evento.get('id'),
                "htmlLink": evento.get('htmlLink'),
                "titulo": titulo,
                "fecha": fecha_str,
                "duracion": duracion
            }
        })
        
    except Exception as e:
        # Registrar error en logs
        print(f"Error al crear evento: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

def borrar_evento():
    """
    Endpoint para borrar un evento del calendario
    
    Espera un JSON con los siguientes campos:
    - event_id: ID del evento a eliminar
    
    Returns:
        Respuesta JSON con el estado de la operación
    """
    # Verificar si el usuario está autenticado
    if 'user' not in session:
        return jsonify({"status": "error", "message": "Usuario no autenticado"}), 401
    
    # Obtener credenciales de Google
    creds = get_credentials()
    if not creds:
        return jsonify({"status": "error", "message": "No autorizado o credenciales expiradas"}), 401
    
    try:
        # Crear el servicio de Google Calendar
        service = build('calendar', 'v3', credentials=creds)
        
        # Obtener ID del evento a borrar
        datos = request.json
        event_id = datos.get('event_id')
        
        if not event_id:
            return jsonify({"status": "error", "message": "Falta el ID del evento"}), 400
            
        # Borrar el evento
        service.events().delete(calendarId='primary', eventId=event_id).execute()
        
        # Registrar en logs
        print(f"Evento borrado: {event_id}")
        
        # Retornar respuesta exitosa
        return jsonify({
            "status": "success", 
            "message": "Evento eliminado correctamente"
        })
        
    except Exception as e:
        # Registrar error en logs
        print(f"Error al borrar evento: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

def get_calendar_events():
    """
    Obtiene los próximos eventos del calendario del usuario
    
    Returns:
        Lista de eventos formateada para la UI
    """
    # Verificar si el usuario está autenticado
    if 'user' not in session:
        return {"status": "error", "message": "Usuario no autenticado"}
    
    # Obtener credenciales de Google
    creds = get_credentials()
    if not creds:
        return {"status": "error", "message": "No autorizado o credenciales expiradas"}
    
    try:
        # Crear el servicio de Google Calendar
        service = build('calendar', 'v3', credentials=creds)
        
        # Calcular fecha actual
        now = datetime.utcnow().isoformat() + 'Z'  # 'Z' indica UTC
        
        # Obtener eventos del calendario (próximos 30 días)
        events_result = service.events().list(
            calendarId='primary',
            timeMin=now,
            timeMax=(datetime.utcnow() + timedelta(days=30)).isoformat() + 'Z',
            maxResults=50,  # Aumentar para mostrar más eventos
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        
        # Extraer eventos
        events = events_result.get('items', [])
        
        # Formatear eventos para la UI
        events_transformed = []
        for event in events:
            summary = event.get('summary', 'Sin título')
            start = event['start'].get('dateTime', event['start'].get('date'))
            end = event['end'].get('dateTime', event['end'].get('date'))
            description = event.get('description', '')
            
            events_transformed.append({
                'id': event.get('id'),
                'summary': summary,
                'description': description,
                'start': start,
                'end': end,
                'htmlLink': event.get('htmlLink', '')
            })
        
        # Registrar número de eventos encontrados
        print(f"Eventos encontrados: {len(events_transformed)}")
        
        return {"status": "success", "events": events_transformed}
        
    except Exception as e:
        # Registrar error en logs
        print(f"Error al obtener eventos: {str(e)}")
        return {"status": "error", "message": str(e)}
