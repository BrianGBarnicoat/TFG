-- ...existing tables...

-- Tabla para preferencias de usuario
CREATE TABLE IF NOT EXISTS preferencias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    tipo TEXT NOT NULL,  -- 'color', 'tema', etc.
    clave TEXT NOT NULL, -- nombre de la variable CSS o identificador
    valor TEXT,          -- valor del color o tema
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, tipo, clave) -- Solo una preferencia de cada tipo/clave por usuario
);
