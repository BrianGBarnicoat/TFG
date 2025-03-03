#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script para verificar la configuración de Firebase en Railway
Este script comprueba que las variables de entorno necesarias estén configuradas
y que el formato de las credenciales sea correcto.
"""

import os
import json
import sys
import base64

def verificar_variable_entorno(nombre_variable):
    """Verifica si una variable de entorno existe y tiene contenido."""
    valor = os.getenv(nombre_variable)
    if not valor:
        print(f"❌ ERROR: La variable {nombre_variable} no está configurada.")
        return False
    
    print(f"✅ La variable {nombre_variable} está configurada.")
    
    # Si es FIREBASE_CREDENTIALS, verificar que sea un JSON válido
    if nombre_variable == 'FIREBASE_CREDENTIALS':
        try:
            # Mostrar algunos caracteres para verificación (sin mostrar toda la clave privada)
            print(f"   Primeros caracteres: {valor[:50]}...")
            json_data = json.loads(valor)
            
            # Verificar campos críticos
            campos_requeridos = ['type', 'project_id', 'private_key', 'client_email']
            for campo in campos_requeridos:
                if campo not in json_data:
                    print(f"❌ ERROR: El campo '{campo}' no está presente en FIREBASE_CREDENTIALS")
                    return False
            
            print("✅ El formato JSON de FIREBASE_CREDENTIALS es válido.")
            print(f"   - Project ID: {json_data['project_id']}")
            print(f"   - Client Email: {json_data['client_email']}")
            
            # Verificar que la clave privada parece correcta
            if "PRIVATE KEY" not in json_data['private_key']:
                print("⚠️ Advertencia: La clave privada no parece tener el formato esperado.")
            
            return True
        except json.JSONDecodeError:
            print("❌ ERROR: FIREBASE_CREDENTIALS no es un JSON válido.")
            return False
        except Exception as e:
            print(f"❌ ERROR al verificar FIREBASE_CREDENTIALS: {e}")
            return False
    
    return True

def main():
    """Función principal."""
    print("\n🔍 VERIFICANDO CONFIGURACIÓN DE FIREBASE EN RAILWAY\n")
    
    # Verificar si estamos en Railway
    if not os.getenv('RAILWAY_PUBLIC_DOMAIN'):
        print("ℹ️ Este script está diseñado para ejecutarse en Railway.")
        print("   Sin embargo, continuaremos verificando las variables locales.\n")
    
    # Variables obligatorias a verificar
    variables = [
        'FIREBASE_CREDENTIALS',
        'FIREBASE_DB_URL',
        'FIREBASE_STORAGE_BUCKET'
    ]
    
    # Verificar cada variable
    resultados = {}
    for variable in variables:
        resultados[variable] = verificar_variable_entorno(variable)
    
    # Resumen
    print("\n📊 RESUMEN DE VERIFICACIÓN\n")
    
    todas_correctas = all(resultados.values())
    if todas_correctas:
        print("✅ Todas las variables están configuradas correctamente.")
    else:
        print("❌ Se encontraron problemas con algunas variables.")
        
        # Variables faltantes
        faltantes = [v for v, r in resultados.items() if not r]
        if faltantes:
            print("\n⚠️ VARIABLES FALTANTES O CON PROBLEMAS:")
            for f in faltantes:
                print(f"   - {f}")
            
            # Instrucciones específicas para cada variable
            print("\n📝 INSTRUCCIONES PARA ARREGLAR:")
            
            if 'FIREBASE_CREDENTIALS' in faltantes:
                print("""
Para configurar FIREBASE_CREDENTIALS en Railway:
1. Ve a tu proyecto en Railway > Variables
2. Haz clic en + New Variable
3. En Raw Editor, copia TODO el contenido de tu archivo firebase_admin_credentials.json
4. Asegúrate de que el JSON esté bien formateado y no tenga comillas adicionales
5. Guarda la variable
                """)
            
            if 'FIREBASE_DB_URL' in faltantes:
                print("""
Para configurar FIREBASE_DB_URL:
1. Ve a tu proyecto en Railway > Variables
2. Añade la variable con el valor: https://tfgpb-448609-default-rtdb.firebaseio.com
                """)
                
            if 'FIREBASE_STORAGE_BUCKET' in faltantes:
                print("""
Para configurar FIREBASE_STORAGE_BUCKET:
1. Ve a tu proyecto en Railway > Variables
2. Añade la variable con el valor: tfgpb-448609.firebasestorage.app
                """)
    
    print("\n✨ VERIFICACIÓN COMPLETADA\n")
    
    if not todas_correctas:
        sys.exit(1)

if __name__ == "__main__":
    main()
