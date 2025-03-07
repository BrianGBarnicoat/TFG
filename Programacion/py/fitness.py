from flask import Flask, request, jsonify, session
from auth import get_credentials  # Importa la función para obtener las credenciales
from googleapiclient.discovery import build
from datetime import datetime, timedelta

# Define funciones de fitness
def get_fitness_data():
    """
    Obtiene datos de actividad física del usuario desde Google Fitness API
    
    Returns:
        Datos de actividad en formato JSON
    """
    # Verificar si el usuario está autenticado
    if 'user' not in session:
        return jsonify({"status": "error", "message": "Usuario no autenticado"}), 401
    
    # Obtener credenciales de Google
    creds = get_credentials()
    if not creds:
        return jsonify({"status": "error", "message": "No autorizado o credenciales expiradas"}), 401
    
    try:
        # Crear el servicio de Google Fitness
        fitness_service = build('fitness', 'v1', credentials=creds)
        
        # Calcular rangos de tiempo (últimos 7 días)
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(days=7)
        
        # Convertir a timestamp en milisegundos
        end_time_ms = int(end_time.timestamp() * 1000)
        start_time_ms = int(start_time.timestamp() * 1000)
        
        # Definir el cuerpo de la solicitud para obtener pasos diarios
        body = {
          "aggregateBy": [{
            "dataTypeName": "com.google.step_count.delta",
            "dataSourceId": "derived:com.google.step_count.delta:com.google.android.gms:estimated_steps"
          }],
          "bucketByTime": {"durationMillis": 86400000},  # Agrupar por día (86400000 ms = 24 horas)
          "startTimeMillis": start_time_ms,
          "endTimeMillis": end_time_ms
        }
        
        # Realizar la solicitud de datos agregados
        response = fitness_service.users().dataset().aggregate(userId="me", body=body).execute()
        
        # Formatear la respuesta
        steps_data = []
        for bucket in response.get('bucket', []):
            day_timestamp = int(bucket.get('startTimeMillis'))
            day_date = datetime.fromtimestamp(day_timestamp/1000).strftime('%Y-%m-%d')
            
            # Buscar los datos de pasos en el bucket
            steps = 0
            for dataset in bucket.get('dataset', []):
                for point in dataset.get('point', []):
                    steps += point.get('value', [{}])[0].get('intVal', 0)
            
            steps_data.append({
                'date': day_date,
                'steps': steps
            })
        
        return jsonify({
            "status": "success",
            "data": steps_data
        })
        
    except Exception as e:
        print(f"Error al obtener datos de fitness: {str(e)}")
        return jsonify({
            "status": "error", 
            "message": "Error al obtener datos de fitness",
            "details": str(e)
        }), 500

def get_sleep_data():
    """
    Obtiene datos de sueño del usuario desde Google Fitness API
    
    Returns:
        Datos de sueño en formato JSON
    """
    # Verificar si el usuario está autenticado
    if 'user' not in session:
        return jsonify({"status": "error", "message": "Usuario no autenticado"}), 401
    
    # Obtener credenciales de Google
    creds = get_credentials()
    if not creds:
        return jsonify({"status": "error", "message": "No autorizado o credenciales expiradas"}), 401
    
    try:
        # Crear el servicio de Google Fitness
        fitness_service = build('fitness', 'v1', credentials=creds)
        
        # Calcular rangos de tiempo (últimos 7 días)
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(days=7)
        
        # Convertir a timestamp en nanosegundos
        end_time_ns = int(end_time.timestamp() * 1000000000)
        start_time_ns = int(start_time.timestamp() * 1000000000)
        
        # Crear la solicitud para datos de sueño
        data_set = f"{start_time_ns}-{end_time_ns}"
        
        # Realizar la solicitud de datos de sueño
        response = fitness_service.users().sessions().list(
            userId="me",
            startTime=start_time.isoformat() + "Z",
            endTime=end_time.isoformat() + "Z",
            activityType=72  # 72 es el código para "sueño"
        ).execute()
        
        # Formatear la respuesta
        sleep_sessions = []
        for session in response.get('session', []):
            start = datetime.fromisoformat(session.get('startTimeMillis')[:-1])
            end = datetime.fromisoformat(session.get('endTimeMillis')[:-1])
            duration_minutes = (end - start).total_seconds() / 60
            
            sleep_sessions.append({
                'date': start.strftime('%Y-%m-%d'),
                'start': start.strftime('%H:%M'),
                'end': end.strftime('%H:%M'),
                'duration_minutes': round(duration_minutes),
                'name': session.get('name', 'Sesión de sueño')
            })
        
        return jsonify({
            "status": "success",
            "data": sleep_sessions
        })
        
    except Exception as e:
        print(f"Error al obtener datos de sueño: {str(e)}")
        return jsonify({
            "status": "error", 
            "message": "Error al obtener datos de sueño",
            "details": str(e)
        }), 500

app = Flask(__name__)

@app.route('/datos', methods=['POST'])
def obtener_datos():
    try:
        data = request.get_json()
        fecha_str = data.get("fecha")
        if not fecha_str:
            return jsonify({"status": "error", "message": "Fecha no proporcionada."}), 400
        
        fecha = datetime.strptime(fecha_str, "%Y-%m-%d")
        creds = get_credentials()
        if not creds:
            return jsonify({"status": "error", "message": "No autorizado"}), 401

        service = build("fitness", "v1", credentials=creds)
        fitness_data = get_fitness_data(service, fecha)
        sleep_data = get_sleep_data(service, fecha)

        return jsonify({
            "status": "success",
            "data": {
                "steps": fitness_data.get("steps", 0),
                "calories": fitness_data.get("calories", 0),
                "distance": fitness_data.get("distance", 0),
                "sleep": sleep_data.get("sleep", 0)
            }
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)

# No se ha encontrado código inactivo en este archivo.