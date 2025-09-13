(function(){
  try {
    if (!window.firebase) {
      console.error('Firebase SDK non chargé — vérifiez les balises <script> firebase-app-compat et firebase-database-compat.');
      return;
    }
    const firebaseConfig = {
      apiKey: "AIzaSyCJ1HWyWcI6fGeZ19GQjjML_dgI1HMo4MA",
      authDomain: "les-jeux-subway.firebaseapp.com",
      databaseURL: "https://les-jeux-subway-default-rtdb.europe-west1.firebasedatabase.app",
      projectId: "les-jeux-subway",
      storageBucket: "les-jeux-subway.firebasestorage.app",
      messagingSenderId: "489426965676",
      appId: "1:489426965676:web:92596860ec5950bf6ffb09"
    };
    if (!firebase.apps || !firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
  } catch (e) {
    console.error('Erreur d\'initialisation Firebase', e);
  }
})();

