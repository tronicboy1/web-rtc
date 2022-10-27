// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBSzEqt0lBjLUASauAlTGPNOQDdqmrf1rI",
  authDomain: "web-rtc-chat-d18ab.firebaseapp.com",
  databaseURL: "https://web-rtc-chat-d18ab-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "web-rtc-chat-d18ab",
  storageBucket: "web-rtc-chat-d18ab.appspot.com",
  messagingSenderId: "355593042975",
  appId: "1:355593042975:web:4988d909d709724e6ae92a",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

if (import.meta.env.MODE === "development") {
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

export const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider("6Lcg2rciAAAAAOB7QZshJI7Dko_77izUQGdu6XJF"),
  isTokenAutoRefreshEnabled: true,
});

declare var self: {
  FIREBASE_APPCHECK_DEBUG_TOKEN: boolean | undefined;
};
