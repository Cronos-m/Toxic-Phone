/*
  Firebase initialization snippet

  1. Create a Firebase project.
  2. Enable Firestore Database.
  3. Replace the placeholder values below with your web app config.
  4. The dialer and admin page both sync with: devices/primary
*/

window.SYSTEM_DIALER_FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

window.SYSTEM_DIALER_DOCUMENT = {
  collection: "devices",
  document: "primary"
};

window.systemDialerFirebase = (() => {
  const config = window.SYSTEM_DIALER_FIREBASE_CONFIG;
  const missingConfig =
    !config ||
    !config.apiKey ||
    config.apiKey.includes("YOUR_") ||
    config.projectId.includes("YOUR_");

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
