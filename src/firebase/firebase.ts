// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { environment } from "../environments/environment";
import { firebaseConfig } from "./config";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

if (!environment.production) {
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

if (self instanceof Window && environment.production) {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider("6Lcg2rciAAAAAOB7QZshJI7Dko_77izUQGdu6XJF"),
    isTokenAutoRefreshEnabled: true,
  });
}

declare var self: {
  FIREBASE_APPCHECK_DEBUG_TOKEN: boolean | undefined;
};
