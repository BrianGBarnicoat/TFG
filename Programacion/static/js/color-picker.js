/**
 * SELECTOR DE COLOR ULTRA-SIMPLE
 * Aplicación inmediata de colores en toda la web
 * Sin dependencias, sin complicaciones
 */

// Aplicar colores guardados al cargar la página
document.addEventListener('DOMContentLoaded', function() {
  // 1. Cargar colores guardados
  const colorVars = [
    { css: '--primary-color', key: 'primaryColor', default: '#58a058' }, 
    { css: '--secondary-color', key: 'secondaryColor', default: '#004d40' },
    { css: '--header-bg', key: 'headerBg', default: '#000a14' },
    { css: '--text-color', key: 'textColor', default: '#ffffff' },
    { css: '--background-color', key: 'backgroundColor', default: '#001a33' }
  ];

  // 2. Aplicar colores guardados primero
  colorVars.forEach(color => {
    const saved = localStorage.getItem(color.key);
    if (saved) {
      document.documentElement.style.setProperty(color.css, saved);
      console.log(`Color cargado: ${color.css} = ${saved}`);
    }
  });

  // 3. Configurar los selectores de color
  const colorPickers = {
    'primaryColorPicker': { css: '--primary-color', key: 'primaryColor' },
    'secondaryColorPicker': { css: '--secondary-color', key: 'secondaryColor' },
    'headerColorPicker': { css: '--header-bg', key: 'headerBg' },
    'textColorPicker': { css: '--text-color', key: 'textColor' },
    'backgroundColorPicker': { css: '--background-color', key: 'backgroundColor' }
  };

  // 4. Para cada selector de color en la página
  Object.keys(colorPickers).forEach(pickerId => {
    const picker = document.getElementById(pickerId);
    if (!picker) return; // Si no existe este elemento, continuamos

    const config = colorPickers[pickerId];
    
    // 5. Inicializar con el valor guardado o computado
    const saved = localStorage.getItem(config.key);
    const computed = getComputedStyle(document.documentElement).getPropertyValue(config.css);
    picker.value = saved || computed.trim() || '#ffffff';
    
    // 6. Actualizar los dots visuales si existen
    const dots = document.querySelectorAll(`.color-dot[data-variable="${config.css}"]`);
    dots.forEach(dot => dot.style.backgroundColor = picker.value);
    
    // 7. Agregar evento para cambio de color
    picker.addEventListener('input', function() {
      // Aplicar color inmediatamente
      document.documentElement.style.setProperty(config.css, this.value);
      
      // Guardar en localStorage
      localStorage.setItem(config.key, this.value);
      
      // Actualizar dots visuales
      dots.forEach(dot => dot.style.backgroundColor = this.value);
      
      console.log(`Color cambiado: ${config.css} = ${this.value}`);
    });
  });

  // 8. Configurar botón de restablecer si existe
  const resetBtn = document.getElementById('resetColorsBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', function() {
      // Borrar los colores guardados
      Object.values(colorPickers).forEach(config => {
        localStorage.removeItem(config.key);
      });
      
      // Recargar la página para aplicar tema base
      location.reload();
    });
  }
});
