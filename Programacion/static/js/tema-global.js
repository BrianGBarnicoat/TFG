/**
 * Sistema global de temas para VytalGym
 * Este script se encarga de cargar las preferencias de tema del usuario desde la sesión
 * y aplicarlas a la página actual. También proporciona funciones para cambiar el tema
 * y guardar las preferencias en Firebase.
 */

// Ejecutar cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
  console.log("Cargando sistema de temas global...");

  // Obtener tema y colores guardados
  let currentTheme = 'default';
  try {
    // Comprobar si el usuario está autenticado
    const userEmail = document.querySelector('meta[name="user-email"]');
    
    if (userEmail) {
      // Usuario autenticado
      console.log("Estado de autenticación: Usuario autenticado (" + userEmail.content + ")");
      
      // Cargar tema desde la sesión (si existe)
      const theme = sessionStorage.getItem('user-theme');
      console.log("Cargando tema para usuario autenticado desde Firebase");
      
      if (theme) {
        currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        console.log("Tema de usuario cargado:", theme);
      } else {
        console.log("No hay tema definido para el usuario, usando 'default'");
        document.documentElement.setAttribute('data-theme', 'default');
      }
      
      // Cargar colores personalizados desde la sesión
      applyCustomColorsFromSession();
    } else {
      // Usuario no autenticado
      console.log("Estado de autenticación: Usuario no autenticado");
      
      // Cargar tema y colores desde localStorage
      const savedTheme = localStorage.getItem('selected-theme');
      if (savedTheme) {
        currentTheme = savedTheme;
        document.documentElement.setAttribute('data-theme', savedTheme);
        console.log("Tema local cargado:", savedTheme);
      } else {
        console.log("No hay tema guardado localmente, usando 'default'");
        document.documentElement.setAttribute('data-theme', 'default');
      }
      
      // Aplicar colores guardados en localStorage
      applyCustomColorsFromLocalStorage();
    }
  } catch (error) {
    console.error("Error al cargar tema:", error);
    // Fallback al tema por defecto
    document.documentElement.setAttribute('data-theme', 'default');
  }
  
  // Si hay un selector de tema en la página
  const themeSelect = document.getElementById('themeSelect');
  if (themeSelect) {
    themeSelect.value = currentTheme;
    themeSelect.addEventListener('change', function() {
      changeTheme(this.value);
    });
  }
  
  // Si hay botones de tema en la página
  const themeButtons = document.querySelectorAll('[data-theme-button]');
  themeButtons.forEach(button => {
    if (button.dataset.theme === currentTheme) {
      button.classList.add('active');
    }
    
    button.addEventListener('click', function() {
      changeTheme(this.dataset.theme);
      
      // Quitar clase active de todos los botones
      themeButtons.forEach(btn => btn.classList.remove('active'));
      
      // Añadir clase active al botón clickeado
      this.classList.add('active');
    });
  });
  
  // Configurar selectores de colores personalizados
  setupColorPickers();
});

/**
 * Aplica los colores personalizados guardados en sessionStorage
 */
function applyCustomColorsFromSession() {
  const cssVars = [
    { name: '--primary-color', key: 'primaryColor' },
    { name: '--secondary-color', key: 'secondaryColor' },
    { name: '--header-bg', key: 'headerBg' },
    { name: '--text-color', key: 'textColor' },
    { name: '--background-color', key: 'backgroundColor' }
  ];
  
  let hasCustomColors = false;
  
  cssVars.forEach(item => {
    const savedValue = sessionStorage.getItem('user-' + item.name.replace('--', ''));
    if (savedValue) {
      document.documentElement.style.setProperty(item.name, savedValue);
      hasCustomColors = true;
      console.log(`Color personalizado cargado: ${item.name} = ${savedValue}`);
    }
  });
  
  if (hasCustomColors) {
    console.log("Colores personalizados aplicados desde la sesión");
  }
}

/**
 * Aplica los colores personalizados guardados en localStorage
 */
function applyCustomColorsFromLocalStorage() {
  const cssVars = [
    { name: '--primary-color', key: 'primaryColor' },
    { name: '--secondary-color', key: 'secondaryColor' },
    { name: '--header-bg', key: 'headerBg' },
    { name: '--text-color', key: 'textColor' },
    { name: '--background-color', key: 'backgroundColor' }
  ];
  
  let hasCustomColors = false;
  
  cssVars.forEach(item => {
    const savedValue = localStorage.getItem('custom-' + item.key);
    if (savedValue) {
      document.documentElement.style.setProperty(item.name, savedValue);
      hasCustomColors = true;
      console.log(`Color personalizado cargado de localStorage: ${item.name} = ${savedValue}`);
    }
  });
  
  if (hasCustomColors) {
    console.log("Colores personalizados aplicados desde localStorage");
  }
}

