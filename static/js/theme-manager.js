/**
 * ThemeManager - Gestor de temas para VytalGym
 * Maneja la selección de temas, colores personalizados y sincronización
 */
class ThemeManager {
    constructor() {
        // Mapeo de nombres de variables CSS a sus claves de almacenamiento y selectores
        this.colorConfig = {
            '--primary-color': { key: 'customPrimaryColor', selector: '#primaryColorPicker' },
            '--secondary-color': { key: 'customSecondaryColor', selector: '#secondaryColorPicker' },
            '--background-color': { key: 'customBackgroundColor', selector: '#backgroundColorPicker' },
            '--text-color': { key: 'customTextColor', selector: '#textColorPicker' },
            '--header-bg': { key: 'customHeaderColor', selector: '#headerColorPicker' },
            '--card-bg': { key: 'customCardColor', selector: '#cardColorPicker' }
        };

        // Valores por defecto de los temas
        this.temaDefaults = {
            'default': {
                '--primary-color': '#4e73df',
                '--secondary-color': '#1cc88a',
                '--background-color': '#f8f9fc',
                '--text-color': '#5a5c69',
                '--header-bg': '#ffffff',
                '--card-bg': '#ffffff'
            },
            'dark': {
                '--primary-color': '#375adc',
                '--secondary-color': '#1ab394',
                '--background-color': '#2f3136',
                '--text-color': '#e1e1e1',
                '--header-bg': '#202225',
                '--card-bg': '#36393f'
            },
            'light': {
                '--primary-color': '#6c63ff',
                '--secondary-color': '#38d39f',
                '--background-color': '#ffffff',
                '--text-color': '#333333',
                '--header-bg': '#f8f9fa',
                '--card-bg': '#ffffff'
            }
        };

        // Inicializa variables
        this.isAuthenticated = false;
        this.emailKey = '';
        this.firebaseInitialized = false;
    }

    /**
     * Inicializar el gestor de temas
     */
    init() {
        // Comprobar si el usuario está autenticado
        const userEmail = document.querySelector('meta[name="user-email"]')?.content;
        if (userEmail) {
            this.isAuthenticated = true;
            this.emailKey = userEmail;
        }

        // Aplicar tema guardado
        this.cargarTemaGuardado();
        
        // Configurar listeners para cambios en otras pestañas
        this.configurarEventoStorage();

        // Si estamos en la página de configuración, inicializar los controles
        if (document.getElementById('themeSelect')) {
            this.inicializarControles();
        }

        // Inicializar Firebase si estamos autenticados
        if (this.isAuthenticated && typeof Firebase !== 'undefined') {
            this.iniciarListenerFirebase();
            this.firebaseInitialized = true;
        }
    }

    /**
     * Cargar el tema guardado desde localStorage o sessionStorage
     */
    cargarTemaGuardado() {
        // Primero intentar cargar el tema global
        let temaSeleccionado = localStorage.getItem('selected-theme') || 'default';
        
        // Si hay un tema de usuario en la sesión, usar ese
        if (this.isAuthenticated) {
            const userTheme = sessionStorage.getItem('user-theme');
            if (userTheme) {
                temaSeleccionado = userTheme;
            }
        }
        
        // Aplicar el tema
        this.cambiarTema(temaSeleccionado, false);
        
        // Cargar colores personalizados
        Object.entries(this.colorConfig).forEach(([cssVar, config]) => {
            let colorValue;
            
            // Intentar cargar desde sesión de usuario si está autenticado
            if (this.isAuthenticated) {
                const userColorKey = `user-${cssVar.replace('--', '').replace(/-/g, '_')}`;
                colorValue = sessionStorage.getItem(userColorKey);
            }
            
            // Si no hay color de usuario, intentar desde localStorage
            if (!colorValue) {
                colorValue = localStorage.getItem(config.key);
            }
            
            // Aplicar si existe
            if (colorValue) {
                document.documentElement.style.setProperty(cssVar, colorValue);
                // Actualizar el picker si estamos en la página de configuración
                const picker = document.querySelector(config.selector);
                if (picker) picker.value = colorValue;
                
                // Actualizar el indicador visual
                const dot = document.querySelector(`.color-dot[data-variable="${cssVar}"]`);
                if (dot) dot.style.backgroundColor = colorValue;
            }
        });
    }

