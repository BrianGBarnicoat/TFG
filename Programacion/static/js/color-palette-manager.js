/**
 * Gestor de paletas de colores para VytalGym
 * Permite guardar, cargar y gestionar diferentes combinaciones de colores
 */

const ColorPaletteManager = (function() {
  // Prefijo para localStorage
  const STORAGE_PREFIX = 'vytalgym_palette_';
  
  // Variables internas
  let palettes = [];
  let isInitialized = false;
  
  /**
   * Inicializa el gestor de paletas
   */
  function initialize() {
    if (isInitialized) return true;
    
    // Cargar paletas guardadas
    loadSavedPalettes();
    
    // Escuchar eventos de cambios de tema
    document.addEventListener('themeChanged', function(e) {
      // Actualizar interfaz si es necesario
      if (document.querySelector('.palette-list')) {
        renderPaletteList();
      }
    });
    
    isInitialized = true;
    return true;
  }
  
  /**
   * Carga las paletas guardadas de localStorage
   */
  function loadSavedPalettes() {
    try {
      // Buscar todas las paletas en localStorage
      palettes = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) {
          const paletteName = key.replace(STORAGE_PREFIX, '');
          const paletteData = JSON.parse(localStorage.getItem(key));
          palettes.push({
            name: paletteName,
            colors: paletteData,
            timestamp: paletteData.timestamp || Date.now()
          });
        }
      }
      
      // Ordenar por fecha (más reciente primero)
      palettes.sort((a, b) => b.timestamp - a.timestamp);
      
      return palettes;
    } catch (e) {
      console.error('Error al cargar paletas:', e);
      return [];
    }
  }
  
  /**
   * Guarda una nueva paleta
   */
  function savePalette(name, colors) {
    if (!name || !colors) return false;
    
    // Añadir timestamp
    colors.timestamp = Date.now();
    
    // Guardar en localStorage
    try {
      localStorage.setItem(STORAGE_PREFIX + name, JSON.stringify(colors));
      
      // Añadir a la lista interna
      palettes.unshift({
        name: name,
        colors: colors,
        timestamp: colors.timestamp
      });
      
      return true;
    } catch (e) {
      console.error('Error al guardar paleta:', e);
      return false;
    }
  }
  
  /**
   * Elimina una paleta guardada
   */
  function deletePalette(name) {
    try {
      localStorage.removeItem(STORAGE_PREFIX + name);
      
      // Actualizar lista interna
      palettes = palettes.filter(p => p.name !== name);
      
      return true;
    } catch (e) {
      console.error('Error al eliminar paleta:', e);
      return false;
    }
  }
  
  /**
   * Aplica una paleta guardada
   */
  function applyPalette(name) {
    const palette = palettes.find(p => p.name === name);
    
    if (!palette) return false;
    
    // Usar el ColorManager para aplicar los colores
    if (window.AdvancedColorManager) {
      const { colors } = palette;
      
      // Filtrar solo las variables de color
      const colorVariables = {};
      for (const [key, value] of Object.entries(colors)) {
        if (key.startsWith('--') && !key.includes('timestamp')) {
          colorVariables[key] = value;
        }
      }
      
      // Aplicar los colores
      window.AdvancedColorManager.applyColors(colorVariables);
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Captura los colores actuales en una nueva paleta
   */
  function captureCurrentColors() {
    // Colores a capturar
    const colorVariables = [
      '--primary-color',
      '--secondary-color',
      '--background-color',
      '--text-color',
      '--header-bg',
      '--card-color'
    ];
    
    const currentColors = {};
    
    colorVariables.forEach(variable => {
      currentColors[variable] = getComputedStyle(document.documentElement)
        .getPropertyValue(variable).trim();
    });
    
    return currentColors;
  }
  
  /**
   * Crea elementos DOM para la lista de paletas
   */
  function renderPaletteList(targetElement = null) {
    const container = targetElement || document.querySelector('.palette-list');
    if (!container) return false;
    
    // Limpiar contenedor
    container.innerHTML = '';
    
    // Si no hay paletas, mostrar mensaje
    if (palettes.length === 0) {
      const emptyMessage = document.createElement('p');
      emptyMessage.textContent = 'No hay paletas guardadas';
      emptyMessage.style.opacity = '0.7';
      emptyMessage.style.textAlign = 'center';
      emptyMessage.style.width = '100%';
      container.appendChild(emptyMessage);
      return true;
    }
    
    // Crear elemento para cada paleta
    palettes.forEach(palette => {
      const paletteItem = document.createElement('div');
      paletteItem.className = 'palette-item';
      paletteItem.setAttribute('data-name', palette.name);
      
      // Título de la paleta
      const title = document.createElement('div');
      title.className = 'palette-item-title';
      title.textContent = palette.name;
      
      // Vista previa de colores
      const colorsPreview = document.createElement('div');
      colorsPreview.className = 'palette-item-colors';
      
      // Añadir muestras de color
      const colorVars = ['--primary-color', '--secondary-color', '--background-color', 
                         '--text-color', '--header-bg'];
      
      colorVars.forEach(colorVar => {
        if (palette.colors[colorVar]) {
          const colorDot = document.createElement('div');
          colorDot.className = 'palette-color';
          colorDot.style.backgroundColor = palette.colors[colorVar];
          colorsPreview.appendChild(colorDot);
        }
      });
      
      // Crear botones
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'palette-actions';
      actionsDiv.style.marginTop = '8px';
      
      const applyBtn = document.createElement('button');
      applyBtn.className = 'btn-small btn-primary';
      applyBtn.textContent = 'Aplicar';
      applyBtn.onclick = function(e) {
        e.stopPropagation();
        applyPalette(palette.name);
      };
      
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn-small btn-secondary';
      deleteBtn.textContent = 'Eliminar';
      deleteBtn.onclick = function(e) {
        e.stopPropagation();
        if (confirm(`¿Eliminar la paleta "${palette.name}"?`)) {
          deletePalette(palette.name);
          renderPaletteList();
        }
      };
      
      // Añadir todo al DOM
      actionsDiv.appendChild(applyBtn);
      actionsDiv.appendChild(deleteBtn);
      
      paletteItem.appendChild(title);
      paletteItem.appendChild(colorsPreview);
      paletteItem.appendChild(actionsDiv);
      
      // Evento clic para aplicar la paleta
      paletteItem.addEventListener('click', function() {
        applyPalette(palette.name);
      });
      
      container.appendChild(paletteItem);
    });
    
    return true;
  }
  
  /**
   * Muestra un diálogo para guardar la paleta actual
   */
  function showSavePaletteDialog() {
    // Crear el modal si no existe
    let modal = document.getElementById('savePaletteModal');
    
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'savePaletteModal';
      modal.className = 'color-modal';
      
      const modalContent = document.createElement('div');
      modalContent.className = 'color-modal-content';
      
      modalContent.innerHTML = `
        <h3 class="color-modal-title">Guardar Paleta</h3>
        <div class="color-modal-body">
          <div class="form-group">
            <label for="paletteName">Nombre de la paleta:</label>
            <input type="text" id="paletteName" class="form-control" placeholder="Mi paleta">
          </div>
          <div class="palette-preview" style="margin-top: 15px;">
            <p style="margin-bottom: 5px;">Vista previa:</p>
            <div class="palette-item-colors" id="palettePreview"></div>
          </div>
        </div>
        <div class="color-modal-footer">
          <button class="btn btn-secondary" id="cancelSavePalette">Cancelar</button>
          <button class="btn btn-primary" id="confirmSavePalette">Guardar</button>
        </div>
      `;
      
      modal.appendChild(modalContent);
      document.body.appendChild(modal);
      
      // Capturar eventos
      document.getElementById('cancelSavePalette').addEventListener('click', function() {
        modal.style.display = 'none';
      });
      
      document.getElementById('confirmSavePalette').addEventListener('click', function() {
        const name = document.getElementById('paletteName').value.trim();
        
        if (!name) {
          alert('Por favor ingresa un nombre para la paleta');
          return;
        }
        
        // Guardar la paleta
        const currentColors = captureCurrentColors();
        const saved = savePalette(name, currentColors);
        
        if (saved) {
          // Actualizar la interfaz
          renderPaletteList();
          modal.style.display = 'none';
          
          // Notificar
          if (window.AdvancedColorManager) {
            window.AdvancedColorManager.showNotification(
              `Paleta "${name}" guardada con éxito`, 'success'
            );
          }
        } else {
          alert('Error al guardar la paleta');
        }
      });
      
      // Cerrar al hacer clic fuera
      modal.addEventListener('click', function(e) {
        if (e.target === modal) {
          modal.style.display = 'none';
        }
      });
    }
    
    // Actualizar vista previa
    const palettePreview = document.getElementById('palettePreview');
    palettePreview.innerHTML = '';
    
    const currentColors = captureCurrentColors();
    const colorVars = ['--primary-color', '--secondary-color', '--background-color', 
                       '--text-color', '--header-bg'];
    
    colorVars.forEach(colorVar => {
      if (currentColors[colorVar]) {
        const colorDot = document.createElement('div');
        colorDot.className = 'palette-color';
        colorDot.style.backgroundColor = currentColors[colorVar];
        palettePreview.appendChild(colorDot);
      }
    });
    
    // Limpiar input
    document.getElementById('paletteName').value = '';
    
    // Mostrar el modal
    modal.style.display = 'flex';
    document.getElementById('paletteName').focus();
  }
  
  // Inicializar automáticamente
  document.addEventListener('DOMContentLoaded', initialize);
  
  // API pública
  return {
    initialize,
    loadSavedPalettes,
    savePalette,
    deletePalette,
    applyPalette,
    captureCurrentColors,
    renderPaletteList,
    showSavePaletteDialog
  };
})();

// Disponibilizarlo globalmente
window.ColorPaletteManager = ColorPaletteManager;
