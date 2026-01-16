// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBadXcmq0pVgMnc9lbanJFvukdncZ6wc00",
  authDomain: "electro-plan-45d86.firebaseapp.com",
  projectId: "electro-plan-45d86",
  storageBucket: "electro-plan-45d86.firebasestorage.app",
  messagingSenderId: "878184780892",
  appId: "1:878184780892:web:bef1dbff20cfabbc504299",
  measurementId: "G-342XBXLHZ0"
};
// Ініціалізація
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };