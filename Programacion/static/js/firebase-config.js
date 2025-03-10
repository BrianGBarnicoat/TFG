/**
 * Configuración de Firebase para VytalGym
 * Este archivo inicializa la conexión con Firebase en el lado del cliente
 */

(function() {
  // Comprobar si Firebase ya está inicializado
  if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
    console.log("Firebase ya está inicializado");
    return;
  }

  // Configuración de Firebase (reemplazar con tus propios valores)
  const firebaseConfig = {
    apiKey: "AIzaSyBz733UfE2EFlvPnRAF_FXKHdxRmBjml-Q",
    authDomain: "tfgbp-d9051.firebaseapp.com",
    databaseURL: "https://tfgbp-d9051-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "tfgbp-d9051",
    storageBucket: "tfgbp-d9051.appspot.com",
    messagingSenderId: "83852378125",
    appId: "1:83852378125:web:a7cc8ff0cfebfe3d19be1f"
  };

  try {
    // Inicializar Firebase
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase inicializado correctamente");
    
    // Comprobar conexión
    const connectedRef = firebase.database().ref(".info/connected");
    connectedRef.on("value", (snap) => {
      if (snap.val() === true) {
        console.log("Conectado a Firebase Realtime Database");
      } else {
        console.log("No conectado a Firebase Realtime Database");
      }
    });
  } catch (error) {
    console.error("Error al inicializar Firebase:", error);
  }
})();

// Función para guardar tema directamente en Firebase
function guardarTemaEnFirebase(emailKey, tema) {
  if (!firebaseInitialized) {
    if (!inicializarFirebase()) {
      console.error("No se puede guardar el tema: Firebase no está disponible");
      return false;
    }
  }
  
  try {
    console.log(`Guardando tema ${tema} para usuario ${emailKey} en Firebase...`);
    const userRef = firebase.database().ref(`usuarios/${emailKey}/preferencias`);
    userRef.child('tema').set(tema);
    userRef.child('ultima_actualizacion').set(new Date().toISOString());
    console.log("✅ Tema guardado correctamente en Firebase");
    return true;
  } catch (error) {
    console.error("❌ Error al guardar tema en Firebase:", error);
    return false;
  }
}

// Función para guardar color directamente en Firebase
function guardarColorEnFirebase(emailKey, cssVar, valor) {
  if (!firebaseInitialized) {
    if (!inicializarFirebase()) {
      console.error("No se puede guardar el color: Firebase no está disponible");
      return false;
    }
  }
  
  try {
    // Convertir nombre CSS a formato Firebase (--primary-color -> primary_color)
    const colorKey = cssVar.replace('--', '').replace('-', '_');
    const userRef = firebase.database().ref(`usuarios/${emailKey}/preferencias/colores`);
    
    if (valor === null) {
      console.log(`Eliminando color ${colorKey} para usuario ${emailKey}...`);
      userRef.child(colorKey).remove();
    } else {
      console.log(`Guardando color ${colorKey}=${valor} para usuario ${emailKey}...`);
      userRef.child(colorKey).set(valor);
    }
    
    // Actualizar timestamp
    firebase.database().ref(`usuarios/${emailKey}/preferencias`).child('ultima_actualizacion').set(new Date().toISOString());
    console.log("✅ Color guardado correctamente en Firebase");
    return true;
  } catch (error) {
    console.error("❌ Error al guardar color en Firebase:", error);
    return false;
  }
}

// Función para probar la conexión a Firebase
function probarConexionFirebase() {
  return new Promise((resolve, reject) => {
    if (!firebaseInitialized) {
      if (!inicializarFirebase()) {
        reject(new Error("Firebase no está disponible"));
        return;
      }
    }
    
    const testRef = firebase.database().ref('.info/connected');
    const timeout = setTimeout(() => {
      reject(new Error("Tiempo de espera agotado"));
    }, 5000);
    
    testRef.on('value', snapshot => {
      clearTimeout(timeout);
      
      if (snapshot.val() === true) {
        resolve({
          status: 'connected',
          message: 'Conectado a Firebase correctamente'
        });
      } else {
        reject(new Error("No se pudo conectar a Firebase"));
      }
    }, error => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

// Exponer las funciones globalmente
window.Firebase = {
  init: inicializarFirebase,
  guardarTema: guardarTemaEnFirebase,
  guardarColor: guardarColorEnFirebase,
  probarConexion: probarConexionFirebase
};

// Si la página ya terminó de cargar, intentar inicializar Firebase
document.addEventListener('DOMContentLoaded', function() {
  // Re-intentar inicializar Firebase si no se hizo antes
  if (!firebaseInitialized) {
    inicializarFirebase();
  }
});
