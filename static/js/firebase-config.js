// ...existing code...

// Agregar funciones para guardar tema y colores
const Firebase = {
    // ...existing code...

    /**
     * Guarda el tema seleccionado por el usuario en Firebase
     * @param {string} emailKey - Email del usuario en formato de clave Firebase
     * @param {string} tema - Nombre del tema seleccionado
     */
    guardarTema: function(emailKey, tema) {
        if (!emailKey) return;
        
        const userRef = firebase.database().ref(`usuarios/${emailKey}/preferencias`);
        userRef.child('tema').set(tema)
            .then(() => console.log('Tema guardado en Firebase:', tema))
            .catch(error => console.error('Error al guardar tema en Firebase:', error));
    },
    
    /**
     * Guarda un color personalizado en Firebase
     * @param {string} emailKey - Email del usuario en formato de clave Firebase
     * @param {string} cssVar - Variable CSS (ej: --primary-color)
     * @param {string|null} valor - Valor del color o null para eliminar
     */
    guardarColor: function(emailKey, cssVar, valor) {
        if (!emailKey) return;
        
        // Convertir nombre de variable CSS a formato compatible con Firebase
        const nombreColor = cssVar.replace('--', '').replace(/-/g, '_');
        
        const userRef = firebase.database().ref(`usuarios/${emailKey}/preferencias/colores`);
        
        if (valor === null) {
            // Eliminar el color
            userRef.child(nombreColor).remove()
                .then(() => console.log(`Color ${nombreColor} eliminado de Firebase`))
                .catch(error => console.error(`Error al eliminar color ${nombreColor}:`, error));
        } else {
            // Guardar el color
            userRef.child(nombreColor).set(valor)
                .then(() => console.log(`Color ${nombreColor} guardado en Firebase:`, valor))
                .catch(error => console.error(`Error al guardar color ${nombreColor}:`, error));
        }
    },
    
    /**
     * Obtiene las preferencias de tema del usuario desde Firebase
     * @param {string} emailKey - Email del usuario en formato de clave Firebase
     * @returns {Promise} - Promesa que resuelve con las preferencias o null
     */
    obtenerPreferencias: function(emailKey) {
        if (!emailKey) return Promise.resolve(null);
        
        return firebase.database().ref(`usuarios/${emailKey}/preferencias`)
            .once('value')
            .then(snapshot => snapshot.val());
    }
    
    // ...existing code...
};

// ...existing code...
