/*
  Firebase Configuration - Teléfono (Dialer PWA)
  Ubicación: carpetas del teléfono / firebase-config.js
  
  Este archivo utiliza la sintaxis clásica del SDK de Firebase (v8)
  requerida por la lógica global del marcador del espectador.
*/

window.SYSTEM_DIALER_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDLMjo_w85BbROcvEwuVL9aeibPkPn_4yQ",
  authDomain: "imeidata-6a37b.firebaseapp.com",
  projectId: "imeidata-6a37b",
  storageBucket: "imeidata-6a37b.firebasestorage.app",
  messagingSenderId: "156564501276",
  appId: "1:156564501276:web:a276cdebf01ae06d4580d9",
  measurementId: "G-0RJ4KTGV1W"
};

window.SYSTEM_DIALER_DOCUMENT = {
  collection: "devices",
  document: "primary"
};

window.systemDialerFirebase = (() => {
  const config = window.SYSTEM_DIALER_FIREBASE_CONFIG;
  const missingConfig = !config || !config.apiKey || config.apiKey.includes("YOUR_");

  if (missingConfig || !window.firebase) {
    return { 
      enabled: false, 
      reason: missingConfig ? "Firebase config is not set." : "Firebase SDK did not load.",
      docRef: null, 
      db: null 
    };
  }

  if (!firebase.apps.length) {
    firebase.initializeApp(config);
  }

  const db = firebase.firestore();
  const target = window.SYSTEM_DIALER_DOCUMENT;

  return {
    enabled: true,
    reason: "",
    db,
    docRef: db.collection(target.collection).doc(target.document)
  };
})();
