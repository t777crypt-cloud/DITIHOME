// =========================================================
// ВСТАВЬТЕ СЮДА СВОИ КЛЮЧИ ИЗ FIREBASE
// Project settings -> General -> "Your apps" -> SDK setup and configuration
// Инструкция, где это взять — в файле README.md
// =========================================================
const firebaseConfig = {
  apiKey: "ВСТАВЬТЕ_СЮДА",
  authDomain: "ВСТАВЬТЕ_СЮДА.firebaseapp.com",
  projectId: "ВСТАВЬТЕ_СЮДА",
  storageBucket: "ВСТАВЬТЕ_СЮДА.appspot.com",
  messagingSenderId: "ВСТАВЬТЕ_СЮДА",
  appId: "ВСТАВЬТЕ_СЮДА"
};

// Инициализация Firebase (используем версию 10, подключена через CDN в HTML)
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();
