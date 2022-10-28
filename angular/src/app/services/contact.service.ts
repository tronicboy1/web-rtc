import { Injectable } from "@angular/core";
import { app } from "@custom-firebase/firebase";
import { getDatabase, ref, get, onValue, set } from "firebase/database";
import { Observable } from "rxjs";
import { AuthService } from "./auth.service";
import { UidRegisterService } from "./uid-register.service";

export type Contact = { uid: string; email: string };
export type Contacts = Contact[];

@Injectable({
  providedIn: "root",
})
export class ContactService {
  static contactsPath = "contacts";
  private db = getDatabase(app);

  constructor(private authService: AuthService, private uidRegisterService: UidRegisterService) {}

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
      return Promise.all([get(ref), this.uidRegisterService.getTheirUid(email)]).then(([contactsResult, newUid]) => {
        const oldContacts = (contactsResult.val() as Contacts | undefined) ?? [];
        const alreadyHasContact = Boolean(oldContacts.find((contact) => contact.email === email));
        if (alreadyHasContact) throw Error("Contact already exists.");
        const newContact: Contact = { email, uid: newUid };
        return set(ref, [...oldContacts, newContact]);
      });
    });
  }

  public deleteContact(emailToDelete: string) {
    const ref = this.getDocRef();
    return get(ref).then((value) => {
      const oldContacts = (value.val() as Contacts | undefined) ?? [];
      return set(
        ref,
        oldContacts.filter((contact) => contact.email !== emailToDelete),
      );
    });
  }

  private getDocRef() {
    if (!this.authService.user) throw Error("User must be logged in and available.");
    return ref(this.db, `users/${this.authService.user.uid}/${ContactService.contactsPath}`);
  }
}