/**
 * Cambia el tema global y lo guarda
 * @param {string} theme - Nombre del tema a aplicar
 */
function changeTheme(theme) {
  // Aplicar tema
  document.documentElement.setAttribute('data-theme', theme);
  
  // Guardar tema
  const userEmail = document.querySelector('meta[name="user-email"]');
  
  if (userEmail) {
    // Usuario autenticado, guardar en Firebase
    sessionStorage.setItem('user-theme', theme);
    guardarTema(theme);
  } else {
    // Usuario no autenticado, guardar en localStorage
    localStorage.setItem('selected-theme', theme);
  }
  
  console.log(`Tema cambiado a: ${theme}`);
}

/**
 * Guarda el tema del usuario en Firebase
 * @param {string} theme - Nombre del tema a guardar
 */
function guardarTema(theme) {
  fetch('/guardar_tema_usuario', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ tema: theme })
  })
  .then(response => response.json())
  .then(data => {
    if (data.status === 'success') {
      console.log(`Tema ${theme} guardado en Firebase`);
      if (typeof showNotification === 'function') {
        showNotification(`Tema ${theme} aplicado`, 'success');
      }
    } else {
      console.error('Error al guardar tema:', data.message);
      if (typeof showNotification === 'function') {
        showNotification('Error al guardar tema', 'error');
      }
    }
  })
  .catch(error => {
    console.error('Error en la petición:', error);
    if (typeof showNotification === 'function') {
      showNotification('Error de conexión', 'error');
    }
  });
}

/**
 * Aplica un color personalizado y lo guarda
 * @param {string} cssVar - Variable CSS (--primary-color)
 * @param {string} value - Valor del color (#RRGGBB)
 */
function aplicarColor(cssVar, value) {
  // Aplicar color
  if (value === null) {
    document.documentElement.style.removeProperty(cssVar);
  } else {
    document.documentElement.style.setProperty(cssVar, value);
  }
  
  // Guardar color
  const userEmail = document.querySelector('meta[name="user-email"]');
  
  if (userEmail) {
    // Usuario autenticado, guardar en Firebase
    if (value === null) {
      sessionStorage.removeItem('user-' + cssVar.replace('--', ''));
    } else {
      sessionStorage.setItem('user-' + cssVar.replace('--', ''), value);
    }
    
    guardarColorFirebase(cssVar, value);
  } else {
    // Usuario no autenticado, guardar en localStorage
    const storageKey = 'custom-' + cssVar.replace('--', '').replace('-', '');
    
    if (value === null) {
      localStorage.removeItem(storageKey);
    } else {
      localStorage.setItem(storageKey, value);
    }
  }
  
  return true;
}

/**
 * Guarda un color personalizado en Firebase
 * @param {string} cssVar - Variable CSS (--primary-color)
 * @param {string} value - Valor del color (#RRGGBB)
 */
function guardarColorFirebase(cssVar, value) {
  fetch('/guardar_color_usuario', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ variable: cssVar, valor: value })
  })
  .then(response => response.json())
  .then(data => {
    if (data.status === 'success') {
      console.log(`Color ${cssVar} = ${value} guardado en Firebase`);
      if (typeof showNotification === 'function') {
        showNotification('Color guardado', 'success');
      }
    } else {
      console.error('Error al guardar color:', data.message);
      if (typeof showNotification === 'function') {
        showNotification('Error al guardar color', 'error');
      }
    }
  })
  .catch(error => {
    console.error('Error en la petición:', error);
    if (typeof showNotification === 'function') {
      showNotification('Error de conexión', 'error');
    }
  });
}

/**
 * Restablece todos los colores personalizados
 */
function restablecerColores() {
  // Eliminar todas las propiedades de estilo inline
  document.documentElement.removeAttribute('style');
  
  const userEmail = document.querySelector('meta[name="user-email"]');
  
  if (userEmail) {
    // Usuario autenticado, borrar en Firebase y sessionStorage
    const cssVars = ['--primary-color', '--secondary-color', '--header-bg', '--text-color', '--background-color'];
    
    cssVars.forEach(cssVar => {
      // Limpiar de sessionStorage
      sessionStorage.removeItem('user-' + cssVar.replace('--', ''));
      
      // Enviar null a Firebase para eliminar
      guardarColorFirebase(cssVar, null);
    });
  } else {
    // Usuario no autenticado, borrar de localStorage
    const prefixes = ['primaryColor', 'secondaryColor', 'headerBg', 'textColor', 'backgroundColor'];
    
    prefixes.forEach(prefix => {
      localStorage.removeItem('custom-' + prefix);
    });
  }
  
  if (typeof showNotification === 'function') {
    showNotification('Colores restablecidos', 'info');
  }
  
  return true;
}

