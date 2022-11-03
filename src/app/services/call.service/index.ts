import { Injectable } from "@angular/core";
import { RtcService } from "@services/rtc.service";
import { UserService } from "@services/user.service";
import { set, ref as getRef, remove, onValue } from "firebase/database";
import { combineLatest, filter, map, mergeMap, Observable, of, take } from "rxjs";
import { AuthService } from "../auth.service";
import { BaseCallService } from "./base";

export type CallInvitation = { sender: string; isVideo: boolean };
export type ReadyState = boolean | undefined;

@Injectable({
  providedIn: "root",
})
export class CallService extends BaseCallService {
  private myUid: string | null = null;

  constructor(private authService: AuthService, private userService: UserService) {
    super();
    /** This should be removed and piped */
    this.authService.getUid().subscribe((uid) => {
      this.myUid = uid;
    });
  }

  protected getAuthState() {
    return this.authService.getAuthState();
  }

  public send(theirUid: string, isVideo: boolean) {
    if (!this.myUid) throw Error("Email not set.");
    if (!theirUid || typeof theirUid !== "string" || theirUid.length < 4)
      throw TypeError("Recipient must have an Id greater than 4 characters.");
    const message: CallInvitation = { sender: this.myUid, isVideo };
    const ref = getRef(this.db, `${CallService.path}/${theirUid}`);
    set(ref, message);
  }

  public cleanUp(theirUid: string) {
    return this.authService.getUid().pipe(
      take(1),
      mergeMap((uid) => {
        const theirCallRef = getRef(this.db, `${CallService.path}/${theirUid}`);
        const myCallRef = getRef(this.db, `${CallService.path}/${this.myUid}`);
        const theirRtcRef = getRef(this.db, `${RtcService.path}/${theirUid!}`);
        const myRtcRef = getRef(this.db, `${RtcService.path}/${uid}`);
        return Promise.all([remove(theirCallRef), remove(myCallRef), remove(myRtcRef), remove(theirRtcRef)]);
      }),
    );
  }

  private watchWithCallerDetails() {
    return this.watch().pipe(
      mergeMap((invitation) =>
        combineLatest([this.userService.watchUserDoc(invitation.sender).pipe(take(1)), of(invitation)]),
      ),
      map(([callerData, invitation]) => ({ ...invitation, ...callerData })),
    );
  }

  public watchWithDetailsWhileIgnoringUnknownCallers() {
    return this.authService.waitForUser().pipe(
      mergeMap((user) => combineLatest([this.watchWithCallerDetails(), this.userService.watchUserDoc(user.uid)])),
      filter(([invitation, myUserData]) => {
        const myContacts = myUserData.contacts ?? [];
        return myContacts.includes(invitation.sender);
      }),
      map(([invitation]) => invitation),
    );
  }

  static readyStatePath = "state";
  /** Sets one's ready state to let inviter know the RTCPeerConnection is setup. */
  public setMyReadyState(state: boolean) {
    return this.authService.getUid().pipe(
      take(1),
      mergeMap(
        (uid) =>
          new Observable<void>((observer) => {
            const ref = getRef(this.db, `${CallService.readyStatePath}/${uid}`);
            set(ref, state)
              .then(() => observer.next())
              .catch((error) => observer.error(error))
              .finally(() => observer.complete());
          }),
      ),
    );
  }

  /** Watch invitee's ready state. */
  public watchTheirReadyState(uid: string) {
    return new Observable<ReadyState>((observer) => {
      const ref = getRef(this.db, `${CallService.readyStatePath}/${uid}`);
      let unsubscribe = onValue(
        ref,
        (snapshot) => {
          const data = snapshot.val() as ReadyState;
          console.log("CALL: Ready state received", data);
          observer.next(data);
        },
        observer.error,
      );
      return unsubscribe;
    });
  }
}
