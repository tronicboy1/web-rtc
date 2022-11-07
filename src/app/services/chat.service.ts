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
  limit,
  arrayUnion,
  updateDoc
} from "firebase/firestore";
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
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
 * ---- Message
 */

export type Room = {
  members: string[];
  messages: Record<string, Message>;
};
export type Message = {
  sender: string;
  sentAt: number;
  message: string;
  readBy: string[];
};
export type DetailedMessage = Message & { id: string; viewed: boolean };

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

  public getRoomById(roomId: string) {
    return new Observable<Room | null>((observer) => {
      const ref = doc(this.firestore, ChatService.roomsPath, roomId);
      getDoc(ref)
        .then((result) => {
          const exists = result.exists();
          if (!exists) return observer.next(null);
          const data = result.data() as Room;
          observer.next(data);
        })
        .catch(observer.error)
        .finally(() => observer.complete());
    });
  }

  public getRoom(uids: string[]) {
    return new Observable<null | string>((observer) => {
      const q = query(this.roomsRef, where("members", "array-contains-any", uids));
      getDocs(q)
        .then((result) => {
          if (result.empty) return observer.next(null);
          /**
           * Must manually search for doc with all uids in members array.
           * https://firebase.google.com/docs/firestore/query-data/queries#array_membership
           */
          const { docs } = result;
          const room = docs.find((doc) => {
            const { members } = doc.data() as Room;
            return members.every((roomUid) => uids.includes(roomUid));
          });
          if (!room) return observer.next(null);
          observer.next(room.id);
        })
        .catch(observer.error)
        .finally(() => observer.complete());
    });
  }

  /** Creates room if does not exist, returns existing room if already created */
  public createRoom(theirUid: string | string[]) {
    let uids = theirUid instanceof Array ? [...theirUid] : [theirUid];
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

  public watchLatestMessage(theirUid: string | string[]) {
    let uids = theirUid instanceof Array ? [...theirUid] : [theirUid];
    let myUid = "";
    return this.authService.getUid().pipe(
      mergeMap((myUidResult) => {
        myUid = myUidResult;
        uids.push(myUid);
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
            const q = query(ref, orderBy("sentAt", "desc"), limit(1));
            return onSnapshot(q, (snapshot) => observer.next(snapshot.docs), observer.error, observer.complete);
          }),
      ),
      map((docs) => docs.map((doc) => doc.data() as Message)),
    );
  }

  public watchMessagesByRoomId(roomId: string): Observable<DetailedMessage[]> {
    let myUid: string;
    return this.authService.getUid().pipe(
      mergeMap((uid) => {
        myUid = uid;
        return new Observable<QueryDocumentSnapshot<DocumentData>[]>((observer) => {
          const ref = collection(this.firestore, ChatService.roomsPath, roomId, ChatService.messagesPath);
          const q = query(ref, orderBy("sentAt", "asc"));
          return onSnapshot(q, (snapshot) => observer.next(snapshot.docs), observer.error, observer.complete);
        });
      }),
      map((docs) =>
        docs.map((doc) => {
          const data = doc.data() as Message;
          const id = doc.id;
          const viewed = data.sender === myUid || data.readBy.includes(myUid);
          return { ...data, id, viewed };
        }),
      ),
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
        return addDoc(messagesRef, newMessage);
      }),
    );
  }

  public addReaderToMessage(roomId: string, messageId: string, uid: string) {
    const ref = doc(this.firestore, ChatService.roomsPath, roomId, ChatService.messagesPath, messageId);
    return updateDoc(ref, { readBy: arrayUnion(uid) })
  }
}
