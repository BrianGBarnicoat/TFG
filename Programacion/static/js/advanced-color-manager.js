/**
 * Sistema Avanzado de Gestión de Colores para VytalGym - Versión Optimizada
 */

const AdvancedColorManager = (function() {
  // Configuración básica
  const STORAGE_PREFIX = 'vytalgym_color_';
  const MAX_HISTORY_ITEMS = 5; // Reducido a 5 para mejor rendimiento
  
  // Colores predeterminados solo para temas principales
  const DEFAULT_COLORS = {
    'default': {
      '--primary-color': '#58a058',
      '--secondary-color': '#004d40',
      '--background-color': 'rgba(28, 40, 28, 0.9)',
      '--text-color': '#ffffff',
      '--header-bg': 'rgba(0, 10, 20, 0.95)',
      '--card-color': 'rgba(40, 50, 40, 0.9)',
    },
    'dark': {
      '--primary-color': '#388e3c',
      '--secondary-color': '#00352c',
      '--background-color': 'rgba(20, 20, 20, 0.95)',
      '--text-color': '#e0e0e0',
      '--header-bg': 'rgba(10, 10, 10, 0.98)',
      '--card-color': 'rgba(30, 30, 30, 0.95)',
    },
    'light': {
      '--primary-color': '#4CAF50',
      '--secondary-color': '#2E7D32',
      '--background-color': 'rgba(240, 240, 240, 0.95)',
      '--text-color': '#333333',
      '--header-bg': 'rgba(255, 255, 255, 0.98)',
      '--card-color': 'rgba(255, 255, 255, 0.95)',
    }
  };
  
  // Estado
  let currentTheme = 'default';
  let colorHistory = [];
  let isInitialized = false;
  
  /**
   * Inicializa el gestor de colores (más simple)
   */
  function initialize() {
    if (isInitialized) return true;
    
    // Cargar tema y colores
    currentTheme = document.documentElement.getAttribute('data-theme') || 
                   localStorage.getItem('selected-theme') || 
                   'default';
    
    // Solo intentar cargar historial si existe
    const savedHistory = localStorage.getItem(STORAGE_PREFIX + 'history');
    if (savedHistory) {
      try {
        colorHistory = JSON.parse(savedHistory);
      } catch (e) {
        colorHistory = [];
      }
    }
    
    // Aplicar colores guardados
    loadCustomColors();
    
    // Escuchar cambios
    document.addEventListener('themeChanged', e => currentTheme = e.detail.theme);
    
    isInitialized = true;
    return true;
  }
  
  /**
   * Carga colores guardados
   */
  function loadCustomColors() {
    const defaultThemeColors = DEFAULT_COLORS[currentTheme] || DEFAULT_COLORS.default;
    let count = 0;
    
    // Solo recorrer las variables principales
    Object.keys(defaultThemeColors).forEach(variable => {
      const storedValue = localStorage.getItem(STORAGE_PREFIX + variable);
      if (storedValue) {
        document.documentElement.style.setProperty(variable, storedValue);
        count++;
      }
    });
    
    return count;
  }
  
  /**
   * Aplica un color a una variable CSS
   */
  function applyColor(variable, value, notify = true) {
    if (!variable || !value) return false;
    if (!isInitialized) initialize();
    
    const previousValue = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
    
    // Aplicar y guardar
    document.documentElement.style.setProperty(variable, value);
    localStorage.setItem(STORAGE_PREFIX + variable, value);
    
    // Historial y notificación
    addToHistory(variable, value, previousValue);
    if (notify) {
      const varNames = {
        '--primary-color': 'Color principal',
        '--secondary-color': 'Color secundario', 
        '--background-color': 'Color de fondo',
        '--text-color': 'Color de texto',
        '--header-bg': 'Color de cabecera'
      };
      showNotification(`${varNames[variable] || variable} actualizado`, 'success');
    }
    
    // Evento
    document.dispatchEvent(new CustomEvent('colorChanged', {
      detail: { variable, value, previousValue }
    }));
    
    return true;
  }
  
  /**
   * Aplica varios colores a la vez
   */
  function applyColors(colorObj, notify = true) {
    if (!colorObj || typeof colorObj !== 'object') return 0;
    if (!isInitialized) initialize();
    
    let appliedCount = 0;
    
    for (const [variable, value] of Object.entries(colorObj)) {
      if (applyColor(variable, value, false)) {
        appliedCount++;
      }
    }
    
    if (notify && appliedCount > 0) {
      showNotification(`Se aplicaron ${appliedCount} colores`, 'success');
    }
    
    return appliedCount;
  }
  
  /**
   * Resetea los colores al tema actual
   */
  function resetAllColors(notify = true) {
    if (!isInitialized) initialize();
    
    const themeColors = DEFAULT_COLORS[currentTheme] || DEFAULT_COLORS.default;
    
    // Limpiar localStorage y aplicar predeterminados
    for (const variable in themeColors) {
      localStorage.removeItem(STORAGE_PREFIX + variable);
      document.documentElement.style.setProperty(variable, themeColors[variable]);
    }
    
    addToHistory('reset', themeColors);
    
    if (notify) {
      showNotification('Colores restablecidos', 'info');
    }
    
    document.dispatchEvent(new CustomEvent('colorsReset'));
    
    return Object.keys(themeColors).length;
  }
  
  /**
   * Añade un cambio al historial (simplificado)
   */
  function addToHistory(variable, value, previousValue = null) {
    // Solo guardar historial si es necesario
    colorHistory.unshift({
      variable,
      value,
      previousValue,
      timestamp: new Date().toISOString(),
      theme: currentTheme
    });
    
    // Mantener tamaño limitado
    if (colorHistory.length > MAX_HISTORY_ITEMS) {
      colorHistory = colorHistory.slice(0, MAX_HISTORY_ITEMS);
    }
    
    // Guardar en localStorage (con manejo de error silencioso)
    try {
      localStorage.setItem(STORAGE_PREFIX + 'history', JSON.stringify(colorHistory));
    } catch (e) {
      // Ignorar errores de almacenamiento lleno
    }
  }
  
  /**
   * Deshace el último cambio
   */
  function undoLastChange(notify = true) {
    if (colorHistory.length === 0) return false;
    
    const lastChange = colorHistory[0];
    
    if (lastChange.variable === 'reset') {
      if (notify) {
        showNotification('No se puede deshacer un reset completo', 'warning');
      }
      return false;
    }
    
    if (lastChange.previousValue) {
      // Aplicar color anterior sin notificar
      applyColor(lastChange.variable, lastChange.previousValue, false);
      
      // Eliminar del historial
      colorHistory.shift();
      try {
        localStorage.setItem(STORAGE_PREFIX + 'history', JSON.stringify(colorHistory));
      } catch (e) {}
      
      if (notify) {
        showNotification('Cambio revertido', 'info');
      }
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Obtiene el color actual
   */
  function getColor(variable) {
    return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  }
  
  /**
   * Muestra una notificación
   */
  function showNotification(message, type = 'info') {
    if (typeof window.showNotification === 'function') {
      window.showNotification(message, type);
      return;
    }
    
    // Crear notificación propia solo si es necesario
    const notification = document.getElementById('notification') || createNotificationElement();
    const notificationText = notification.querySelector('#notificationText') || notification.querySelector('span');
    
    notification.className = 'notification ' + type;
    if (notificationText) notificationText.textContent = message;
    
    notification.classList.add('show');
    setTimeout(() => notification.classList.remove('show'), 3000);
  }
  
  /**
   * Crea elemento de notificación (simplificado)
   */
  function createNotificationElement() {
    const notification = document.createElement('div');
    notification.id = 'notification';
    notification.className = 'notification';
    notification.style.cssText = 'position:fixed;top:100px;right:30px;padding:15px;border-radius:8px;background:var(--card-color,#333);color:var(--text-color,#fff);box-shadow:0 4px 20px rgba(0,0,0,0.25);transform:translateX(150%);transition:transform 0.4s;z-index:9999;max-width:400px;width:90%;';
    
    const content = document.createElement('div');
    content.style.cssText = 'display:flex;align-items:center;gap:12px;';
    
    const text = document.createElement('span');
    text.id = 'notificationText';
    
    content.appendChild(text);
    notification.appendChild(content);
    document.body.appendChild(notification);
    
    // Estilos mínimos necesarios
      if (notify) {
        showNotification('Cambio anterior revertido', 'info');
      }
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Obtiene el color actual de una variable CSS
   */
  function getColor(variable) {
    return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  }
  
  /**
   * Verifica si existe una variable personalizada
   */
  function hasCustomColor(variable) {
    return localStorage.getItem(STORAGE_PREFIX + variable) !== null;
  }
  
  /**
   * Obtiene todos los colores personalizados actualmente aplicados
   */
  function getAllCustomColors() {
    const result = {};
    for (const key in localStorage) {
      if (key.startsWith(STORAGE_PREFIX) && key !== STORAGE_PREFIX + 'history') {
        const varName = key.replace(STORAGE_PREFIX, '');
        result[varName] = localStorage.getItem(key);
      }
    }
    return result;
  }
  
  /**
   * Notifica sobre un cambio de color
   */
  function notifyColorChange(variable, value) {
    // Nombre legible para la variable
    const varNames = {
      '--primary-color': 'Color principal',
      '--secondary-color': 'Color secundario', 
      '--background-color': 'Color de fondo',
      '--text-color': 'Color de texto',
      '--header-bg': 'Color de cabecera',
      '--card-color': 'Color de tarjetas'
    };
    
    const readableName = varNames[variable] || variable;
    showNotification(`${readableName} actualizado`, 'success');
  }
  
  /**
   * Muestra una notificación en la interfaz
   */
  function showNotification(message, type = 'info') {
    // Buscar en el DOM la función de notificación
    if (typeof window.showNotification === 'function') {
      window.showNotification(message, type);
    } else {
      // Crear nuestra propia notificación si no existe
      const notification = document.getElementById('notification') || createNotificationElement();
      const notificationText = notification.querySelector('#notificationText') || notification.querySelector('span');
      
      // Limpiar clases y aplicar la nueva
      notification.className = 'notification';
      notification.classList.add(type);
      
      // Establecer mensaje
      if (notificationText) notificationText.textContent = message;
      
      // Mostrar
      notification.classList.add('show');
      
      // Ocultar después de un tiempo
      setTimeout(() => {
        notification.classList.remove('show');
      }, 3000);
    }
  }
  
  /**
   * Crea un elemento de notificación si no existe
   */
  function createNotificationElement() {
    const notification = document.createElement('div');
    notification.id = 'notification';
    notification.className = 'notification';
    notification.style.cssText = `
      position: fixed;
      top: 100px;
      right: 30px;
      padding: 15px 20px;
      border-radius: 8px;
      background: var(--card-color, #333);
      color: var(--text-color, #fff);
      box-shadow: 0 4px 20px rgba(0,0,0,0.25);
      transform: translateX(150%);
      transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      z-index: 9999;
      max-width: 400px;
      width: 90%;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = 'display: flex; align-items: center; gap: 12px;';
    
    const icon = document.createElement('i');
    icon.className = 'notification-icon';
    
    const text = document.createElement('span');
    text.id = 'notificationText';
    
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = `
      background: transparent;
      border: none;
      color: currentColor;
      font-size: 1.2rem;
      cursor: pointer;
      margin-left: 10px;
    `;
    closeBtn.onclick = () => notification.classList.remove('show');
    
    content.appendChild(icon);
    content.appendChild(text);
    notification.appendChild(content);
    notification.appendChild(closeBtn);
    
    document.body.appendChild(notification);
    
    // Añadir estilos para los tipos de notificación
    const style = document.createElement('style');
    style.textContent = `
      .notification.show { transform: translateX(0); }
      .notification.success { border-left: 4px solid var(--success-color, #4caf50); }
      .notification.error { border-left: 4px solid var(--error-color, #f44336); }
      .notification.warning { border-left: 4px solid var(--warning-color, #ff9800); }
      .notification.info { border-left: 4px solid var(--info-color, #2196f3); }
    `;
    document.head.appendChild(style);
    
    return notification;
  }
  
  /**
   * Sincroniza los colores con Firebase (opcional)
   */
  function syncWithFirebase(user) {
    // Si Firebase está disponible, podemos sincronizar los colores
    if (typeof firebase !== 'undefined' && firebase.database && user) {
      const userEmail = user.email.replace('.', '_');
      const userRef = firebase.database().ref(`usuarios/${userEmail}/preferencias/colores`);
      
      // Obtener todos los colores personalizados
      const customColors = getAllCustomColors();
      
      // Subir a Firebase
      userRef.set(customColors)
        .then(() => {
          console.log('Colores sincronizados con Firebase');
          showNotification('Colores sincronizados con tu cuenta', 'success');
        })
        .catch(error => {
          console.error('Error al sincronizar colores:', error);
        });
      
      return true;
    }
    return false;
  }
  
  /**
   * Exporta colores actuales como un string JSON
   */
  function exportColors() {
    const customColors = getAllCustomColors();
    return JSON.stringify(customColors, null, 2);
  }
  
  /**
   * Importa colores desde un string JSON
   */
  function importColors(jsonString, apply = true) {
    try {
      const colors = JSON.parse(jsonString);
      if (typeof colors !== 'object') {
        throw new Error('Formato inválido');
      }
      
      if (apply) {
        applyColors(colors);
      }
      
      return colors;
    } catch (e) {
      console.error('Error al importar colores:', e);
      showNotification('Error al importar colores', 'error');
      return null;
    }
  }
  
  // Inicializar automáticamente
  document.addEventListener('DOMContentLoaded', initialize);
  
  // API pública
  return {
    initialize,
    applyColor,
    applyColors,
    resetAllColors,
    getColor,
    hasCustomColor,
    getAllCustomColors,
    getHistory,
    undoLastChange,
    syncWithFirebase,
    exportColors,
    importColors,
    showNotification
  };
})();

// Hacer que el gestor esté disponible globalmente
window.AdvancedColorManager = AdvancedColorManager;

// Para compatibilidad con el gestor anterior
window.ColorManager = AdvancedColorManager;
