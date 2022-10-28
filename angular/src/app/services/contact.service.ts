import { Injectable } from "@angular/core";
import { app } from "@custom-firebase/firebase";
import { getDatabase, ref, get, onValue, set, remove } from "firebase/database";
import { Observable } from "rxjs";
import { AuthService } from "./auth.service";

export type Contacts = string[];

@Injectable({
  providedIn: "root",
})
export class ContactService {
  static contactsPath = "contacts";
  private db = getDatabase(app);

  constructor(private authService: AuthService) {}

  public getContacts() {
    const ref = this.getDocRef();
    return get(ref).then((value) => (value.val() as Contacts | undefined) ?? []);
  }

  public watchContacts() {
    const ref = this.getDocRef();
    return new Observable<Contacts>((observer) => {
      let unsubscribe = onValue(ref, (snapshot) => {
        const data = (snapshot.val() as Contacts | undefined) ?? [];
        observer.next(data);
      });
      return unsubscribe;
    });
  }

  public addContact(email: string) {
    return this.authService.checkIfUserExists(email).then((exists) => {
      if (!exists) throw Error("Cannot add non-existant email.");
      const ref = this.getDocRef();
      return get(ref).then((value) => {
        const oldContacts = (value.val() as Contacts | undefined) ?? [];
        if (oldContacts.includes(email)) throw Error("Email already exists.");
        return set(ref, [...oldContacts, email]);
      });
    });
  }

  public deleteContact(emailToDelete: string) {
    const ref = this.getDocRef();
    return get(ref).then((value) => {
      const oldContacts = (value.val() as Contacts | undefined) ?? [];
      return set(
        ref,
        oldContacts.filter((email) => email !== emailToDelete),
      );
    });
  }

  private getDocRef() {
    if (!this.authService.user) throw Error("User must be logged in and available.");
    return ref(this.db, `users/${this.authService.user.uid}/${ContactService.contactsPath}`);
  }
}
