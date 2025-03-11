/**
 * DEPURADOR DE TEMAS
 * Herramienta para diagnosticar problemas con la aplicación de temas
 */

// Ejecutar solo cuando se solicite depuración de temas (añadir ?debug-theme=1 a la URL)
(function() {
  // Verificar si la depuración está habilitada
  const urlParams = new URLSearchParams(window.location.search);
  const debugEnabled = urlParams.has('debug-theme');
  
  if (!debugEnabled) return;
  
  console.log("🔍 ThemeDebugger: Iniciando depuración de temas");
  
  // Crear panel flotante
  function createDebugPanel() {
    const panel = document.createElement('div');
    panel.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 300px;
      max-height: 400px;
      background: rgba(0,0,0,0.8);
      color: #fff;
      border-radius: 8px;
      padding: 15px;
      font-family: monospace;
      font-size: 12px;
      z-index: 9999;
      overflow-y: auto;
      box-shadow: 0 0 10px rgba(0,0,0,0.5);
    `;
    
    panel.innerHTML = `
      <h3 style="margin-top:0;color:#58a058;">🔍 Depuración de Temas</h3>
      <div id="theme-debug-content"></div>
      <div style="margin-top:10px;display:flex;justify-content:space-between;">
        <button id="debug-refresh" style="background:#444;border:0;color:#fff;padding:5px 10px;border-radius:4px;cursor:pointer;">Actualizar</button>
        <button id="debug-close" style="background:#a05858;border:0;color:#fff;padding:5px 10px;border-radius:4px;cursor:pointer;">Cerrar</button>
      </div>
    `;
    
    document.body.appendChild(panel);
    
    // Eventos
    document.getElementById('debug-refresh').addEventListener('click', updateDebugInfo);
    document.getElementById('debug-close').addEventListener('click', () => panel.remove());
    
    return panel;
  }
  
  // Actualizar información de depuración
  function updateDebugInfo() {
    const content = document.getElementById('theme-debug-content');
    const computedStyle = getComputedStyle(document.documentElement);
    
    // Tema actual
    const theme = document.documentElement.getAttribute('data-theme') || 'default';
    
    // Variables de color
    const colorVars = [
      '--primary-color',
      '--secondary-color',
      '--header-bg',
      '--text-color',
      '--background-color',
      '--card-color'
    ];
    
    // Construir HTML
    let html = `<p><strong>Tema actual:</strong> ${theme}</p>`;
    html += '<p><strong>Variables CSS:</strong></p>';
    
    colorVars.forEach(varName => {
      const value = computedStyle.getPropertyValue(varName).trim();
      html += `<div style="margin:5px 0;display:flex;align-items:center;">
        <span style="display:inline-block;width:15px;height:15px;background:${value};margin-right:5px;border:1px solid #fff;"></span>
        <code>${varName}: ${value}</code>
      </div>`;
    });
    
    // Verificar almacenamiento
    html += '<p><strong>localStorage:</strong></p>';
    
    if (localStorage.getItem('selected-theme')) {
      html += `<div>selected-theme: ${localStorage.getItem('selected-theme')}</div>`;
    }
    
    colorVars.forEach(varName => {
      const key = varName.replace('--', '').replace(/-([a-z])/g, (_, char) => char.toUpperCase());
      
      if (localStorage.getItem(key)) {
        html += `<div>${key}: ${localStorage.getItem(key)}</div>`;
      }
    });
    
    // Verificar sessionStorage
    html += '<p><strong>sessionStorage:</strong></p>';
    
    if (sessionStorage.getItem('user-theme')) {
      html += `<div>user-theme: ${sessionStorage.getItem('user-theme')}</div>`;
    }
    
    colorVars.forEach(varName => {
      const key = varName.replace('--', '').replace(/-([a-z])/g, (_, char) => char.toUpperCase());
      const sessionKey = `user-${key}`;
      
      if (sessionStorage.getItem(sessionKey)) {
        html += `<div>${sessionKey}: ${sessionStorage.getItem(sessionKey)}</div>`;
      }
    });
    
    // Verificar usuario
    const isLoggedIn = document.body.classList.contains('user-logged-in') || 
                       document.querySelector('meta[name="user-logged-in"]');
    html += `<p><strong>Usuario logueado:</strong> ${isLoggedIn ? 'Sí' : 'No'}</p>`;
    
    content.innerHTML = html;
  }
  
  // Iniciar depuración cuando el DOM esté listo
  document.addEventListener('DOMContentLoaded', () => {
    createDebugPanel();
    updateDebugInfo();
    console.log("🔍 ThemeDebugger: Panel de depuración creado");
    
    // Monitorear cambios
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === 'data-theme' || 
            mutation.attributeName === 'style') {
          console.log("🔍 ThemeDebugger: Detectado cambio en tema");
          updateDebugInfo();
          break;
        }
      }
    });
    
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['data-theme', 'style'] 
    });
  });
})();
