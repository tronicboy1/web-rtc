import { Injectable } from "@angular/core";
import { app } from "@custom-firebase/firebase";
import { AuthService } from "./auth.service";
import { getDatabase, set, ref as getRef, onValue, remove } from "firebase/database";
import { filter, Observable } from "rxjs";

type Message = CallInvitation & { value: string };
type Content = {
  description?: RTCSessionDescription;
  candidate?: RTCIceCandidate | null;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
};
export type CallInvitation = { sender: string; value: Content; isVideo?: boolean };

@Injectable({
  providedIn: "root",
})
export class CallService {
  private db = getDatabase(app);
  private myUid: string | null = null;
  public lastOffer?: CallInvitation;

  constructor(private authService: AuthService) {
    this.authService.getUid().subscribe((uid) => {
      this.myUid = uid;
    });
  }

  public send(theirUid: string, value: Content, isVideo = false) {
    if (!this.myUid) throw Error("Email not set.");
    if (!theirUid || typeof theirUid !== "string" || theirUid.length < 4)
      throw TypeError("Recipient must have an Id greater than 4 characters.");
    const message: Message = { sender: this.myUid, value: JSON.stringify(value), isVideo };
    const ref = getRef(this.db, theirUid);
    set(ref, message);
  }

  public watch() {
    if (!this.myUid) throw Error("Email not set.");
    const ref = getRef(this.db, this.myUid);
    return new Observable<CallInvitation>((observer) => {
      let unsubscribe = onValue(ref, (snapshot) => {
        const data = snapshot.val() as Message | null;
        if (!data) return;
        observer.next({ ...data, value: JSON.parse(data.value) });
      });
      return unsubscribe;
    });
  }

  public watchForInvitations() {
    return this.watch().pipe(filter((data) => Boolean(data.value.offer)));
  }
}
