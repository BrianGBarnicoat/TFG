// Importa Firebase (asegúrate de incluir la librería en tu index o usar CDN, por ejemplo)
// Por ejemplo, agregar antes en login.html: <script src="https://www.gstatic.com/firebasejs/9.1.3/firebase-app.js"></script>
// y <script src="https://www.gstatic.com/firebasejs/9.1.3/firebase-auth.js"></script>

// Asegúrate de que este archivo se cargue DESPUÉS de firebase-app.js
function initFirebaseConfig() {
  if (typeof firebase === 'undefined') {
    console.error("Firebase SDK no está cargado. Asegúrate de cargar firebase-app.js primero.");
    return;
  }
  const firebaseConfig = {
    apiKey: "tu-api-key",
    authDomain: "vytalgym.firebaseapp.com",
    projectId: "vytalgym",
    storageBucket: "vytalgym.firebasestorage.app",
    messagingSenderId: "tu-messaging-sender-id",
    appId: "tu-app-id"
  };
  
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  
  // Puedes agregar aquí código adicional que dependa de Firebase
}

// Si la ventana ya terminó de cargar, se ejecuta de inmediato; si no, se espera al evento "load"
if (document.readyState === "complete") {
  initFirebaseConfig();
} else {
  window.addEventListener("load", initFirebaseConfig);
}

// Función para iniciar sesión usando Firebase Authentication
function firebaseSignIn(email, password) {
  return firebase.auth().signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      return user;
    });
}
