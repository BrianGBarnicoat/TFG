/**
 * Sistema simple de gestión de temas para VytalGym
 * Se encarga de guardar y aplicar temas, así como de sincronizar con Firebase
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log("SimpleTheme: Inicializando...");
  
  // Seleccionar todos los elementos del selector de tema
  const themeCards = document.querySelectorAll('.theme-card');
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'default';
  
  // Marcar la tarjeta del tema actual como seleccionada
  themeCards.forEach(card => {
    const theme = card.getAttribute('data-theme') || card.classList[1].replace('theme-', '');
    
    // Si es el tema actual, marcarlo como activo
    if (theme === currentTheme) {
      card.classList.add('active');
    }
    
    // Añadir evento de clic
    card.addEventListener('click', function() {
      // Obtener el tema de este elemento
      const selectedTheme = this.getAttribute('data-theme') || 
                           this.classList[1].replace('theme-', '');
      
      // Desactivar todas las tarjetas
      themeCards.forEach(c => c.classList.remove('active'));
      
      // Activar la seleccionada
      this.classList.add('active');
      
      // Aplicar el tema al documento
      document.documentElement.setAttribute('data-theme', selectedTheme);
      
      // Guardarlo localmente
      localStorage.setItem('selected-theme', selectedTheme);
      console.log(`SimpleTheme: Tema cambiado a ${selectedTheme} (guardado localmente)`);
      
      // Intentar guardar en el servidor si el usuario está autenticado
      saveThemeToServer(selectedTheme);
      
      // Actualizar la visualización de los colores en el selector
      updateColorPickers();
    });
  });
  
  // Actualizar valores en los selectores de color
  function updateColorPickers() {
    // Selectores de color principales
    const pickers = [
      { id: 'primaryColorPicker', css: '--primary-color' },
      { id: 'secondaryColorPicker', css: '--secondary-color' },
      { id: 'headerBgPicker', css: '--header-bg' },
      { id: 'textColorPicker', css: '--text-color' },
      { id: 'backgroundColorPicker', css: '--background-color' }
    ];
    
    // Para cada selector de color, actualizarlo con el valor actual del CSS
    pickers.forEach(picker => {
      const element = document.getElementById(picker.id);
      if (element) {
        const value = getComputedStyle(document.documentElement).getPropertyValue(picker.css).trim();
        if (value) {
          // Convertir valor rgba o similar a formato hexadecimal para el input color
          // Esta conversión es simplista y funciona para valores hexadecimales
          element.value = value;
          
          // Actualizar también el punto de color si existe
          const dots = document.querySelectorAll(`.color-dot[data-variable="${picker.css}"]`);
          dots.forEach(dot => dot.style.backgroundColor = value);
        }
      }
    });
  }
  
  // Función para guardar el tema en el servidor
  function saveThemeToServer(theme) {
    // Verificar si el usuario está autenticado
    const isLoggedIn = document.body.classList.contains('user-logged-in') || 
                      document.querySelector('meta[name="user-logged-in"]') ||
                      document.cookie.includes('session=');
    
    if (isLoggedIn) {
      console.log(`SimpleTheme: Intentando guardar tema ${theme} en servidor...`);
      
      fetch('/guardar_tema_usuario', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({ tema: theme })
      })
      .then(response => response.json())
      .then(data => {
        if (data.status === 'success') {
          console.log(`SimpleTheme: Tema ${theme} guardado en servidor`);
          
          // Recargar el iframe de vista previa si existe
          const previewIframe = document.getElementById('preview-iframe');
          if (previewIframe) {
            setTimeout(() => {
              previewIframe.src = previewIframe.src;
            }, 500);
          }
        } else {
          console.warn(`SimpleTheme: Error al guardar tema en servidor: ${data.message}`);
        }
      })
      .catch(error => {
        console.error('SimpleTheme: Error de red al guardar tema:', error);
      });
    } else {
      console.log(`SimpleTheme: Usuario no autenticado, tema guardado solo localmente`);
    }
  }
  
  // Configurar los selectores de color
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
  
  // Inicializar los selectores de color
  colorVars.forEach(color => {
    aplicarColorInmediato(color.storage + 'Picker', color.name, color.storage);
  });
  
  // Cargar tema base
  const savedTheme = localStorage.getItem('selected-theme') || 'default';
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  // Actualizar la visualización de los colores en el selector
  updateColorPickers();
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