/**
 * Configura los selectores de color en la página
 */
function setupColorPickers() {
  // Detectar si estamos en la página de configuración
  const configContainer = document.querySelector('.config-container');
  if (configContainer) {
    console.log("Detectada página de configuración, configurando controles");
    
    // Hacer clic en una tarjeta de tema modifica el tema
    const themeCards = document.querySelectorAll('.theme-card');
    if (themeCards.length > 0) {
      themeCards.forEach(card => {
        card.addEventListener('click', function() {
          const theme = this.getAttribute('data-theme');
          if (theme) {
            // Quitar selección de todas las tarjetas
            themeCards.forEach(c => c.classList.remove('active'));
            // Marcar esta como activa
            this.classList.add('active');
            // Aplicar tema
            document.documentElement.setAttribute('data-theme', theme);
          }
        });
      });
    }
    
    // Configurar pickers de color individuales
    const pickers = [
      { id: 'primaryColorPicker', variable: '--primary-color' },
      { id: 'secondaryColorPicker', variable: '--secondary-color' },
      { id: 'headerBgPicker', variable: '--header-bg' },
      { id: 'textColorPicker', variable: '--text-color' },
      { id: 'backgroundColorPicker', variable: '--background-color' }
    ];
    
    pickers.forEach(picker => {
      const element = document.getElementById(picker.id);
      if (element) {
        console.log("Picker configurado:", picker.id);
        
        // Valor inicial desde la variable CSS actual
        const computedStyle = getComputedStyle(document.documentElement);
        const currentValue = computedStyle.getPropertyValue(picker.variable).trim();
        if (currentValue) {
          element.value = rgbToHex(currentValue);
        }
        
        // Escuchar cambios
        element.addEventListener('input', function() {
          document.documentElement.style.setProperty(picker.variable, this.value);
          
          // Actualizar también los dots de colores
          const dots = document.querySelectorAll(`.color-dot[data-variable="${picker.variable}"]`);
          dots.forEach(dot => {
            dot.style.backgroundColor = this.value;
          });
        });
      }
    });
    
    // Botón para aplicar colores
    const applyColorsBtn = document.getElementById('applyColors');
    if (applyColorsBtn) {
      applyColorsBtn.addEventListener('click', function() {
        pickers.forEach(picker => {
          const element = document.getElementById(picker.id);
          if (element) {
            aplicarColor(picker.variable, element.value);
          }
        });
        
        if (typeof showNotification === 'function') {
          showNotification('Colores aplicados correctamente', 'success');
        }
      });
    }
    
    // Botón para resetear colores
    const resetColorsBtn = document.getElementById('resetColors');
    if (resetColorsBtn) {
      resetColorsBtn.addEventListener('click', function() {
        if (restablecerColores()) {
          // Resetear también los inputs de color
          setTimeout(() => {
            pickers.forEach(picker => {
              const element = document.getElementById(picker.id);
              if (element) {
                const computedStyle = getComputedStyle(document.documentElement);
                const currentValue = computedStyle.getPropertyValue(picker.variable).trim();
                if (currentValue) {
                  element.value = rgbToHex(currentValue);
                }
              }
            });
          }, 100);
        }
      });
    }
  }
}

/**
 * Convierte un valor RGB a formato hexadecimal
 * @param {string} rgb - String en formato "rgb(r, g, b)" o hexadecimal
 * @returns {string} - Color en formato hexadecimal #RRGGBB
 */
function rgbToHex(rgb) {
  // Si ya es hexadecimal o un nombre de color, devolverlo
  if (rgb.startsWith('#')) {
    return rgb;
  }
  
  // Intentar extraer los valores RGB
  const rgbRegex = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/;
  const match = rgbRegex.exec(rgb);
  
  if (match) {
    const r = parseInt(match[1], 10);
    const g = parseInt(match[2], 10);
    const b = parseInt(match[3], 10);
    
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
  
  // Si no se pudo convertir, devolver un color por defecto
  return '#000000';
}

// Exponer funciones globalmente
window.changeTheme = changeTheme;
window.aplicarColor = aplicarColor;
window.restablecerColores = restablecerColores;
window.guardarTema = guardarTema;

// Agregar una clase 'js-loaded' al body para indicar que el script se ha cargado correctamente
document.body.classList.add('js-loaded');

// Definir objeto para el administrador de colores
window.ColorManager = {
  applyColors: function(colorsObject) {
    let count = 0;
    for (const [cssVar, value] of Object.entries(colorsObject)) {
      if (aplicarColor(cssVar, value)) {
        count++;
      }
    }
    return count;
  },
  
  resetAllColors: restablecerColores
};
