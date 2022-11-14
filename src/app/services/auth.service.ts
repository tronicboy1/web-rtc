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
  updateEmail,
  updateProfile,
} from "firebase/auth";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { filter, map, Observable } from "rxjs";
import type { OperatorFunction } from "rxjs";
import type { User } from "firebase/auth";
import { FirebaseAuth } from "@custom-firebase/inheritables/auth";
import { UserService } from "./user.service";
import { app } from "@custom-firebase/firebase";

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

  public changeEmail(newEmail: string) {
    const { currentUser } = this.auth;
    if (!currentUser) throw Error("Cannot change email if not logged in.");
    return updateEmail(currentUser, newEmail).then(() => this.userService.setUidRecord(newEmail, currentUser.uid));
  }

  public updateAccount(accountData: Parameters<typeof updateProfile>[1], photo?: File) {
    const { currentUser } = this.auth;
    if (!currentUser) throw Error("Cannot change account if not logged in.");
    return Promise.resolve(photo ? this.uploadAvatar(currentUser.uid, photo) : undefined).then((photoURL) => {
      const data = photoURL ? Object.assign(accountData, { photoURL }) : accountData;
      return Promise.all([updateProfile(currentUser, data), this.userService.updateUserRecord(currentUser.uid, data)]);
    });
  }

  private uploadAvatar(uid: string, photo: File) {
    const storage = getStorage(app);
    const ref = storageRef(storage, uid);
    return uploadBytes(ref, photo).then((result) => {
      const { ref } = result;
      return getDownloadURL(ref);
    });
  }

  public changePassword(newPassword: string) {
    const { currentUser } = this.auth;
    if (!currentUser) throw Error("Cannot change password if not logged in.");
    return updatePassword(currentUser, newPassword);
  }

  public signOutUser() {
    const { currentUser } = this.auth;
    if (!currentUser) throw Error("User data was not available.");
    this.userService.setOnlineStatus(currentUser.uid, "offline");
    return signOut(this.auth);
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

  public getUid() {
    return this.waitForUser().pipe(map((user) => user.uid));
  }

  public checkIfUserExists(email: string) {
    return fetchSignInMethodsForEmail(this.auth, email).then((result) => {
      if (!(result instanceof Array)) return false;
      return Boolean(result.length);
    });
  }
}
