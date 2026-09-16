/* ==========================================================================
   Firebase
   ========================================================================== */
// TODO: replace with the config object from Firebase console → Project settings
// → General → Your apps → SDK setup and configuration. See the setup guide.
const firebaseConfig = {
  apiKey: "AIzaSyAD1wFuxNTvY-VbAb19dlpRzG43TmXIl0o",
  authDomain: "coursecompass-fdf69.firebaseapp.com",
  projectId: "coursecompass-fdf69",
  storageBucket: "coursecompass-fdf69.firebasestorage.app",
  messagingSenderId: "500139863404",
  appId: "1:500139863404:web:d58748f5ac3b3ccddf1749"
};
firebase.initializeApp(firebaseConfig);
const auth=firebase.auth();
const db=firebase.firestore();
const FieldValue=firebase.firestore.FieldValue;
