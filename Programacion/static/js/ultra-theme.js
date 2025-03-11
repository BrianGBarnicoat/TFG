/**
 * SISTEMA ULTRA LIGERO DE TEMAS - VERSIÓN FINAL
 * Este script se ejecuta inmediatamente y aplica los colores sin esperar
 */

// Ejecutar inmediatamente sin esperar al DOM
(function() {
  console.log("🔄 UltraTheme: Aplicando colores inmediatamente...");
  
  // 1. Aplicar tema base desde sessionStorage o localStorage
  const theme = sessionStorage.getItem('user-theme') || 
                localStorage.getItem('selected-theme') || 
                'default';
  document.documentElement.setAttribute('data-theme', theme);
  
  // 2. Variables de color que rastreamos
  const colorVariables = [
    { css: '--primary-color', key: 'primaryColor', session: 'user-primaryColor' },
    { css: '--secondary-color', key: 'secondaryColor', session: 'user-secondaryColor' },
    { css: '--header-bg', key: 'headerBg', session: 'user-headerBg' },
    { css: '--text-color', key: 'textColor', session: 'user-textColor' },
    { css: '--background-color', key: 'backgroundColor', session: 'user-backgroundColor' },
    { css: '--card-color', key: 'cardColor', session: 'user-cardColor' }
  ];
  
  // 3. Aplicar colores: prioridad sessionStorage > localStorage
  colorVariables.forEach(variable => {
    // Buscar valor en sessionStorage primero (para usuarios logueados)
    let value = sessionStorage.getItem(variable.session);
    
    // Si no existe, buscar en localStorage (para usuarios anónimos)
    if (!value) {
      value = localStorage.getItem(variable.key);
    }
    
    // Si se encontró un valor, aplicarlo con !important
    if (value) {
      document.documentElement.style.setProperty(variable.css, value, 'important');
      console.log(`🔄 UltraTheme: Aplicado ${variable.css}=${value}`);
    }
  });
})();

// Cuando el DOM esté listo, configurar los selectores de color
document.addEventListener('DOMContentLoaded', function() {
  console.log("🔄 UltraTheme: DOM cargado, configurando selectores de color");
  
  // 1. Variables de color que rastreamos
  const colorPickers = [
    { id: 'primaryColorPicker', css: '--primary-color', key: 'primaryColor', session: 'user-primaryColor' },
    { id: 'secondaryColorPicker', css: '--secondary-color', key: 'secondaryColor', session: 'user-secondaryColor' },
    { id: 'headerBgPicker', css: '--header-bg', key: 'headerBg', session: 'user-headerBg' },
    { id: 'textColorPicker', css: '--text-color', key: 'textColor', session: 'user-textColor' },
    { id: 'backgroundColorPicker', css: '--background-color', key: 'backgroundColor', session: 'user-backgroundColor' }
  ];
  
  // 2. Configurar cada selector de color en la página
  colorPickers.forEach(picker => {
    const element = document.getElementById(picker.id);
    if (!element) return; // Si no existe este elemento, continuamos
    
    // Obtener el valor actual del CSS
    const style = getComputedStyle(document.documentElement);
    const currentValue = style.getPropertyValue(picker.css).trim();
    
    // Establecer el valor inicial en el selector
    if (currentValue) {
      element.value = currentValue;
    }
    
    // Actualizar color al cambiar el selector
    element.addEventListener('input', function() {
      // Aplicar el nuevo color inmediatamente con !important
      document.documentElement.style.setProperty(picker.css, this.value, 'important');
      
      // Guardar en localStorage
      localStorage.setItem(picker.key, this.value);
      
      // Guardar en sessionStorage para usuarios logueados
      sessionStorage.setItem(picker.session, this.value);
      
      // Actualizar los indicadores visuales (dots)
      updateColorDots(picker.css, this.value);
      
      // Guardar en el servidor si el usuario está autenticado
      saveColorToServer(picker.css, this.value);
      
      console.log(`🔄 UltraTheme: Color cambiado ${picker.css}=${this.value}`);
    });
  });
  
  // 3. Configurar botón para restablecer colores
  const resetBtn = document.getElementById('resetColorsBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', function() {
      console.log("🔄 UltraTheme: Restableciendo todos los colores");
      resetAllColors();
    });
  }
});

// Función para actualizar los dots visuales de color
function updateColorDots(cssVar, colorValue) {
  const dots = document.querySelectorAll(`.color-dot[data-variable="${cssVar}"]`);
  dots.forEach(dot => {
    dot.style.backgroundColor = colorValue;
  });
}

// Función para guardar color en el servidor
function saveColorToServer(cssVar, colorValue) {
  // Verificar si el usuario está logueado
  const isLoggedIn = document.body.classList.contains('user-logged-in') || 
                    document.querySelector('meta[name="user-email"]');
  
  if (!isLoggedIn) return;
  
  fetch('/guardar_color_usuario', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    },
    body: JSON.stringify({
      variable: cssVar,
      valor: colorValue
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.status === 'success') {
      console.log(`🔄 UltraTheme: Color ${cssVar} guardado en servidor`);
    } else {
      console.warn(`🔄 UltraTheme: Error al guardar color: ${data.message}`);
    }
  })
  .catch(error => {
    console.error('Error al guardar color:', error);
  });
}

// Función para restablecer todos los colores
function resetAllColors() {
  // Verificar si el usuario está logueado
  const isLoggedIn = document.body.classList.contains('user-logged-in') || 
                    document.querySelector('meta[name="user-email"]');
  
  // Variables de color que rastreamos
  const colorVariables = [
    { css: '--primary-color', key: 'primaryColor', session: 'user-primaryColor' },
    { css: '--secondary-color', key: 'secondaryColor', session: 'user-secondaryColor' },
    { css: '--header-bg', key: 'headerBg', session: 'user-headerBg' },
    { css: '--text-color', key: 'textColor', session: 'user-textColor' },
    { css: '--background-color', key: 'backgroundColor', session: 'user-backgroundColor' },
    { css: '--card-color', key: 'cardColor', session: 'user-cardColor' }
  ];
  
  if (isLoggedIn) {
    // Resetear en el servidor
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
        console.log("🔄 UltraTheme: Colores restablecidos en servidor");
      }
    })
    .catch(error => {
      console.error('Error al restablecer colores:', error);
    });
  }
  
  // Limpiar localStorage
  colorVariables.forEach(variable => {
    localStorage.removeItem(variable.key);
  });
  
  // Limpiar sessionStorage
  colorVariables.forEach(variable => {
    sessionStorage.removeItem(variable.session);
  });
  
  // Actualizar página para aplicar el tema base
  setTimeout(() => window.location.reload(), 300);
}