    /**
     * Cambiar el tema actual
     * @param {string} tema - Nombre del tema a aplicar
     * @param {boolean} guardar - Si se debe guardar la elección (default: true)
     */
    cambiarTema(tema, guardar = true) {
        // Aplicar el data-theme al elemento HTML
        document.documentElement.setAttribute('data-theme', tema);
        
        // Si no es un tema personalizado, establecer los colores por defecto
        if (tema !== 'custom' && this.temaDefaults[tema]) {
            Object.entries(this.temaDefaults[tema]).forEach(([cssVar, valor]) => {
                document.documentElement.style.setProperty(cssVar, valor);
                
                // Actualizar el picker si estamos en la página de configuración
                const config = this.colorConfig[cssVar];
                if (config) {
                    const picker = document.querySelector(config.selector);
                    if (picker) picker.value = valor;
                    
                    // Actualizar el indicador visual
                    const dot = document.querySelector(`.color-dot[data-variable="${cssVar}"]`);
                    if (dot) dot.style.backgroundColor = valor;
                }
            });
        }
        
        // Guardar la elección si se solicita
        if (guardar) {
            localStorage.setItem('selected-theme', tema);
            
            // Si el usuario está autenticado, guardar en Firebase
            if (this.isAuthenticated && this.firebaseInitialized) {
                Firebase.guardarTema(this.emailKey, tema);
            }
        }
        
        // Actualizar el selector de tema si estamos en la página de configuración
        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect) {
            themeSelect.value = tema;
        }
    }

    /**
     * Aplica un color personalizado
     * @param {string} cssVar - Variable CSS a modificar (ej: --primary-color)
     * @param {string} valor - Valor hexadecimal del color
     * @param {boolean} guardar - Si se debe guardar la elección (default: true)
     */
    aplicarColor(cssVar, valor, guardar = true) {
        // Verificar si la variable CSS está en nuestra configuración
        const config = this.colorConfig[cssVar];
        if (!config) return;
        
        // Aplicar el color
        document.documentElement.style.setProperty(cssVar, valor);
        
        // Actualizar el indicador visual
        const dot = document.querySelector(`.color-dot[data-variable="${cssVar}"]`);
        if (dot) dot.style.backgroundColor = valor;
        
        // Guardar la elección si se solicita
        if (guardar) {
            localStorage.setItem(config.key, valor);
            
            // Cambiar a tema personalizado
            this.cambiarTema('custom');
            
            // Si el usuario está autenticado, guardar en Firebase
            if (this.isAuthenticated && this.firebaseInitialized) {
                Firebase.guardarColor(this.emailKey, cssVar, valor);
            }
        }
    }

    /**
     * Restablecer los colores a los valores por defecto
     */
    restablecerColores() {
        const temaActual = document.documentElement.getAttribute('data-theme') || 'default';
        
        // Aplicar colores del tema actual
        if (this.temaDefaults[temaActual]) {
            Object.entries(this.temaDefaults[temaActual]).forEach(([cssVar, valor]) => {
                document.documentElement.style.setProperty(cssVar, valor);
                
                // Eliminar del localStorage
                const config = this.colorConfig[cssVar];
                if (config) {
                    localStorage.removeItem(config.key);
                    
                    // Actualizar el picker si estamos en la página de configuración
                    const picker = document.querySelector(config.selector);
                    if (picker) picker.value = valor;
                    
                    // Actualizar el indicador visual
                    const dot = document.querySelector(`.color-dot[data-variable="${cssVar}"]`);
                    if (dot) dot.style.backgroundColor = valor;
                }
            });
        }
        
        // Si el usuario está autenticado, eliminar colores de Firebase
        if (this.isAuthenticated && this.firebaseInitialized) {
            Object.keys(this.colorConfig).forEach(cssVar => {
                Firebase.guardarColor(this.emailKey, cssVar, null);
            });
        }
    }

    /**
     * Inicializar controles en la página de configuración
     */
    inicializarControles() {
        // Inicializar selector de tema
        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect) {
            // Establecer valor inicial
            themeSelect.value = document.documentElement.getAttribute('data-theme') || 'default';
            
            // Añadir listener de cambio
            themeSelect.addEventListener('change', () => {
                this.cambiarTema(themeSelect.value);
            });
        }
        
        // Inicializar color pickers
        Object.entries(this.colorConfig).forEach(([cssVar, config]) => {
            const picker = document.querySelector(config.selector);
            if (picker) {
                // Establecer valor inicial
                const currentValue = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
                if (currentValue) {
                    picker.value = currentValue;
                }
                
                // Inicializar dot
                const dot = document.querySelector(`.color-dot[data-variable="${cssVar}"]`);
                if (dot) dot.style.backgroundColor = picker.value;
                
                // Añadir listener de cambio
                picker.addEventListener('input', () => {
                    this.aplicarColor(cssVar, picker.value);
                });
            }
        });
        
        // Inicializar botón de reset
        const resetBtn = document.getElementById('resetColorsBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.restablecerColores();
            });
        }
    }

    /**
     * Configurar evento de storage para sincronización entre pestañas
     */
    configurarEventoStorage() {
        window.addEventListener('storage', (event) => {
            // Si cambió el tema seleccionado
            if (event.key === 'selected-theme') {
                this.cambiarTema(event.newValue, false);
            }
            
            // Si cambió algún color personalizado
            Object.values(this.colorConfig).forEach(config => {
                if (event.key === config.key) {
                    const cssVar = Object.keys(this.colorConfig).find(
                        key => this.colorConfig[key].key === event.key
                    );
                    if (cssVar) {
                        this.aplicarColor(cssVar, event.newValue, false);
                    }
                }
            });
        });
    }

    /**
     * Iniciar listener de Firebase para sincronización entre dispositivos
     */
    iniciarListenerFirebase() {
        if (!this.isAuthenticated || !this.emailKey) return;
        
        firebase.database().ref(`usuarios/${this.emailKey}/preferencias`)
            .on('value', snapshot => {
                const prefs = snapshot.val() || {};
                
                // Aplicar tema si existe
                if (prefs.tema) {
                    this.cambiarTema(prefs.tema, false);
                    console.log("Tema aplicado desde Firebase:", prefs.tema);
                }
                
                // Aplicar colores personalizados si existen
                if (prefs.colores) {
                    Object.entries(prefs.colores).forEach(([nombreColor, valor]) => {
                        if (valor) {
                            const cssVar = '--' + nombreColor.replace(/_/g, '-');
                            this.aplicarColor(cssVar, valor, false);
                        }
                    });
                    console.log("Colores personalizados aplicados desde Firebase.");
                }
            });
    }
}

// Crear instancia global del ThemeManager
const themeManager = new ThemeManager();

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    themeManager.init();
});
