import { app } from "@custom-firebase/firebase";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { environment } from "src/environments/environment";

export class FirebaseFirestore {
  protected db = getFirestore(app);

  constructor() {
    if (!environment.production) {
      connectFirestoreEmulator(this.db, "localhost", environment.emulatorPorts.firestore);
    }
  }
}
