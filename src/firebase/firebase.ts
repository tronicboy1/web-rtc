// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { connectDatabaseEmulator, getDatabase } from "firebase/database";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { environment } from "../environments/environment";
import { firebaseConfig } from "./config";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

if (!environment.production) {
  const firestore = getFirestore(app);
  connectFirestoreEmulator(firestore, "localhost", environment.emulatorPorts.firestore);
  const db = getDatabase(app);
  connectDatabaseEmulator(
    db,
    "localhost",
    environment.emulatorPorts.database, // ここはfirebase.jsonに入っている設定に合わせましょう！
  );
}

if (self instanceof Window && environment.production) {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider("6Lcg2rciAAAAAOB7QZshJI7Dko_77izUQGdu6XJF"),
    isTokenAutoRefreshEnabled: true,
  });
}
