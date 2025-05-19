from flask import Flask, request, jsonify
from auth import get_credentials  # Importa la función para obtener las credenciales
from googleapiclient.discovery import build
from datetime import datetime
import datetime as dt

# Define funciones de fitness
def aggregate_fitness_data(data_type, start_time, end_time):
    service = build('fitness', 'v1', credentials=get_credentials())
    body = {
        "aggregateBy": [{"dataTypeName": data_type}],
        "bucketByTime": {"durationMillis": int((end_time - start_time).total_seconds() * 1000)},
        "startTimeMillis": int(start_time.timestamp() * 1000),
        "endTimeMillis": int(end_time.timestamp() * 1000)
    }
    response = service.users().dataset().aggregate(userId="me", body=body).execute()
    total = 0
    for bucket in response.get("bucket", []):
         for dataset in bucket.get("dataset", []):
              for point in dataset.get("point", []):
                   for value in point.get("value", []):
                        # Suma de enteros o flotantes
                        total += value.get("intVal", 0) or value.get("fpVal", 0)
    return total

def get_fitness_data(metric, date_str):
    try:
        start_time = dt.datetime.strptime(date_str, '%Y-%m-%d')
    except Exception as e:
        raise ValueError("Formato de fecha inválido, use YYYY-MM-DD")
    today_start = dt.datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    if start_time.date() == today_start.date():
        end_time = dt.datetime.now()
    else:
        end_time = start_time + dt.timedelta(days=1)
    if metric == "steps":
        data_type = "com.google.step_count.delta"
    elif metric == "calories":
        data_type = "com.google.calories.expended"
    elif metric == "distance":
        data_type = "com.google.distance.delta"
    else:
        raise ValueError("Métrica desconocida")
    try:
        result = aggregate_fitness_data(data_type, start_time, end_time)
        if result == 0:
            print(f"API respondió correctamente, pero no hay datos para el día {date_str} en la métrica {metric}.")
        else:
            print(f"API respondió, datos obtenidos en {metric}: {result}.")
        return result  # Siempre retorna el valor numérico, incluso 0
    except Exception as e:
        print(f"Error en get_fitness_data: {str(e)}")
        return "No disponible"

def get_sleep_data(date_str):
    try:
        start_time = dt.datetime.strptime(date_str, '%Y-%m-%d')
    except Exception as e:
        raise ValueError("Formato de fecha inválido, use YYYY-MM-DD")
    end_time = start_time + dt.timedelta(days=1)
    data_type = "com.google.sleep.segment"
    try:
         result = aggregate_fitness_data(data_type, start_time, end_time)
         if result == 0:
             print(f"API respondió correctamente, pero no hay datos de sueño para el día {date_str}.")
         else:
             print(f"API respondió, datos de sueño obtenidos: {result}.")
         return result  # Siempre retorna el valor numérico, incluso 0
    except Exception as e:
         print(f"Error en get_sleep_data: {str(e)}")
         return "No disponible"

app = Flask(__name__)

# Modificar el endpoint /datos para indicar si la API respondió sin datos
@app.route('/datos', methods=['POST'])
def obtener_datos():
    try:
        data = request.get_json()
        fecha_str = data.get("fecha")
        if not fecha_str:
            return jsonify({"status": "error", "message": "Fecha no proporcionada."}), 400
        
        fecha = datetime.strptime(fecha_str, "%Y-%m-%d").date()
        today = datetime.now().date()
        if fecha > today:
            return jsonify({
                "status": "success",
                "mensaje": "No hay datos para el dia posterior al dia actual",
                "data": {"steps": 0, "calories": 0, "distance": 0, "sleep": 0}
            })

        pasos    = get_fitness_data("steps", fecha_str)
        calorias = get_fitness_data("calories", fecha_str)
        distancia = get_fitness_data("distance", fecha_str)
        sueno    = get_sleep_data(fecha_str)

        return jsonify({
            "status": "success",
            "data": {
                "steps": pasos,
                "calories": calorias,
                "distance": distancia,
                "sleep": sueno
            }
        })
    except Exception as e:
        print(f"Error en /datos: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)

# No se ha encontrado código inactivo en este archivo.