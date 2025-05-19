from db import get_db

def guardar_preferencia(user_id, tipo, clave, valor):
    """
    Guarda o actualiza una preferencia de usuario
    
    Args:
        user_id: ID del usuario
        tipo: Tipo de preferencia ('color', 'tema', etc.)
        clave: Nombre/ID de la preferencia
        valor: Valor a guardar (None para eliminar)
    """
    db = get_db()
    cursor = db.cursor()
    
    if valor is None:
        # Si el valor es None, eliminar la preferencia
        cursor.execute(
            'DELETE FROM preferencias WHERE user_id = ? AND tipo = ? AND clave = ?',
            (user_id, tipo, clave)
        )
    else:
        # Verificar si ya existe la preferencia
        cursor.execute(
            'SELECT id FROM preferencias WHERE user_id = ? AND tipo = ? AND clave = ?',
            (user_id, tipo, clave)
        )
        
        result = cursor.fetchone()
        
        if result:
            # Actualizar existente
            cursor.execute(
                'UPDATE preferencias SET valor = ? WHERE id = ?',
                (valor, result[0])
            )
        else:
            # Insertar nueva
            cursor.execute(
                'INSERT INTO preferencias (user_id, tipo, clave, valor) VALUES (?, ?, ?, ?)',
                (user_id, tipo, clave, valor)
            )
    
    db.commit()

def cargar_preferencias(user_id):
    """
    Carga todas las preferencias de un usuario
    
    Args:
        user_id: ID del usuario
        
    Returns:
        Dict con todas las preferencias organizadas por tipo
    """
    db = get_db()
    cursor = db.cursor()
    
    cursor.execute(
        'SELECT tipo, clave, valor FROM preferencias WHERE user_id = ?',
        (user_id,)
    )
    
    preferencias = {
        'colores': {},
        'tema': 'default'
    }
    
    for tipo, clave, valor in cursor.fetchall():
        if tipo == 'color':
            preferencias['colores'][clave] = valor
        elif tipo == 'tema':
            preferencias['tema'] = valor
    
    return preferencias
