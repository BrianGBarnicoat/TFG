from googleapiclient.discovery import build
from flask import request, jsonify
from datetime import datetime, timedelta
from auth import get_credentials

def create_calendar_event(service, title, start_time, end_time, description=""):
    event = {
        'summary': title,
        'description': description,
        'start': {
            'dateTime': start_time.isoformat(),
            'timeZone': 'UTC',  # Se añade la zona horaria
        },
        'end': {
            'dateTime': end_time.isoformat(),
            'timeZone': 'UTC',  # Se añade la zona horaria
        },
    }
    event = service.events().insert(calendarId='primary', body=event).execute()
    return event.get('htmlLink')

def dst_start(year):
    # Último domingo de marzo para España
    d = datetime(year, 3, 31)
    while d.weekday() != 6:  # Sunday
        d -= timedelta(days=1)
    return d

def agregar_evento():
    creds = get_credentials()
    if not creds:
        return jsonify({"status": "error", "message": "No autorizado"})
    try:
        service = build('calendar', 'v3', credentials=creds)
        datos = request.json
        titulo = datos.get('titulo', 'Evento sin título')
        # Se espera que el JSON tenga 'fecha' (YYYY-MM-DD), 'hora_inicio' y 'hora_fin' en formato "HH:MM" 24h
        fecha_str = datos.get('fecha')
        hora_inicio_str = datos.get('hora_inicio')
        hora_fin_str = datos.get('hora_fin')
        if not (fecha_str and hora_inicio_str and hora_fin_str):
            return jsonify({"status": "error", "message": "Faltan datos: se requieren 'fecha', 'hora_inicio' y 'hora_fin'"})
        # Convertir a objetos datetime (naive)
        raw_start = datetime.strptime(f"{fecha_str} {hora_inicio_str}", '%Y-%m-%d %H:%M')
        raw_end = datetime.strptime(f"{fecha_str} {hora_fin_str}", '%Y-%m-%d %H:%M')
        # Calcular el inicio del DST para el año ingresado
        year = int(fecha_str[:4])
        if raw_start >= dst_start(year):
            offset_hours = 2
        else:
            offset_hours = 1
        start_time = raw_start - timedelta(hours=offset_hours)
        end_time = raw_end - timedelta(hours=offset_hours)
        descripcion = datos.get('descripcion', '')
        enlace = create_calendar_event(service, titulo, start_time, end_time, descripcion)
        return jsonify({"status": "success", "evento": enlace})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

def borrar_evento():
    creds = get_credentials()
    if not creds:
        return jsonify({"status": "error", "message": "No autorizado"})
    try:
        service = build('calendar', 'v3', credentials=creds)
        datos = request.json
        
        # Se espera que solo se envíe "event_name"
        event_name = datos.get('event_name')
        if not event_name:
            return jsonify({"status": "error", "message": "Falta event_name"})
        
        events_result = service.events().list(
            calendarId='primary',
            q=event_name,
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        events = events_result.get('items', [])
        found_event = None
        for event in events:
            if event.get('summary', '').strip().lower() == event_name.strip().lower():
                found_event = event
                break
        if not found_event:
            return jsonify({"status": "error", "message": "Evento no encontrado"})
        
        service.events().delete(calendarId='primary', eventId=found_event.get('id')).execute()
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

def get_calendar_events():
    creds = get_credentials()
    if not creds:
        return {"status": "error", "message": "No autorizado"}
    try:
        service = build('calendar', 'v3', credentials=creds)
        from flask import request  # ...existing code...
        # Tomar año de la query o de la fecha actual
        year = request.args.get("year")
        if year:
            year = int(year)
        else:
            now = datetime.utcnow()
            year = now.year

        # Siempre mostrar eventos desde el 1 de enero hasta el 31 de diciembre del año actual
        first_day = datetime(year, 1, 1)
        next_month = datetime(year+1, 1, 1)

        timeMin = first_day.isoformat() + 'Z'
        timeMax = next_month.isoformat() + 'Z'
        events_result = service.events().list(
            calendarId='primary',
            timeMin=timeMin,
            timeMax=timeMax,
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        events = events_result.get('items', [])
        events_transformed = []
        now_ts = datetime.utcnow()
        for event in events:
            summary = event.get('summary', 'Sin título')
            start = event['start'].get('dateTime', event['start'].get('date'))
            # Procesar fecha de finalización para determinar si completado
            completed = False
            if event.get('end'):
                end = event['end'].get('dateTime', event['end'].get('date'))
                try:
                    event_end = datetime.fromisoformat(end.replace("Z", "+00:00"))
                    if event_end < now_ts:
                        completed = True
                except Exception:
                    pass
            events_transformed.append({
                'summary': summary,
                'start': start,
                'id': event.get('id'),
                'completed': completed
            })
        return {"status": "success", "events": events_transformed}
    except Exception as e:
        return {"status": "error", "message": str(e)}
