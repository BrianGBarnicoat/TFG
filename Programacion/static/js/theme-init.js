/**
 * Inicialización del sistema de temas
 * Este script debe cargarse temprano para evitar parpadeos (FOUC)
 */

(function() {
  // Función para aplicar el tema guardado o predeterminado
  function applyInitialTheme() {
    // Intentar obtener tema de sessionStorage primero (datos de sesión actual)
    let theme = sessionStorage.getItem('user-theme');
    
    // Si no existe en sessionStorage, intentar obtener de localStorage (persistencia)
    if (!theme) {
      theme = localStorage.getItem('selected-theme');
    }
    
    // Si no hay tema guardado, usar el predeterminado
    if (!theme) {
      theme = 'default';
    }
    
    // Aplicar el tema al documento
    document.documentElement.setAttribute('data-theme', theme);
    console.log(`Tema inicial aplicado: ${theme}`);
  }
  
  // Aplicar colores personalizados guardados
  function applyInitialColors() {
    // Variables CSS que podemos personalizar
    const colorVars = [
      { css: '--primary-color', key: 'customPrimaryColor' },
      { css: '--secondary-color', key: 'customSecondaryColor' },
      { css: '--header-bg', key: 'customHeaderBg' },
      { css: '--text-color', key: 'customTextColor' },
      { css: '--background-color', key: 'customBackgroundColor' },
      { css: '--card-color', key: 'customCardColor' }
    ];
    
    // Para cada variable, intentar aplicar el valor guardado
    colorVars.forEach(color => {
      // Intentar obtener de sessionStorage primero
      let savedColor = sessionStorage.getItem(`user-${color.key}`);
      
      // Si no está en sessionStorage, buscar en localStorage
      if (!savedColor) {
        savedColor = localStorage.getItem(color.key);
      }
      
      // Si existe un valor guardado, aplicarlo
      if (savedColor) {
        document.documentElement.style.setProperty(color.css, savedColor);
        console.log(`Color inicial aplicado: ${color.css} = ${savedColor}`);
      }
    });
  }
  
  // Sincronizar con Firebase al cargar la página completa
  function syncWithFirebase() {
    // Verificar si estamos en una sesión autenticada
    const isLoggedIn = document.body.classList.contains('user-logged-in') || 
                      document.querySelector('meta[name="user-logged-in"]') ||
                      document.cookie.includes('session=');
    
    if (isLoggedIn) {
      console.log("Usuario autenticado, sincronizando preferencias con Firebase...");
      
      // Llamar al endpoint de sincronización
      fetch('/sincronizar_preferencias', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      })
      .then(response => response.json())
      .then(data => {
        if (data.status === 'success') {
          console.log("Preferencias sincronizadas correctamente:", data.data);
          
          // Si hay cambios, recargar la página para aplicarlos
          const reloadRequired = sessionStorage.getItem('theme-sync-reload');
          if (reloadRequired === 'true') {
            sessionStorage.removeItem('theme-sync-reload');
            location.reload();
          }
        } else {
          console.warn("Error al sincronizar preferencias:", data.message);
        }
      })
      .catch(error => {
        console.error("Error de red al sincronizar preferencias:", error);
      });
    } else {
      console.log("Usuario no autenticado, usando preferencias locales");
    }
  }
  
  // Ejecutar inmediatamente para evitar FOUC (Flash of Unstyled Content)
  applyInitialTheme();
  applyInitialColors();
  
  // Cuando el DOM esté listo, sincronizar con Firebase
  document.addEventListener('DOMContentLoaded', syncWithFirebase);
})();
