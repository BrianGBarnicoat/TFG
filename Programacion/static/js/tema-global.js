/**
 * Sistema global de temas para VytalGym
 * Este script se encarga de aplicar el tema y colores personalizados
 * desde sessionStorage a todas las páginas
 */

// Ejecutar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  console.log("Inicializando sistema de temas global...");
  
  // Aplicar tema al cargar la página
  aplicarTemaGuardado();
  
  // Buscar variables CSS personalizadas guardadas
  aplicarColoresGuardados();
  
  // Iniciar escucha de cambios en tiempo real si Firebase está disponible
  iniciarEscuchaRealtime();
  
  console.log("Sistema de temas inicializado correctamente");
});

/**
 * Aplica el tema guardado en sessionStorage o localStorage
 */
function aplicarTemaGuardado() {
  // Orden de prioridad: sessionStorage > localStorage > default
  const tema = sessionStorage.getItem('user-theme') || 
               localStorage.getItem('selected-theme') || 
               'default';
  
  // Aplicar tema al elemento HTML
  document.documentElement.setAttribute('data-theme', tema);
  console.log(`Tema aplicado: ${tema}`);
}

/**
 * Aplica los colores personalizados guardados
 */
function aplicarColoresGuardados() {
  // Lista de variables CSS que pueden ser personalizadas
  const variablesCss = [
    'primaryColor', 'secondaryColor', 'textColor', 
    'backgroundColor', 'headerBg', 'cardColor'
  ];
  
  // Comprobar primero en sessionStorage (prioridad para usuario logueado)
  variablesCss.forEach(variable => {
    const sessionValue = sessionStorage.getItem(`user-${variable}`);
    if (sessionValue) {
      // Convertir nombre de variable a formato CSS
      const cssVar = `--${variable.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      document.documentElement.style.setProperty(cssVar, sessionValue);
      console.log(`Color aplicado desde sessionStorage: ${cssVar} = ${sessionValue}`);
    }
  });
  
  // Luego comprobar localStorage (para usuarios no logueados o preferencias locales)
  variablesCss.forEach(variable => {
    // Solo si no se encontró en sessionStorage
    if (!sessionStorage.getItem(`user-${variable}`)) {
      const localValue = localStorage.getItem(variable);
      if (localValue) {
        // Convertir nombre de variable a formato CSS
        const cssVar = `--${variable.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
        document.documentElement.style.setProperty(cssVar, localValue);
        console.log(`Color aplicado desde localStorage: ${cssVar} = ${localValue}`);
      }
    }
  });
}

/**
 * Inicia la escucha en tiempo real para cambios de tema en Firebase
 */
function iniciarEscuchaRealtime() {
  // Verificar si estamos en una sesión autenticada y Firebase está disponible
  const isLoggedIn = document.body.classList.contains('user-logged-in') || 
                     document.querySelector('meta[name="user-email"]');
  
  if (!isLoggedIn || !window.firebase || !firebase.database) {
    console.log("No se inicia escucha en tiempo real: Usuario no logueado o Firebase no disponible");
    return;
  }
  
  try {
    // Obtener el email del usuario (para identificarlo en Firebase)
    const userEmail = document.querySelector('meta[name="user-email"]').content;
    if (!userEmail) {
      console.warn("Email de usuario no disponible para escucha en tiempo real");
      return;
    }
    
    // Convertir email a formato Firebase (reemplazando . y @)
    const emailKey = userEmail.replace(/[\.\@]/g, '_');
    
    // Referencia a las preferencias del usuario en Firebase
    const prefsRef = firebase.database().ref(`usuarios/${emailKey}/preferencias`);
    
    // Escuchar cambios en las preferencias
    prefsRef.on('value', (snapshot) => {
      const data = snapshot.val() || {};
      console.log("Datos recibidos de Firebase:", data);
      
      // Si hay un tema, aplicarlo
      if (data.tema) {
        const nuevoTema = data.tema;
        const temaActual = document.documentElement.getAttribute('data-theme');
        
        if (nuevoTema !== temaActual) {
          document.documentElement.setAttribute('data-theme', nuevoTema);
          console.log(`Tema actualizado desde Firebase: ${nuevoTema}`);
          
          // Notificar el cambio
          document.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme: nuevoTema, source: 'firebase' }
          }));
        }
      }
      
      // Si hay colores personalizados, aplicarlos
      if (data.colores) {
        Object.entries(data.colores).forEach(([key, value]) => {
          const cssVar = `--${key.replace(/_/g, '-')}`;
          document.documentElement.style.setProperty(cssVar, value);
          
          // Guardar en sessionStorage para consistencia
          const storageKey = `user-${key.replace(/_([a-z])/g, (_, char) => char.toUpperCase())}`;
          sessionStorage.setItem(storageKey, value);
          
          console.log(`Color actualizado desde Firebase: ${cssVar} = ${value}`);
          
          // Notificar el cambio
          document.dispatchEvent(new CustomEvent('colorChanged', {
            detail: { variable: cssVar, value: value, source: 'firebase' }
          }));
        });
      }
    });
    
    console.log(`Escucha en tiempo real iniciada para usuario: ${emailKey}`);
  } catch (error) {
    console.error("Error al iniciar escucha en tiempo real:", error);
  }
}

