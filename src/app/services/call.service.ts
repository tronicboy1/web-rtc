import { Injectable } from "@angular/core";
import { app } from "@custom-firebase/firebase";
import { AuthService } from "./auth.service";
import { getDatabase, set, ref as getRef, onValue, remove } from "firebase/database";
import { filter, Observable } from "rxjs";

type Message = { sender: string; value: string; isVideo: boolean };
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
  static path = "calls";
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
    const ref = getRef(this.db, `${CallService.path}/${theirUid}`);
    set(ref, message);
  }

  public cleanUp(theirUid: string) {
    const theirRef = getRef(this.db, `${CallService.path}/${theirUid}`);
    const myRef = getRef(this.db, `${CallService.path}/${this.myUid}`);
    return Promise.all([remove(myRef), remove(theirRef)]);
  }

  public watch() {
    if (!this.myUid) throw Error("Email not set.");
    const ref = getRef(this.db, `${CallService.path}/${this.myUid}`);
    return new Observable<CallInvitation>((observer) => {
      let unsubscribe = onValue(ref, (snapshot) => {
        const data = snapshot.val() as Message | null;
        if (!data) return;
        const parsedValue = JSON.parse(data.value) as Content;
        const invitation: CallInvitation = { ...data, value: parsedValue };
        if (invitation.value.offer) {
          this.lastOffer = invitation;
          console.log("LAST OFFER", this.lastOffer);
        }
        observer.next(invitation);
      });
      return unsubscribe;
    });
  }

  public watchForInvitations() {
    return this.watch().pipe(filter((data) => Boolean(data.value.offer)));
  }
}
