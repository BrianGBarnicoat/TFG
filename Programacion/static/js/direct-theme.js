/**
 * SISTEMA ULTRALIGERO DE TEMAS - SOLUCIÓN DEFINITIVA
 * Cambia colores inmediatamente al seleccionarlos
 */

// Inicialización y carga de colores (ejecutado inmediatamente)
(function() {
  console.log("DirectTheme: Inicializando...");
  
  // Cargar tema base
  const savedTheme = localStorage.getItem('selected-theme') || 'default';
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  // Variables de color que gestionamos
  const colorVars = [
    { css: '--primary-color', key: 'primaryColor', default: '#58a058' },
    { css: '--secondary-color', key: 'secondaryColor', default: '#004d40' },
    { css: '--header-bg', key: 'headerBg', default: '#000a14' },
    { css: '--text-color', key: 'textColor', default: '#ffffff' },
    { css: '--background-color', key: 'backgroundColor', default: '#001a33' }
  ];
  
  // Aplicar colores guardados
  colorVars.forEach(color => {
    const saved = localStorage.getItem(color.key);
    if (saved) {
      document.documentElement.style.setProperty(color.css, saved);
    }
  });
})();

// Cuando se cargue la página completa
document.addEventListener('DOMContentLoaded', function() {
  console.log("DirectTheme: DOM cargado, configurando color pickers");
  
  // Variables de color que gestionamos
  const colorVars = [
    { id: 'primaryColorPicker', css: '--primary-color', key: 'primaryColor', default: '#58a058' },
    { id: 'secondaryColorPicker', css: '--secondary-color', key: 'secondaryColor', default: '#004d40' },
    { id: 'headerColorPicker', css: '--header-bg', key: 'headerBg', default: '#000a14' },
    { id: 'textColorPicker', css: '--text-color', key: 'textColor', default: '#ffffff' },
    { id: 'backgroundColorPicker', css: '--background-color', key: 'backgroundColor', default: '#001a33' }
  ];
  
  // Configurar cada selector de color
  colorVars.forEach(config => {
    const picker = document.getElementById(config.id);
    if (!picker) {
      console.warn(`DirectTheme: No se encontró el picker ${config.id}`);
      return;
    }
    
    // Establecer el valor inicial
    const saved = localStorage.getItem(config.key);
    const computed = getComputedStyle(document.documentElement).getPropertyValue(config.css).trim();
    picker.value = saved || computed || config.default;
    
    // Aplicar color al cambiar
    picker.addEventListener('input', function() {
      const color = this.value;
      
      // Aplicar el color
      document.documentElement.style.setProperty(config.css, color);
      
      // Guardar el color
      localStorage.setItem(config.key, color);
      
      // Actualizar visual del dot
      const dots = document.querySelectorAll('.color-dot');
      dots.forEach(dot => {
        if (dot.dataset.variable === config.css) {
          dot.style.backgroundColor = color;
        }
      });
      
      console.log(`DirectTheme: Aplicado ${config.css}=${color}`);
    });
  });
  
  // Botón para restablecer colores
  const resetBtn = document.getElementById('resetColorsBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', function() {
      // Eliminar colores guardados
      colorVars.forEach(config => {
        localStorage.removeItem(config.key);
        document.documentElement.style.removeProperty(config.css);
      });
      
      // Recargar la página para aplicar el tema base
      location.reload();
    });
  }
});
