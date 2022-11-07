import { Injectable } from "@angular/core";
import { FirebaseFirestore } from "@custom-firebase/inheritables/firestore";
import {
  collection,
  where,
  query,
  getDocs,
  setDoc,
  addDoc,
  getDoc,
  doc,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import type { DocumentReference, DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import { map, mergeMap, Observable, take, of } from "rxjs";
import { AuthService } from "./auth.service";

/**
 * Firestore Collection Structure:
 *
 * rooms
 * - roomId
 * -- members: uid[]
 * -- messages
 * --- messageId
 * ---- message: string
 * ---- sender: uid
 * ---- sentAt: number
 */

type Room = {
  members: string[];
  messages: Record<string, Message>;
};
type Message = {
  sender: string;
  sentAt: number;
  message: string;
  readBy: string[];
};

@Injectable({
  providedIn: "root",
})
export class ChatService extends FirebaseFirestore {
  static roomsPath = "rooms";
  static messagesPath = "messages";
  private roomsRef = collection(this.firestore, ChatService.roomsPath);

  constructor(private authService: AuthService) {
    super();
  }

  private getRoom(uids: string[]) {
    return new Observable<null | string>((observer) => {
      const q = query(this.roomsRef, where("members", "array-contains", uids));
      getDocs(q)
        .then((result) => {
          if (result.empty) return observer.next(null);
          observer.next(result.docs[0].id);
        })
        .catch(observer.error)
        .finally(() => observer.complete());
    });
  }

  /** Creates room if does not exist, returns existing room if already created */
  public createRoom(theirUid: string | string[]) {
    let uids = Array.from(theirUid);
    return this.authService.getUid().pipe(
      take(1),
      mergeMap((myUid) => {
        uids.push(myUid);
        return this.getRoom(uids);
      }),
      mergeMap((room) => {
        if (room) return Promise.resolve(room);
        const newRoomData: Room = { members: uids, messages: {} };
        return addDoc(this.roomsRef, newRoomData).then((result) => doc(this.roomsRef, result.id));
      }),
    );
  }

  public watchMessages(theirUid: string | string[]) {
    let uids = Array.from(theirUid);
    let myUid = "";
    return this.authService.getUid().pipe(
      mergeMap((myUidResult) => {
        uids.push(myUid);
        myUid = myUidResult;
        return this.getRoom(uids);
      }),
      map((roomId) => {
        if (!roomId) throw Error("Room must be created before watching messages.");
        return roomId;
      }),
      mergeMap(
        (roomId) =>
          new Observable<QueryDocumentSnapshot<DocumentData>[]>((observer) => {
            const ref = collection(this.firestore, ChatService.roomsPath, roomId, ChatService.messagesPath);
            const q = query(ref, orderBy("sentAt", "desc"));
            return onSnapshot(q, (snapshot) => observer.next(snapshot.docs), observer.error, observer.complete);
          }),
      ),
      map((docs) => docs.map((doc) => doc.data() as Message)),
    );
  }

  public sendMessage(roomId: string, message: string) {
    const roomRef = doc(this.firestore, ChatService.roomsPath, roomId);
    const checkIfRoomExistsPromise = getDoc(roomRef).then((result) => result.exists());
    return of(checkIfRoomExistsPromise).pipe(
      mergeMap((roomExists) => {
        if (!roomExists) throw Error(`Chat room does not exist: ${roomId}`);
        return this.authService.getUid();
      }),
      take(1),
      mergeMap((uid) => {
        const messagesRef = collection(roomRef, ChatService.messagesPath);
        const newMessage: Message = { message: message.trim(), sender: uid, sentAt: Date.now(), readBy: [] };
        return addDoc(messagesRef, newMessage)
      }),
    );
  }
}
