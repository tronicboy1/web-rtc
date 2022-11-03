import { Injectable } from "@angular/core";
import { doc, updateDoc } from "firebase/firestore";
import { combineLatest, map, mergeMap, of, tap, takeUntil, Subject } from "rxjs";
import { AuthService } from "./auth.service";
import { UserData, UserService } from "./user.service";

@Injectable({
  providedIn: "root",
})
export class ContactService extends UserService {
  constructor(private authService: AuthService, private userService: UserService) {
    super();
  }

  public watchContacts(subject: Subject<void>) {
    return this.authService.waitForUser().pipe(
      mergeMap((user) => this.watchUserDoc(user.uid)),
      map((userData) => userData.contacts ?? []),
      tap((contacts) => console.log("CONTACTS RESET", contacts)),
      mergeMap((contacts) =>
        contacts.length
          ? combineLatest(contacts.map((uid) => this.watchUserDoc(uid).pipe(takeUntil(subject))))
          : of([]),
      ),
      map((contactsWithData) =>
        contactsWithData.map((contact) => {
          console.log("CONTACT", contact);
          const theirContactsArray = contact.contacts ?? [];
          const hasMyContact = theirContactsArray.includes(this.authService.user!.uid);
          const unknownStatusContact: UserData = { ...contact, status: "unknown" };
          return hasMyContact ? contact : unknownStatusContact;
        }),
      ),
    );
  }

  public addContact(email: string) {
    const uid = this.authService.user?.uid;
    if (!uid) throw Error("User must be logged in to add contact.");
    return this.authService.checkIfUserExists(email).then((exists) => {
      if (!exists) throw Error("Cannot add non-existant email.");
      const ref = this.getDocRef();
      return Promise.all([this.getUserData(uid), this.userService.getTheirUid(email)]).then(([userData, newUid]) => {
        if (!userData) throw Error("uid was invalid");
        if (userData.email === email) throw Error("You cannot add yourself.");
        const oldContacts = userData.contacts ?? [];
        const alreadyHasContact = Boolean(oldContacts.find((contact) => contact === newUid));
        if (alreadyHasContact) throw Error("Contact already exists.");
        return updateDoc(ref, { contacts: [...oldContacts, newUid] });
      });
    });
  }

  public deleteContact(uidToDelete: string) {
    const myUid = this.authService.user?.uid;
    if (!myUid) throw Error("User must be logged in to delete contact.");
    const ref = this.getDocRef();
    return this.getUserData(myUid).then((userData) => {
      if (!userData) throw Error("uid was invalid");
      const oldContacts = userData.contacts ?? [];
      return updateDoc(ref, { contacts: oldContacts.filter((contact) => contact !== uidToDelete) });
    });
  }

  private getDocRef() {
    if (!this.authService.user) throw Error("User must be logged in and available.");
    return doc(this.db, UserService.usersPath, this.authService.user.uid);
  }
}
