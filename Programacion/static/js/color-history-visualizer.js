/**
 * Visualizador de historial de colores para VytalGym
 * Muestra y permite interactuar con los cambios recientes de colores
 */

const ColorHistoryVisualizer = (function() {
  // Referencia al gestor de colores
  let colorManager = null;
  
  // Elemento contenedor
  let container = null;
  
  /**
   * Inicializa el visualizador
   */
  function initialize(targetElement) {
    // Obtener referencia al gestor de colores
    colorManager = window.AdvancedColorManager || window.ColorManager;
    
    if (!colorManager) {
      console.error('ColorHistoryVisualizer: No se encontró el gestor de colores');
      return false;
    }
    
    // Guardar referencia al contenedor si se proporciona
    if (targetElement) {
      container = targetElement;
    }
    
    // Escuchar cambios de color
    document.addEventListener('colorChanged', function(e) {
      // Actualizar la visualización si existe el contenedor
      if (container) {
        renderHistory(container);
      }
    });
    
    return true;
  }
  
  /**
   * Crea el contenedor del historial si no existe
   */
  function createHistoryContainer() {
    const historyContainer = document.createElement('div');
    historyContainer.className = 'color-history';
    
    // Título con botón de limpieza
    const titleRow = document.createElement('div');
    titleRow.className = 'color-history-title';
    
    const title = document.createElement('h3');
    title.textContent = 'Historial de colores';
    
    const clearBtn = document.createElement('button');
    clearBtn.className = 'btn-small btn-secondary';
    clearBtn.textContent = 'Limpiar';
    clearBtn.onclick = function() {
      // Implementar limpieza del historial
      if (colorManager && typeof colorManager.clearHistory === 'function') {
        colorManager.clearHistory();
        renderHistory(historyContainer);
      }
    };
    
    titleRow.appendChild(title);
    titleRow.appendChild(clearBtn);
    
    // Lista de elementos del historial
    const historyItems = document.createElement('div');
    historyItems.className = 'color-history-items';
    
    historyContainer.appendChild(titleRow);
    historyContainer.appendChild(historyItems);
    
    return historyContainer;
  }
  
  /**
   * Renderiza el historial de colores en un contenedor
   */
  function renderHistory(targetElement) {
    // Si no se proporciona un elemento destino, usar el contenedor guardado
    const container = targetElement || this.container;
    
    if (!container) return false;
    
    // Asegurarse que el contenedor tiene la estructura correcta
    let historyItemsContainer;
    
    if (!container.classList.contains('color-history')) {
      // Limpiar y crear estructura
      container.innerHTML = '';
      const historyContainer = createHistoryContainer();
      container.appendChild(historyContainer);
      historyItemsContainer = historyContainer.querySelector('.color-history-items');
    } else {
      historyItemsContainer = container.querySelector('.color-history-items');
      historyItemsContainer.innerHTML = '';
    }
    
    // Obtener historial del gestor de colores
    if (!colorManager || typeof colorManager.getHistory !== 'function') {
      historyItemsContainer.innerHTML = '<p style="opacity:0.7;text-align:center;width:100%;">Historial no disponible</p>';
      return false;
    }
    
    const history = colorManager.getHistory();
    
    // Si no hay historial
    if (!history || history.length === 0) {
      historyItemsContainer.innerHTML = '<p style="opacity:0.7;text-align:center;width:100%;">No hay cambios recientes</p>';
      return true;
    }
    
    // Mapeo de nombres legibles
    const varNames = {
      '--primary-color': 'Principal',
      '--secondary-color': 'Secundario',
      '--background-color': 'Fondo',
      '--text-color': 'Texto',
      '--header-bg': 'Cabecera',
      '--card-color': 'Tarjeta'
    };
    
    // Crear elementos para cada entrada del historial
    history.forEach((entry, index) => {
      // Ignorar entradas de reset
      if (entry.variable === 'reset') return;
      
      const itemElement = document.createElement('div');
      itemElement.className = 'color-history-item';
      itemElement.title = `Cambiar a ${entry.value}`;
      
      // Muestra de color
      const colorSwatch = document.createElement('div');
      colorSwatch.className = 'color-history-swatch';
      colorSwatch.style.backgroundColor = entry.value;
      
      // Etiqueta
      const label = document.createElement('div');
      label.className = 'color-history-label';
      label.textContent = varNames[entry.variable] || entry.variable;
      
      // Añadir al DOM
      itemElement.appendChild(colorSwatch);
      itemElement.appendChild(label);
      
      // Evento clic para aplicar este color
      itemElement.addEventListener('click', function() {
        if (colorManager && typeof colorManager.applyColor === 'function') {
          colorManager.applyColor(entry.variable, entry.value);
          
          // Actualizar el selector de color correspondiente si existe
          const picker = document.querySelector(`input[type="color"][id$="Picker"][class*="color-input"]`);
          if (picker && picker.parentElement.querySelector(`.color-dot[data-variable="${entry.variable}"]`)) {
            picker.value = entry.value;
          }
        }
      });
      
      historyItemsContainer.appendChild(itemElement);
    });
    
    return true;
  }
  
  /**
   * Crea y añade el visualizador al DOM
   */
  function create(targetSelector) {
    // Encontrar o crear el contenedor
    let targetElement;
    
    if (typeof targetSelector === 'string') {
      targetElement = document.querySelector(targetSelector);
    } else if (targetSelector instanceof HTMLElement) {
      targetElement = targetSelector;
    } else {
      // Crear un nuevo elemento
      targetElement = document.createElement('div');
      targetElement.className = 'color-history-container';
      document.body.appendChild(targetElement);
    }
    
    // Guardar referencia
    container = targetElement;
    
    // Inicializar
    initialize();
    
    // Renderizar
    renderHistory(targetElement);
    
    return targetElement;
  }
  
  // API pública
  return {
    initialize,
    renderHistory,
    create
  };
})();

// Disponibilizarlo globalmente
window.ColorHistoryVisualizer = ColorHistoryVisualizer;
