import { Injectable } from "@angular/core";
import { app } from "@custom-firebase/firebase";
import { getFirestore, collection, setDoc, doc, query, where, getDocs } from "firebase/firestore";

export type UidRecord = { email: string; uid: string };

@Injectable({
  providedIn: "root",
})
export class UidRegisterService {
  static path = "uids";
  private db = getFirestore(app);
  private collection = collection(this.db, UidRegisterService.path);

  constructor() {}

  public setUidRecord(email: string, myUid: string) {
    return setDoc(doc(this.collection, myUid), { email, uid: myUid });
  }

  public getTheirUid(email: string) {
    const q = query(this.collection, where("email", "==", email));
    return getDocs(q).then((result) => {
      const first = result.docs[0];
      if (!first) throw Error("User does not exist.");
      const data = first.data() as UidRecord;
      return data.uid;
    });
  }
}