/**
 * Guarda un color personalizado tanto en sessionStorage como en CSS
 */
window.guardarColorPersonalizado = function(variable, valor) {
  // Guardar en sessionStorage
  const storageKey = `user-${variable.replace('--', '').replace(/-([a-z])/g, (_, char) => char.toUpperCase())}`;
  sessionStorage.setItem(storageKey, valor);
  
  // Aplicar inmediatamente
  document.documentElement.style.setProperty(variable, valor);
  
  console.log(`Color guardado: ${variable} = ${valor}`);
  
  // Intentar guardar en servidor si el usuario está logueado
  const isLoggedIn = document.body.classList.contains('user-logged-in') || 
                     document.querySelector('meta[name="user-email"]');
  
  if (isLoggedIn) {
    fetch('/guardar_color_usuario', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify({
        variable: variable,
        valor: valor
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.status === 'success') {
        console.log(`Color guardado en servidor: ${variable}`);
      } else {
        console.warn(`Error al guardar color en servidor: ${data.message}`);
      }
    })
    .catch(error => {
      console.error("Error al guardar color en servidor:", error);
    });
  }
  
  return true;
};

/**
 * API para el gestor de colores 
 */
window.ColorManager = {
  applyColors: function(colorObject) {
    let count = 0;
    for (const [variable, value] of Object.entries(colorObject)) {
      if (window.guardarColorPersonalizado(variable, value)) {
        count++;
      }
    }
    return count;
  },
  
  resetAllColors: function() {
    const variablesCss = [
      'primaryColor', 'secondaryColor', 'textColor', 
      'backgroundColor', 'headerBg', 'cardColor'
    ];
    
    // Limpiar sessionStorage
    variablesCss.forEach(variable => {
      sessionStorage.removeItem(`user-${variable}`);
    });
    
    // Limpiar localStorage si el usuario no está logueado
    const isLoggedIn = document.body.classList.contains('user-logged-in') || 
                       document.querySelector('meta[name="user-email"]');
    
    if (!isLoggedIn) {
      variablesCss.forEach(variable => {
        localStorage.removeItem(variable);
      });
    }
    
    // Restablecer al tema actual
    aplicarTemaGuardado();
    
    // Si el usuario está logueado, resetear también en el servidor
    if (isLoggedIn) {
      fetch('/resetear_colores_usuario', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      })
      .then(response => response.json())
      .then(data => {
        if (data.status === 'success') {
          console.log("Colores restablecidos en servidor");
          setTimeout(() => location.reload(), 500); // Recargar para aplicar cambios
        }
      })
      .catch(error => {
        console.error("Error al restablecer colores en servidor:", error);
      });
    } else {
      // Recargar la página para aplicar el tema base
      location.reload();
    }
    
    console.log("Colores personalizados restablecidos");
    return true;
  }
};
