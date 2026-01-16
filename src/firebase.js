import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// --- ВАШІ КЛЮЧІ З FIREBASE CONSOLE ---
// 1. Відкрийте https://console.firebase.google.com/
// 2. Виберіть ваш проект -> Налаштування (шестерня зліва зверху) -> Project Settings
// 3. Прокрутіть вниз до розділу "Your apps" (SDK setup and configuration)
// 4. Скопіюйте дані з об'єкта firebaseConfig і вставте їх сюди замість значень нижче:

const firebaseConfig = {
  apiKey: "AIzaSyBadXcmq0pVgMnc9lbanJFvukdncZ6wc00",
  authDomain: "electro-plan-45d86.firebaseapp.com",
  projectId: "electro-plan-45d86",
  storageBucket: "electro-plan-45d86.firebasestorage.app",
  messagingSenderId: "878184780892",
  appId: "1:878184780892:web:bef1dbff20cfabbc504299",
  measurementId: "G-342XBXLHZ0"
};

// Ініціалізація додатку Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Експорт бази даних, щоб використовувати її в App.jsx
export const db = getFirestore(app);