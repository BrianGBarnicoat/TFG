/**
 * Utilidad optimizada para aplicar temas en tiempo real - VytalGym
 */
(function() {
  // Cargar tema del localStorage
  function loadSavedTheme() {
    const savedTheme = localStorage.getItem('selected-theme') || 'default';
    document.documentElement.setAttribute('data-theme', savedTheme);
    return savedTheme;
  }
  
  // Cargar colores personalizados
  function loadCustomColors() {
    const customColorPrefix = 'vytalgym_color_';
    const colorVars = [
      '--primary-color',
      '--secondary-color',
      '--background-color',
      '--text-color',
      '--header-bg',
      '--card-color'
    ];
    
    colorVars.forEach(variable => {
      const savedValue = localStorage.getItem(customColorPrefix + variable);
      if (savedValue) {
        document.documentElement.style.setProperty(variable, savedValue);
      }
    });
  }
  
  // Aplicar colores al cargar
  document.addEventListener('DOMContentLoaded', function() {
    const currentTheme = loadSavedTheme();
    loadCustomColors();
    
    // Notificar a la consola para debugging
    console.log(`Tema cargado: ${currentTheme}`);
    
    // Escuchar eventos del sistema de colores
    document.addEventListener('colorChanged', function(e) {
      console.log(`Color cambiado: ${e.detail.variable} = ${e.detail.value}`);
    });
    
    document.addEventListener('colorsReset', function() {
      console.log('Colores restablecidos al tema por defecto');
    });
  });
  
  // Escuchar cambios en localStorage (para sincronizar entre pestañas)
  window.addEventListener('storage', function(e) {
    if (e.key === 'selected-theme') {
      document.documentElement.setAttribute('data-theme', e.newValue || 'default');
    } else if (e.key && e.key.startsWith('vytalgym_color_')) {
      const varName = e.key.replace('vytalgym_color_', '');
      document.documentElement.style.setProperty(varName, e.newValue);
    }
  });
})();
