// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDVkc_ZlGhr_OAow9NIXPZB6uItQu6Hvdo",
  authDomain: "tfgbp-d9051.firebaseapp.com",
  databaseURL: "https://tfgbp-d9051-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "tfgbp-d9051",
  storageBucket: "tfgbp-d9051.appspot.com",
  messagingSenderId: "600087678707",
  appId: "1:600087678707:web:6b9c2cc815b5d8f8d13186",
  measurementId: "G-WZW5GBHVFB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);