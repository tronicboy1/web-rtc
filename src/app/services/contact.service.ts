import { Injectable } from "@angular/core";
import { doc, updateDoc } from "firebase/firestore";
import { combineLatest, map, mergeMap, of, Subject, take, switchMap } from "rxjs";
import { AuthService } from "./auth.service";
import { ChatService } from "./chat.service";
import { UserData, UserService } from "./user.service";

@Injectable({
  providedIn: "root",
})
export class ContactService extends UserService {
  constructor(private authService: AuthService, private userService: UserService, private chatService: ChatService) {
    super();
  }

  public watchContacts() {
    return this.authService.waitForUser().pipe(
      mergeMap((user) => this.watchUserDoc(user.uid)),
      map((userData) => userData.contacts ?? []),
      switchMap((contacts) =>
        contacts.length
          ? combineLatest(
              contacts.map((uid) => combineLatest([this.watchUserDoc(uid), this.chatService.watchLatestMessage(uid)])),
            )
          : /** Must emit empty array if no contacts are left, else old contact will remain */
            of([]),
      ),
      map((contactsWithData) =>
        contactsWithData.map(([contact, [latestMessage]]) => {
          const theirContactsArray = contact.contacts ?? [];
          const hasMyContact = theirContactsArray.includes(this.authService.user!.uid);
          if (!hasMyContact) {
            const unknownStatusContact: UserData = { ...contact, status: "unknown" };
            return unknownStatusContact;
          }
          const hasNewMessage = latestMessage ? !latestMessage.viewed : false;
          if (hasNewMessage) {
            const newMessageStatusContact: UserData = { ...contact, status: "new-message" };
            return Object.assign(newMessageStatusContact, {
              latestMessage: latestMessage,
            });
          }
          return Object.assign(contact, {
            latestMessage: latestMessage,
          });
        }),
      ),
    );
  }

  public addContact(email: string) {
    let theirUid: string;
    return of(this.authService.checkIfUserExists(email)).pipe(
      mergeMap((exists) => {
        if (!exists) throw Error("Cannot add non-existant email.");
        return this.authService.getUid();
      }),
      take(1),
      mergeMap((uid) => {
        return Promise.all([this.getUserData(uid), this.userService.getTheirUid(email)]);
      }),
      mergeMap(([userData, newUid]) => {
        if (!userData) throw Error("uid was invalid");
        if (userData.email === email) throw Error("You cannot add yourself.");
        theirUid = newUid;
        const ref = this.getDocRef();
        const oldContacts = userData.contacts ?? [];
        const alreadyHasContact = Boolean(oldContacts.find((contact) => contact === newUid));
        if (alreadyHasContact) throw Error("Contact already exists.");
        return updateDoc(ref, { contacts: [...oldContacts, newUid] });
      }),
      mergeMap(() => this.chatService.createRoom(theirUid)),
    );
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
