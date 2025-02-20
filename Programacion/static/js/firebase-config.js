// Importa Firebase (asegúrate de incluir la librería en tu index o usar CDN, por ejemplo)
// Por ejemplo, agregar antes en login.html: <script src="https://www.gstatic.com/firebasejs/9.1.3/firebase-app.js"></script>
// y <script src="https://www.gstatic.com/firebasejs/9.1.3/firebase-auth.js"></script>

// Configuración de Firebase (reemplaza con tus propios datos)
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROJECT_ID.firebaseapp.com",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_PROJECT_ID.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};

// Inicializa Firebase
firebase.initializeApp(firebaseConfig);

// Función para iniciar sesión usando Firebase Authentication
function firebaseSignIn(email, password) {
  return firebase.auth().signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // Extraer usuario y foto de perfil (si está definida)
      const user = userCredential.user;
      // Se puede actualizar la foto de perfil en el backend mediante una solicitud AJAX,
      // o almacenarlo en sessionStorage para que el servidor lo reciba posteriormente
      // Aquí se retorna el usuario
      return user;
    });
}
