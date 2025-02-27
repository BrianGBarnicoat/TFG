/**
 * Color Manager - Solución definitiva para la gestión de colores en VytalGym
 * Este script se ejecuta inmediatamente para aplicar los colores personalizados
 */

// IIFE para aislar el código y ejecutarlo inmediatamente
(function() {
  console.log("🎨 ColorManager: Inicializando...");
  
  // Definimos las variables CSS que podemos personalizar
  const colorVariables = {
    '--primary-color': '#58a058',       // Color principal
    '--secondary-color': '#004d40',     // Color secundario
    '--header-bg': '#000a14',           // Color de cabecera
    '--text-color': '#ffffff',          // Color de texto
    '--background-color': '#001a33',    // Color de fondo
    '--card-bg': 'rgba(40, 50, 40, 0.9)' // Color de tarjetas
  };
  
  // Cargar colores personalizados si existen
  function loadCustomColors() {
    // Para cada variable CSS, intentamos cargar su valor personalizado
    Object.keys(colorVariables).forEach(cssVar => {
      // Convertir --var-name a customVarName para localStorage
      const storageKey = 'custom' + cssVar.substring(2)
        .replace(/-([a-z])/g, (_, char) => char.toUpperCase());
      
      // Intentar obtener el color personalizado
      const savedColor = localStorage.getItem(storageKey);
      
      // Si existe un color personalizado, aplicarlo
      if (savedColor) {
        document.documentElement.style.setProperty(cssVar, savedColor);
        console.log(`🎨 ColorManager: Aplicado ${cssVar} = ${savedColor}`);
      }
    });
  }
  
  // Ejecutamos la carga inmediatamente
  loadCustomColors();
  
  // Función para aplicar un color
  function applyColor(cssVar, colorValue) {
    // Validar que la variable de color es válida
    if (!Object.keys(colorVariables).includes(cssVar)) {
      console.error(`🎨 ColorManager: Variable de CSS inválida: ${cssVar}`);
      return false;
    }
    
    try {
      // Aplicar el color a la raíz del documento
      document.documentElement.style.setProperty(cssVar, colorValue);
      
      // Convertir --var-name a customVarName para almacenamiento
      const storageKey = 'custom' + cssVar.substring(2)
        .replace(/-([a-z])/g, (_, char) => char.toUpperCase());
      
      // Guardar en localStorage para persistencia
      localStorage.setItem(storageKey, colorValue);
      console.log(`🎨 ColorManager: Guardado ${cssVar} = ${colorValue}`);
      return true;
    } catch (error) {
      console.error(`🎨 ColorManager: Error al aplicar ${cssVar}`, error);
      return false;
    }
  }
  
  // Función para aplicar múltiples colores a la vez
  function applyColors(colorObject) {
    console.log("🎨 ColorManager: Aplicando múltiples colores...", colorObject);
    let applied = 0;
    
    // Para cada par de variable/color en el objeto
    Object.entries(colorObject).forEach(([cssVar, colorValue]) => {
      if (applyColor(cssVar, colorValue)) {
        applied++;
      }
    });
    
    return applied;
  }
  
  // Función para restablecer todos los colores personalizados
  function resetAllColors() {
    console.log("🎨 ColorManager: Restableciendo colores...");
    
    // Para cada variable CSS, eliminamos su valor personalizado
    Object.keys(colorVariables).forEach(cssVar => {
      // Convertir --var-name a customVarName para localStorage
      const storageKey = 'custom' + cssVar.substring(2)
        .replace(/-([a-z])/g, (_, char) => char.toUpperCase());
      
      // Eliminar del localStorage
      localStorage.removeItem(storageKey);
      
      // Eliminar del estilo inline
      document.documentElement.style.removeProperty(cssVar);
    });
    
    // Aplicar el tema base seleccionado
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'default';
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    console.log("🎨 ColorManager: Colores restablecidos");
    return true;
  }
  
  // Función para cargar un tema predefinido
  function loadTheme(themeName) {
    console.log(`🎨 ColorManager: Cambiando a tema ${themeName}`);
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('selected-theme', themeName);
  }
  
  // Exponemos las funciones al objeto global window para que sean accesibles
  window.ColorManager = {
    applyColor,
    applyColors,
    resetAllColors,
    loadTheme
  };
  
  console.log("🎨 ColorManager: Inicialización completa. Funciones disponibles globalmente.");
})();
