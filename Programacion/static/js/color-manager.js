/**
 * Gestor de Colores para VytalGym
 * Permite aplicar y gestionar colores personalizados en toda la aplicación
 */

window.ColorManager = (function() {
  
  // Colores por defecto según el tema actual
  const defaultColors = {
    'default': {
      '--primary-color': '#58a058',
      '--secondary-color': '#004d40',
      '--background-color': 'rgba(28, 40, 28, 0.9)',
      '--text-color': '#ffffff',
      '--header-bg': 'rgba(0, 10, 20, 0.95)',
      '--card-color': 'rgba(40, 50, 40, 0.9)',
    },
    'dark': {
      '--primary-color': '#388e3c',
      '--secondary-color': '#00352c',
      '--background-color': 'rgba(20, 20, 20, 0.95)',
      '--text-color': '#e0e0e0',
      '--header-bg': 'rgba(10, 10, 10, 0.98)',
      '--card-color': 'rgba(30, 30, 30, 0.95)',
    },
    'light': {
      '--primary-color': '#4CAF50',
      '--secondary-color': '#2E7D32',
      '--background-color': 'rgba(240, 240, 240, 0.95)',
      '--text-color': '#333333',
      '--header-bg': 'rgba(255, 255, 255, 0.98)',
      '--card-color': 'rgba(255, 255, 255, 0.95)',
    }
  };
  
  // Prefijo para almacenar colores en localStorage
  const STORAGE_PREFIX = 'custom_color_';
  
  /**
   * Aplica un color específico a una variable CSS
   */
  function applyColor(variable, value) {
    if (!variable || !value) return false;
    
    // Aplicar al DOM
    document.documentElement.style.setProperty(variable, value);
    
    // Guardar en localStorage
    localStorage.setItem(STORAGE_PREFIX + variable, value);
    
    // Disparar evento personalizado
    const event = new CustomEvent('colorChanged', {
      detail: { variable, value }
    });
    document.dispatchEvent(event);
    
    return true;
  }
  
  /**
   * Aplica múltiples colores a la vez
   */
  function applyColors(colorObj) {
    if (!colorObj || typeof colorObj !== 'object') return 0;
    
    let count = 0;
    for (const [variable, value] of Object.entries(colorObj)) {
      if (applyColor(variable, value)) {
        count++;
      }
    }
    
    return count;
  }
  
  /**
   * Carga los colores personalizados desde localStorage
   */
  function loadCustomColors() {
    const variables = [
      '--primary-color',
      '--secondary-color',
      '--background-color',
      '--text-color',
      '--header-bg',
      '--card-color'
    ];
    
    let count = 0;
    variables.forEach(variable => {
      const storedValue = localStorage.getItem(STORAGE_PREFIX + variable);
      if (storedValue) {
        document.documentElement.style.setProperty(variable, storedValue);
        count++;
      }
    });
    
    return count;
  }
  
  /**
   * Reinicia todos los colores a los valores predeterminados del tema actual
   */
  function resetAllColors() {
    const theme = document.documentElement.getAttribute('data-theme') || 'default';
    const themeColors = defaultColors[theme] || defaultColors.default;
    
    // Limpiar colores personalizados del localStorage
    for (const variable in themeColors) {
      localStorage.removeItem(STORAGE_PREFIX + variable);
    }
    
    // Aplicar colores predeterminados
    for (const [variable, value] of Object.entries(themeColors)) {
      document.documentElement.style.setProperty(variable, value);
    }
    
    // Disparar evento de reseteo
    document.dispatchEvent(new Event('colorsReset'));
    
    return Object.keys(themeColors).length;
  }
  
  /**
   * Obtiene el valor actual de una variable CSS
   */
  function getColor(variable) {
    return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  }
  
  // Cargar colores personalizados al iniciar
  document.addEventListener('DOMContentLoaded', function() {
    loadCustomColors();
    
    // Escuchar cambios de tema para actualizar colores
    document.addEventListener('themeChanged', function(e) {
      const theme = e.detail.theme;
      console.log('Tema cambiado a:', theme);
      
      // Si hay colores por defecto para este tema, aplicarlos
      if (defaultColors[theme]) {
        for (const [variable, value] of Object.entries(defaultColors[theme])) {
          // Solo aplicar si no hay un color personalizado
          if (!localStorage.getItem(STORAGE_PREFIX + variable)) {
            document.documentElement.style.setProperty(variable, value);
          }
        }
      }
    });
  });
  
  // API pública
  return {
    applyColor,
    applyColors,
    resetAllColors,
    getColor,
    loadCustomColors
  };
})();
