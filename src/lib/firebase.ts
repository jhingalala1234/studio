// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD-kMfX1zbsDDriMrrjHuK2RkKqeqxObvk",
  authDomain: "cloudx-central-dashboard.firebaseapp.com",
  projectId: "cloudx-central-dashboard",
  storageBucket: "cloudx-central-dashboard.firebasestorage.app",
  messagingSenderId: "1059425045441",
  appId: "1:1059425045441:web:e34e43e9d905b9ff8f3d40",
  measurementId: "G-HF7FC400N0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
