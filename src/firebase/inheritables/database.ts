import { firebaseConfig } from "@custom-firebase/config";
import { initializeApp } from "firebase/app";
import { connectDatabaseEmulator, getDatabase } from "firebase/database";
import { environment } from "../../environments/environment";

export class FirebaseDatabase {
  /** Must reinit app for service worker. */
  protected app = initializeApp(firebaseConfig);
  protected db = getDatabase(this.app);

  constructor() {
    if (!environment.production) {
      connectDatabaseEmulator(
        this.db,
        "localhost",
        environment.emulatorPorts.database, // ここはfirebase.jsonに入っている設定に合わせましょう！
      );
    }
  }
}
