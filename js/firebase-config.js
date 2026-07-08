const firebaseConfig = {
  apiKey: "AIzaSyDtXkdokgGA_fJaCdZ2DD4BkzzmNA4S-KM",
  authDomain: "ditihome-9cda5.firebaseapp.com",
  projectId: "ditihome-9cda5",
  storageBucket: "ditihome-9cda5.firebasestorage.app",
  messagingSenderId: "397567560052",
  appId: "1:397567560052:web:00a4a2d99bf4fcde118421"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();
