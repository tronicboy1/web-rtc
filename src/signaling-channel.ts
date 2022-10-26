import { getDatabase, set, ref as getRef, onValue, remove } from "firebase/database";
import { app } from "./firebase";

type Message = { sender: string; value: string };
type Content = { description?: RTCSessionDescription; candidate?: RTCIceCandidate };

export class SignalingChannel {
  private db = getDatabase(app);
  public lastMessage: Message | undefined;
  public unsubscribe: ReturnType<typeof onValue> = () => 0;

  constructor(private username: string) {
    console.log("my id: ", this.username);
  }

  public send(recipientId: string, value: Content) {
    console.log("SIGCHAN - Recipient ID: ", recipientId);
    if (recipientId.length < 4) throw TypeError("Recipient must have an Id greater than 4 characters.");
    const message: Message = { sender: this.username, value: JSON.stringify(value) };
    const ref = getRef(this.db, recipientId);
    set(ref, message);
  }

  public subscribe(callback: (message: Content, theirUsername: string) => void) {
    const ref = getRef(this.db, this.username);
    remove(ref).then(() => {
      this.unsubscribe = onValue(ref, (snapshot) => {
        const data = snapshot.val() as Message | null;
        if (!data) return;
        callback(JSON.parse(data.value), data.sender);
      });
    });
  }
}
