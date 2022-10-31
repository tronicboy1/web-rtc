import { Injectable } from "@angular/core";
import { FirebaseFirestore } from "@custom-firebase/inheritables/firestore";
import { collection, setDoc, doc, query, where, getDocs } from "firebase/firestore";

export type UidRecord = { email: string; uid: string };

@Injectable({
  providedIn: "root",
})
export class UidRegisterService extends FirebaseFirestore {
  static path = "uids";
  private collection = collection(this.db, UidRegisterService.path);

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
