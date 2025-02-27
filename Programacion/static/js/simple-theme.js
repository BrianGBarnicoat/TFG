/**
 * SISTEMA SIMPLE DE TEMAS PARA VYTALGYM
 * Aplica cambios inmediatamente y los guarda en localStorage
 */

// Cargar colores guardados al iniciar la página
document.addEventListener('DOMContentLoaded', function() {
  console.log("SimpleTheme: Aplicando colores guardados...");
  
  // Cargar tema base
  const savedTheme = localStorage.getItem('selected-theme') || 'default';
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  // Lista de variables de color que podemos personalizar
  const colorVars = [
    { name: '--primary-color', storage: 'primaryColor' },
    { name: '--secondary-color', storage: 'secondaryColor' },
    { name: '--header-bg', storage: 'headerBg' },
    { name: '--text-color', storage: 'textColor' },
    { name: '--background-color', storage: 'backgroundColor' }
  ];
  
  // Aplicar cada color si existe en localStorage
  colorVars.forEach(color => {
    const savedValue = localStorage.getItem(color.storage);
    if (savedValue) {
      document.documentElement.style.setProperty(color.name, savedValue);
    }
  });
});

// Función global para aplicar colores inmediatamente
function aplicarColorInmediato(colorPickerId, variableCss, storageKey) {
  const picker = document.getElementById(colorPickerId);
  if (!picker) return false;
  
  // Aplicar color inmediatamente al cambiar
  picker.addEventListener('input', function() {
    // 1. Aplicar al CSS
    document.documentElement.style.setProperty(variableCss, this.value);
    
    // 2. Guardar en localStorage
    localStorage.setItem(storageKey, this.value);
    
    // 3. Actualizar visualmente cualquier indicador de color
    const dots = document.querySelectorAll('.color-dot');
    dots.forEach(dot => {
      if (dot.dataset.variable === variableCss) {
        dot.style.backgroundColor = this.value;
      }
    });
    
    console.log(`SimpleTheme: Color ${variableCss} = ${this.value}`);
  });
  
  // Inicializar el color picker con valor guardado
  const savedValue = localStorage.getItem(storageKey);
  if (savedValue) {
    picker.value = savedValue;
    // También actualizar los dots visuales
    const dots = document.querySelectorAll('.color-dot');
    dots.forEach(dot => {
      if (dot.dataset.variable === variableCss) {
        dot.style.backgroundColor = savedValue;
      }
    });
  } else {
    // Si no hay valor guardado, usar el valor actual del CSS
    const style = getComputedStyle(document.documentElement);
    picker.value = style.getPropertyValue(variableCss).trim();
  }
  
  return true;
}

// Función para restablecer los colores
function restablecerColores() {
  // Lista de variables de color
  const colorVars = [
    { name: '--primary-color', storage: 'primaryColor' },
    { name: '--secondary-color', storage: 'secondaryColor' },
    { name: '--header-bg', storage: 'headerBg' },
    { name: '--text-color', storage: 'textColor' },
    { name: '--background-color', storage: 'backgroundColor' }
  ];
  
  // Eliminar cada color del localStorage y restablecer el CSS
  colorVars.forEach(color => {
    localStorage.removeItem(color.storage);
    document.documentElement.style.removeProperty(color.name);
  });
  
  // Recargar la página para aplicar el tema base
  window.location.reload();
}
