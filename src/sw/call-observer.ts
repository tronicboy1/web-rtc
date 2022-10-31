import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { Observable } from "rxjs";
import { getDatabase } from "firebase/database";
import { BaseCallService } from "@services/call.service/base";

export class CallObserver extends BaseCallService {
  private auth = getAuth(this.app);
  protected db = getDatabase(this.app);

  protected getAuthState() {
    return new Observable<User | null>((observer) => {
      const unsubscribe = onAuthStateChanged(this.auth, observer);
      return unsubscribe;
    });
  }
}
