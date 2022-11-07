import { app } from "@custom-firebase/firebase";
import { getFirestore } from "firebase/firestore";

export class FirebaseFirestore {
  protected firestore = getFirestore(app);
  protected db = this.firestore;
}
