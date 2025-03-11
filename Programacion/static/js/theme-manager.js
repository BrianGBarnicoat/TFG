/**
 * Gestor de temas para VytalGym
 * Versión mejorada para aplicación correcta en todas las páginas
 */

// Aplicar tema y colores personalizados al cargar (ejecución inmediata)
(function() {
  console.log("Theme Manager: Inicializando...");
  // Aplicar tema base
  const savedTheme = localStorage.getItem('selected-theme') || 'default';
  document.documentElement.setAttribute('data-theme', savedTheme);
  console.log(`Theme Manager: Tema base aplicado: ${savedTheme}`);
  
  // Aplicar colores personalizados guardados
  const colorVars = {
    'customPrimaryColor': '--primary-color',
    'customSecondaryColor': '--secondary-color', 
    'customHeaderColor': '--header-bg',
    'customTextColor': '--text-color',
    'customBackgroundColor': '--background-color',
    'customCardColor': '--card-bg'
  };
  
  // Aplicar todos los colores guardados
  Object.entries(colorVars).forEach(([storageKey, cssVar]) => {
    const savedColor = localStorage.getItem(storageKey);
    if (savedColor) {
      document.documentElement.style.setProperty(cssVar, savedColor);
      console.log(`Theme Manager: Color aplicado ${cssVar}=${savedColor}`);
    }
  });
})();

/**
 * Aplica un color personalizado y lo guarda para todas las páginas
 * @param {string} cssVar - Variable CSS (ej: --primary-color)
 * @param {string} color - Valor hexadecimal del color
 * @return {boolean} - Si se aplicó correctamente
 */
function aplicarColor(cssVar, color) {
  if (!cssVar || !color) return false;
  
  try {
    // 1. Aplicar al documento actual
    document.documentElement.style.setProperty(cssVar, color);
    
    // 2. Guardar en localStorage para otras páginas
    const storageKey = 'custom' + cssVar.replace('--', '')
                        .replace(/-([a-z])/g, (m, p1) => p1.toUpperCase());
    localStorage.setItem(storageKey, color);
    
    console.log(`Theme Manager: Color ${cssVar} = ${color} aplicado y guardado como ${storageKey}`);
    return true;
  } catch (error) {
    console.error("Error al aplicar color:", error);
    return false;
  }
}

/**
 * Aplica todos los colores personalizados de una vez
 * @param {Object} colores - Objeto con pares de variable/color
 * @return {number} - Cantidad de colores aplicados
 */
function aplicarColores(colores) {
  let aplicados = 0;
  
  for (const [cssVar, color] of Object.entries(colores)) {
    if (aplicarColor(cssVar, color)) {
      aplicados++;
    }
  }
  
  // Notificar cambio global
  document.dispatchEvent(new CustomEvent('themeColorsChanged', { 
    detail: { colorsApplied: aplicados } 
  }));
  
  return aplicados;
}

/**
 * Restablece todos los colores personalizados
 */
function restablecerColores() {
  // Colección de claves de localStorage a eliminar
  const customColorKeys = [
    'customPrimaryColor', 'customSecondaryColor', 'customHeaderColor', 
    'customTextColor', 'customBackgroundColor', 'customCardColor'
  ];
  
  // 1. Eliminar del localStorage
  customColorKeys.forEach(key => localStorage.removeItem(key));
  
  // 2. Eliminar estilos inline del documento
  const cssVars = customColorKeys.map(key => 
    '--' + key.replace('custom', '').replace(/([A-Z])/g, '-$1').toLowerCase()
  );
  
  cssVars.forEach(cssVar => {
    document.documentElement.style.removeProperty(cssVar);
  });
  
  // 3. Re-aplicar tema base
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'default';
  document.documentElement.setAttribute('data-theme', currentTheme);
  
  console.log(`Theme Manager: Colores personalizados eliminados`);
  return true;
}

/**
 * Cambia el tema base
 * @param {string} tema - Nombre del tema
 * @param {boolean} guardar - Si guardar en localStorage
 */
function cambiarTema(tema, guardar = true) {
  const temasPermitidos = ['default', 'dark', 'light', 'blue', 'purple'];
  if (!temasPermitidos.includes(tema)) {
    console.error(`Theme Manager: Tema inválido "${tema}"`);
    return false;
  }
  
  // Aplicar tema
  document.documentElement.setAttribute('data-theme', tema);
  
  // Guardar configuración
  if (guardar) {
    localStorage.setItem('selected-theme', tema);
  }
  
  console.log(`Theme Manager: Tema cambiado a "${tema}"`);
  return true;
}

// Exportar funciones para uso global
window.ThemeManager = {
  aplicarColor,
  aplicarColores,
  restablecerColores,
  cambiarTema
};
