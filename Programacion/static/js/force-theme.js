/**
 * APLICACIÓN FORZADA DE TEMAS PARA VYTAL GYM
 * Este script tiene prioridad absoluta sobre todos los demás sistemas
 * y garantiza que los colores se apliquen correctamente.
 */

// Ejecutar inmediatamente, sin esperar a que se cargue el DOM
(function() {
  console.log("⚡🔒 ForceTheme: Iniciando aplicación forzada de temas");
  
  // 1. Aplicar tema base primero
  const tema = sessionStorage.getItem('user-theme') || 
              localStorage.getItem('selected-theme') || 
              'default';
  document.documentElement.setAttribute('data-theme', tema);
  console.log("⚡🔒 ForceTheme: Tema base aplicado:", tema);
  
  // 2. Variables CSS que vamos a forzar con !important
  const colorVars = [
    { css: '--primary-color', session: 'user-primaryColor', local: 'primaryColor' },
    { css: '--secondary-color', session: 'user-secondaryColor', local: 'secondaryColor' },
    { css: '--header-bg', session: 'user-headerBg', local: 'headerBg' },
    { css: '--text-color', session: 'user-textColor', local: 'textColor' },
    { css: '--background-color', session: 'user-backgroundColor', local: 'backgroundColor' },
    { css: '--card-color', session: 'user-cardColor', local: 'cardColor' }
  ];
  
  // 3. Crear un estilo en línea con !important para máxima prioridad
  let styleText = "";
  
  // Buscar valores en sessionStorage o localStorage
  colorVars.forEach(color => {
    let valor = sessionStorage.getItem(color.session);
    if (!valor) {
      valor = localStorage.getItem(color.local);
    }
    
    if (valor) {
      styleText += `${color.css}: ${valor} !important; `;
      console.log(`⚡🔒 ForceTheme: Forzando ${color.css} = ${valor}`);
    }
  });
  
  // 4. Si hay estilos que aplicar, hacerlo con máxima prioridad
  if (styleText) {
    // Crear estilo en línea directamente en el HTML
    document.documentElement.style.cssText += styleText;
    
    // Crear también una etiqueta style en el head para doble seguridad
    const styleEl = document.createElement('style');
    styleEl.id = 'force-theme-styles';
    styleEl.innerHTML = `:root { ${styleText} }`;
    
    // Insertar al principio del head para máxima prioridad
    const head = document.head || document.getElementsByTagName('head')[0];
    if (head.firstChild) {
      head.insertBefore(styleEl, head.firstChild);
    } else {
      head.appendChild(styleEl);
    }
  }
  
  // 5. Configurar un observador para detectar cambios en estilos
  // y volver a aplicar si algún otro script intenta sobreescribirlos
  const forceStylesAgain = function() {
    if (styleText) {
      document.documentElement.style.cssText += styleText;
    }
  };
  
  // Programar una verificación periódica
  if (styleText) {
    const interval = setInterval(forceStylesAgain, 500);
    
    // Detener después de 5 segundos para evitar consumo innecesario
    setTimeout(() => clearInterval(interval), 5000);
  }
})();

