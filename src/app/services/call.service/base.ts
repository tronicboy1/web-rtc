import { ref as getRef, onValue } from "firebase/database";
import { filter, map, mergeMap, Observable, OperatorFunction } from "rxjs";
import type { User } from "firebase/auth";
import { CallInvitation, Content, Message } from ".";
import { FirebaseDatabase } from "@custom-firebase/inheritables/database";

/**
 * This class is used to share logic with CallService in Angular and
 * CallObserver in the service worker.
 *
 * As it is used in the SW, App Check must not be initialized
 * and unnecessary packages must not be included to reduce SW
 * bundle size.
 */
export class BaseCallService extends FirebaseDatabase {
  static path = "calls";

  /** This must be replaced in inherited files */
  protected getAuthState() {
    return new Observable<User | null>();
  }

  protected observeCalls() {
    return this.getAuthState().pipe(
      filter((user) => user !== null),
      mergeMap(
        (user) =>
          new Observable<Message | null>((observer) => {
            if (!user) throw Error("user was null");
            const ref = getRef(this.db, `${BaseCallService.path}/${user.uid}`);
            let unsubscribe = onValue(ref, (snapshot) => {
              const data = snapshot.val() as Message | null;
              observer.next(data);
            });
            return unsubscribe;
          }),
      ),
    );
  }

  public watch() {
    return this.observeCalls().pipe(
      filter((data) => data !== null) as OperatorFunction<Message | null, Message>,
      map((data) => {
        const parsedValue = JSON.parse(data.value) as Content;
        const invitation: CallInvitation = { ...data, value: parsedValue };
        return invitation;
      }),
    );
  }

  public watchForInvitations() {
    return this.watch().pipe(filter((data) => Boolean(data.value.offer)));
  }

  public watchForCallEnd(): Observable<null> {
    return this.observeCalls().pipe(filter((data) => data === null) as OperatorFunction<Message | null, null>);
  }
}
