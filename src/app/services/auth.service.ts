import { Injectable } from "@angular/core";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithEmailLink,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signOut,
  updatePassword,
  fetchSignInMethodsForEmail,
} from "firebase/auth";
import { filter, map, Observable } from "rxjs";
import type { OperatorFunction } from "rxjs";
import type { User } from "firebase/auth";
import { FirebaseAuth } from "@custom-firebase/inheritables/auth";
import { UserService } from "./user.service";

export type FilteredAuthState = OperatorFunction<User | null, User>;

@Injectable({
  providedIn: "root",
})
export class AuthService extends FirebaseAuth {
  public user: User | null = null;

  constructor(private userService: UserService) {
    super();
  }

  public createUser(email: string, password: string) {
    return createUserWithEmailAndPassword(this.auth, email, password).then((creds) => {
      this.user = creds.user;
      this.userService.setUidRecord(email, this.user.uid);
      return creds;
    });
  }

  public signInUser(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password).then((creds) => {
      this.user = creds.user;
      this.userService.setUidRecord(email, this.user.uid);
      return creds;
    });
  }

  public sendSignInEmail(email: string) {
    return signInWithEmailLink(this.auth, email);
  }

  public sendPasswordResetEmail(email: string) {
    return sendPasswordResetEmail(this.auth, email);
  }

  public changePassword(email: string, password: string, newPassword: string) {
    if (!this.user) throw Error("Cannot change password if not logged in.");
    return updatePassword(this.user, newPassword);
  }

  public signOutUser() {
    if (!this.user) throw Error("User data was not available.");
    this.userService.setOnlineStatus(this.user.uid, "offline");
    return signOut(this.auth).then(() => {
      this.user = null;
    });
  }

  public getAuthState() {
    return new Observable<User | null>((observer) => {
      let unsubscribe = onAuthStateChanged(this.auth, (user) => {
        this.user = user;
        observer.next(user);
      });
      return unsubscribe;
    });
  }

  /**
   * Waits for auth state to be non-null User.
   */
  public waitForUser() {
    return this.getAuthState().pipe(filter((user) => Boolean(user)) as FilteredAuthState);
  }

  public getEmail() {
    return this.getAuthState().pipe(map((user) => (user ? user.email : null)));
  }

  public getUid() {
    return this.getAuthState().pipe(map((user) => (user ? user.uid : null)));
  }

  public checkIfUserExists(email: string) {
    return fetchSignInMethodsForEmail(this.auth, email).then((result) => {
      if (!(result instanceof Array)) return false;
      return Boolean(result.length);
    });
  }
}