// Cuando el DOM esté cargado, configurar los selectores de color
document.addEventListener('DOMContentLoaded', function() {
  console.log("⚡🔒 ForceTheme: DOM cargado, configurando eventos");
  
  // Selectores de color en la página configuración
  const colorPickers = {
    'primaryColorPicker': { css: '--primary-color', session: 'user-primaryColor', local: 'primaryColor' },
    'secondaryColorPicker': { css: '--secondary-color', session: 'user-secondaryColor', local: 'secondaryColor' },
    'headerBgPicker': { css: '--header-bg', session: 'user-headerBg', local: 'headerBg' },
    'textColorPicker': { css: '--text-color', session: 'user-textColor', local: 'textColor' },
    'backgroundColorPicker': { css: '--background-color', session: 'user-backgroundColor', local: 'backgroundColor' }
  };
  
  // Configurar cada color picker
  Object.entries(colorPickers).forEach(([id, config]) => {
    const picker = document.getElementById(id);
    if (!picker) return;
    
    // Actualizar color al cambiar
    picker.addEventListener('input', function() {
      const newColor = this.value;
      
      // 1. Aplicar directamente al HTML con !important
      document.documentElement.style.setProperty(config.css, newColor, 'important');
      
      // 2. Guardar en localStorage y sessionStorage
      localStorage.setItem(config.local, newColor);
      sessionStorage.setItem(config.session, newColor);
      
      // 3. Actualizar indicadores visuales
      const dots = document.querySelectorAll(`.color-dot[data-variable="${config.css}"]`);
      dots.forEach(dot => dot.style.backgroundColor = newColor);
      
      // 4. Guardar en servidor si el usuario está autenticado
      const isLoggedIn = document.body.classList.contains('user-logged-in') || 
                        document.querySelector('meta[name="user-email"]');
      if (isLoggedIn) {
        fetch('/guardar_color_usuario', {
          method: 'POST',
          headers: {'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest'},
          body: JSON.stringify({ variable: config.css, valor: newColor })
        })
        .then(response => response.json())
        .then(data => {
          console.log(data.status === 'success' 
                      ? `⚡🔒 ForceTheme: Color guardado en servidor: ${config.css}`
                      : `⚡🔒 ForceTheme: Error al guardar color: ${data.message}`);
        })
        .catch(error => console.error('Error al guardar color:', error));
      }
      
      console.log(`⚡🔒 ForceTheme: Color aplicado: ${config.css} = ${newColor}`);
    });
  });
  
  // Configurar botón de resetear colores
  const resetBtn = document.getElementById('resetColorsBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', function() {
      console.log("⚡🔒 ForceTheme: Restableciendo todos los colores");
      
      // Verificar si el usuario está autenticado
      const isLoggedIn = document.body.classList.contains('user-logged-in') || 
                        document.querySelector('meta[name="user-email"]');
      
      // 1. Resetear en el servidor si está logueado
      if (isLoggedIn) {
        fetch('/resetear_colores_usuario', {
          method: 'POST',
          headers: {'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest'}
        })
        .then(response => response.json())
        .then(data => console.log("⚡🔒 ForceTheme: Colores restablecidos en servidor"))
        .catch(error => console.error('Error al restablecer colores:', error));
      }
      
      // 2. Limpiar localStorage y sessionStorage
      Object.values(colorPickers).forEach(config => {
        localStorage.removeItem(config.local);
        sessionStorage.removeItem(config.session);
      });
      
      // 3. Recargar para aplicar tema base
      setTimeout(() => window.location.reload(), 300);
    });
  }
  
  // Configurar tarjetas de tema
  const themeCards = document.querySelectorAll('.theme-card');
  if (themeCards.length > 0) {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'default';
    
    themeCards.forEach(card => {
      // Marcar la tarjeta activa
      const cardTheme = card.getAttribute('data-theme') || 
                      card.classList[1]?.replace('theme-', '');
      
      if (cardTheme === currentTheme) {
        card.classList.add('active');
      }
      
      // Configurar evento de clic
      card.addEventListener('click', function() {
        const selectedTheme = this.getAttribute('data-theme') || 
                             this.classList[1]?.replace('theme-', '');
        
        // Desactivar todas las tarjetas
        themeCards.forEach(c => c.classList.remove('active'));
        
        // Activar la seleccionada
        this.classList.add('active');
        
        // Aplicar el tema
        document.documentElement.setAttribute('data-theme', selectedTheme);
        
        // Guardar tema
        localStorage.setItem('selected-theme', selectedTheme);
        sessionStorage.setItem('user-theme', selectedTheme);
        
        // Guardar en servidor si está logueado
        const isLoggedIn = document.body.classList.contains('user-logged-in') || 
                          document.querySelector('meta[name="user-email"]');
        
        if (isLoggedIn) {
          fetch('/guardar_tema_usuario', {
            method: 'POST',
            headers: {'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest'},
            body: JSON.stringify({ tema: selectedTheme })
          })
          .then(response => response.json())
          .then(data => console.log(`⚡🔒 ForceTheme: Tema ${selectedTheme} guardado en servidor`))
          .catch(error => console.error('Error al guardar tema:', error));
        }
        
        console.log(`⚡🔒 ForceTheme: Tema cambiado a: ${selectedTheme}`);
      });
    });
  }
});
