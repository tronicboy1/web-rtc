import { Injectable } from "@angular/core";
import { UserService } from "@services/user.service";
import type { User } from "firebase/auth";
import { set, ref as getRef, remove } from "firebase/database";
import { combineLatest, filter, mergeMap, OperatorFunction } from "rxjs";
import { AuthService } from "../auth.service";
import { BaseCallService } from "./base";

export type Message = { sender: string; value: string; isVideo: boolean };
export type Content = {
  description?: RTCSessionDescription;
  candidate?: RTCIceCandidate | null;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
};
export type CallInvitation = { sender: string; value: Content; isVideo: boolean };

@Injectable({
  providedIn: "root",
})
export class CallService extends BaseCallService {
  private myUid: string | null = null;
  //public lastOffer?: CallInvitation;

  constructor(private authService: AuthService, private userService: UserService) {
    super();
    this.authService.getUid().subscribe((uid) => {
      this.myUid = uid;
    });
  }

  protected getAuthState() {
    return this.authService.getAuthState();
  }

  public send(theirUid: string, value: Content, isVideo: boolean) {
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

  public watchWhileIgnoringUnknownCallers() {
    return this.authService.getAuthState().pipe(
      filter((user) => Boolean(user)) as OperatorFunction<User | null, User>,
      mergeMap((user) => combineLatest([this.watchForInvitations(), this.userService.watchUserDoc(user.uid)])),
    );
  }
}
