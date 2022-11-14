import { Injectable } from "@angular/core";
import { FirebaseFirestore } from "@custom-firebase/inheritables/firestore";
import { map, Observable } from "rxjs";
import { onSnapshot, doc, updateDoc, setDoc, collection, query, where, getDocs, getDoc } from "firebase/firestore";
import type { updateProfile } from "firebase/auth";

type AccountDetails = Parameters<typeof updateProfile>[1];
export type UserStatus = "online" | "away" | "offline" | "unknown" | "new-message" | undefined;
export type UidRecord = { email: string; uid: string };
export type UserData = {
  uid: string;
  email: string;
  status?: UserStatus;
  contacts?: string[];
} & AccountDetails;

@Injectable({
  providedIn: "root",
})
export class UserService extends FirebaseFirestore {
  static usersPath = "users";
  private collection = collection(this.db, UserService.usersPath);

  constructor() {
    super();
  }

  protected getUserData(uid: string) {
    const ref = doc(this.db, UserService.usersPath, uid);
    return getDoc(ref).then((doc) => doc.data() as UserData | undefined);
  }

  public watchUserDoc(uid: string) {
    const ref = doc(this.db, UserService.usersPath, uid);
    return new Observable<UserData>((observer) => {
      let unsubscribe = onSnapshot(ref, (snapshot) => {
        const data = snapshot.data() as UserData | undefined;
        if (!data) return observer.error("Specified uid did not have a user document.");
        observer.next(data);
      });
      return unsubscribe;
    });
  }

  public watchOnlineStatus(theirUid: string) {
    return this.watchUserDoc(theirUid).pipe(map((userData) => userData.status));
  }

  public setOnlineStatus(myUid: string, status: UserStatus) {
    const ref = doc(this.db, `${UserService.usersPath}/${myUid}`);
    return updateDoc(ref, { status });
  }

  public setUidRecord(email: string, myUid: string) {
    const newUserData: UserData = { email, uid: myUid };
    const ref = doc(this.collection, myUid);
    return getDoc(ref).then((doc) => {
      const hasDoc = Boolean(doc.data());
      return hasDoc ? updateDoc(ref, newUserData) : setDoc(ref, newUserData);
    });
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

  public updateUserRecord(myUid: string, data: AccountDetails) {
    const ref = doc(this.db, `${UserService.usersPath}/${myUid}`);
    return updateDoc(ref, data);
  }
}
